import {mkdir,cp,rm,readFile,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/src',{recursive:true});
await cp('src/style.css','dist/src/style.css');await cp('favicon.svg','dist/favicon.svg');
// Three known, local modules; no dynamic dependencies. A classic script also
// makes the exported site usable directly from disk without a server.
const modules=await Promise.all(['ritual','audio','app'].map(n=>readFile(`src/${n}.js`,'utf8')));
const bundle=modules.map(s=>s.replace(/^import .*;$/gm,'').replace(/^export /gm,'')).join('\n');
await writeFile('dist/src/bundle.js',`(()=>{\n${bundle}\n})();`);
const html=(await readFile('index.html','utf8')).replace('type="module" src="./src/app.js"','defer src="./src/bundle.js"');await writeFile('dist/index.html',html);
console.log('Built static site in dist/');
