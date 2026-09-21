import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from '../../node_modules/sharp/lib/index.js';
import {svg,sha,contours,VERSION} from './model.mjs';
const input=await readFile(new URL('inputs.json',import.meta.url),'utf8'),data=JSON.parse(input);
const dir=new URL('editions/2026-09-20/',import.meta.url),web=new URL('../../public/entrance/assets/',import.meta.url);
await mkdir(dir,{recursive:true});
async function freeze(file,bytes){try{assert((await readFile(file)).equals(Buffer.from(bytes)),'Refusing to overwrite frozen '+file);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(file,bytes,{flag:'wx'});}}
const manifest={generator:VERSION,drawnOn:'2026-09-20',inputsSha256:sha(input),outputs:[]};
for(const e of data.editions.filter(e=>e.generator===VERSION))for(const view of (e.id==='art-without-service'?[0,1,2]:[2])){
 const id=e.id+(e.id==='art-without-service'?'-'+view:''),master=svg(e,{view}),pen=svg(e,{view,plotter:true});
 const raster=await sharp(Buffer.from(master),{density:144}).resize(1600,1440).webp({lossless:true,effort:6}).toBuffer();
 await freeze(new URL(id+'.svg',dir),master);await freeze(new URL(id+'-pen-layers.svg',dir),pen);await freeze(new URL('journal-score-'+id+'-v2.webp',web),raster);
 manifest.outputs.push({id,view,masterSha256:sha(master),penSha256:sha(pen),webSha256:sha(raster),paths:contours(e,view).length,sourceCutoff:e.sourceCutoff});
}
await freeze(new URL('inputs.json',dir),input);await freeze(new URL('model.mjs',dir),await readFile(new URL('model.mjs',import.meta.url)));await freeze(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');
console.log(manifest.outputs.map(o=>({id:o.id,paths:o.paths})));
