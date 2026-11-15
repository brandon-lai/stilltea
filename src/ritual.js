export const teas=[{name:'Green',temp:80,seconds:150,color:'#a3a65c',tin:'#657260',mark:'芽'},{name:'Oolong',temp:90,seconds:180,color:'#c38a3e',tin:'#aa8057',mark:'葉'},{name:'Black',temp:98,seconds:180,color:'#914829',tin:'#70554a',mark:'茶'},{name:'Chamomile',temp:100,seconds:300,color:'#d6b65e',tin:'#b3a170',mark:'花'}];
export const defaults={sound:true,numbers:false,fahrenheit:false,breathing:false,rain:false};
export function readSettings(storage){try{const raw=JSON.parse(storage.getItem('stilltea.settings'));return Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,typeof raw?.[k]==='boolean'?raw[k]:v]));}catch{return {...defaults}}}
export function remaining(start,seconds,now=Date.now()){return Math.max(0,seconds-(now-start)/1000)}
export function temperature(value,f){return Math.round(f?value*9/5+32:value)+'°'+(f?'F':'C')}
export function heat(value,seconds){return Math.min(100,value+seconds*7)}
