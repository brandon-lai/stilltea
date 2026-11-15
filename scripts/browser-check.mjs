// Real Chrome smoke checks. Run after npm run build and npm run dev.
// Screenshots stay in the OS temporary directory, outside the published site.
import {spawn} from 'node:child_process';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const base=process.argv[2]||'http://127.0.0.1:4173';
const profile=await mkdtemp(join(tmpdir(),'stilltea-browser-'));
const port=10000+Math.floor(Math.random()*10000);
const chrome=spawn(process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--disable-gpu','--no-first-run',`--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`,'about:blank'
],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let ws;
try {
  let target;
  for(let i=0;i<60;i++){
    try{target=(await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page')}catch{}
    if(target)break;
    await sleep(250);
  }
  assert.ok(target,'Chrome must open a debugging port');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve=>ws.onopen=resolve);
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=({data})=>{const msg=JSON.parse(data);if(msg.id){pending.get(msg.id)?.(msg);pending.delete(msg.id)}else if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text)};
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error(`CDP timeout: ${method}`))},15000);
    pending.set(n,msg=>{clearTimeout(timer);msg.error?reject(Error(JSON.stringify(msg.error))):resolve(msg.result)});
    ws.send(JSON.stringify({id:n,method,params}));
  });
  const evaluate=async expression=>{
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor=async expression=>{for(let i=0;i<160;i++){if(await evaluate(expression))return;await sleep(100)}throw Error(`Timed out: ${expression}`)};
  const step=expected=>waitFor(`document.querySelector('#ritual')?.dataset.step===${JSON.stringify(expected)}`);
  const rect=selector=>evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  const click=async selector=>{const p=await rect(selector);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1})};
  const key=async(selector,key,code)=>{await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);const windowsVirtualKeyCode=key==='Enter'?13:32;await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,text:key==='Enter'?'\r':' '});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode})};
  const shot=async name=>{await sleep(700);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,`${name}: no horizontal overflow`);const data=await send('Page.captureScreenshot',{format:'png'});await writeFile(join(tmpdir(),`stilltea-${name}.png`),Buffer.from(data.data,'base64'))};
  const drag=async(selector,target,touch=false,cancel=false)=>{
    const p=await rect(selector),end=await evaluate(`(()=>{const r=document.querySelector('#scene').getBoundingClientRect();return {x:r.x+r.width*${target.x},y:r.y+r.height*${target.y}}})()`);
    const art=selector+'-art',before=await rect(art);
    if(touch){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[end]})}
    else{await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',buttons:1,clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseMoved',...end,button:'left',buttons:1})}
    await sleep(50);const after=await rect(art);
    assert.ok(Math.abs((after.x-before.x)-(end.x-p.x))<15,`${selector} follows horizontal drag: ${JSON.stringify({before,after,p,end})}`);
    assert.ok(Math.abs((after.y-before.y)-(end.y-p.y))<15,`${selector} follows vertical drag: ${JSON.stringify({before,after,p,end})}`);
    if(touch)await send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
    else await send('Input.dispatchMouseEvent',{type:'mouseReleased',...end,button:'left',clickCount:1});
  };
  await send('Page.enable');await send('Runtime.enable');
  // Shorten only the test clock's steep wait; actual heating and input stay real.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'window.testClockOffset=0;const realNow=Date.now.bind(Date);Date.now=()=>realNow()+window.testClockOffset;'});
  for(const mode of ['mouse','touch','keyboard']){
    const mobile=mode==='touch';
    await send('Emulation.setDeviceMetricsOverride',{width:mobile?360:1200,height:mobile?760:900,deviceScaleFactor:1,mobile});
    await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:mode==='keyboard'?'reduce':'no-preference'}]});
    await send('Page.navigate',{url:base});await step('arrive');await shot(`${mode}-arrival`);
    await (mode==='keyboard'?key('#action','Enter','Enter'):click('#action'));await step('choose');await shot(`${mode}-choose`);
    await (mode==='keyboard'?key('.tin','Enter','Enter'):click('.tin'));await step('heat');await shot(`${mode}-heat`);
    // Exercise early keyboard release, then finish with automatic heating.
    if(mode==='keyboard'){
      await evaluate('document.querySelector("#kettle").focus()');
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space'});await sleep(500);
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space'});
      assert.equal(await evaluate('document.querySelector("#ritual").dataset.step'),'heat');
    }
    await (mode==='keyboard'?key('#action','Enter','Enter'):click('#action'));await step('leaves');
    if(mode==='mouse'){
      await drag('#scoop',{x:.1,y:.1});await sleep(2100);
      assert.equal(await evaluate('document.querySelector("#ritual").dataset.step'),'leaves','Missed drops preserve the step');
    }
    if(mode==='touch'){
      await drag('#scoop',{x:.514,y:.65},true,true);await sleep(2100);
      assert.equal(await evaluate('document.querySelector("#ritual").dataset.step'),'leaves','Cancelled touch preserves the step');
    }
    for(const [selector,next,target]of [['#scoop','water',{x:.514,y:.65}],['#kettle','steep',{x:.514,y:.65}],['#pot','sit',{x:.737,y:.75}]]){
      if(selector==='#pot'){
        await shot(`${mode}-steep`);await evaluate('window.testClockOffset+=301000');await step('cup');
      }
      if(mode==='keyboard')await key('#action','Enter','Enter');else await drag(selector,target,mobile);
      await step(next);
    }
    await shot(`${mode}-finished`);
    await click('#settings-open');await waitFor('document.querySelector("#settings").open');
    await click('[data-setting="fahrenheit"]');await click('[data-setting="numbers"]');
    const saved=await evaluate('localStorage.getItem("stilltea.settings")');assert.ok(saved);
    await shot(`${mode}-settings`);
    await send('Page.reload');await step('arrive');
    assert.equal(await evaluate('localStorage.getItem("stilltea.settings")'),saved);
    console.log(`PASS: ${mode} full ritual, settings persistence, responsive screenshots`);
  }
  assert.deepEqual(errors,[],'No uncaught browser errors');
} finally {
  ws?.close();chrome.kill();
  await new Promise(resolve=>chrome.exitCode!==null?resolve():chrome.once('exit',resolve));
  await rm(profile,{recursive:true,force:true});
}
