import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import sharp from '../../node_modules/sharp/lib/index.js';
import {svg,sha,contours,hand,grain} from './model.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const input=await readFile(resolve(root,'inputs.json'),'utf8'),data=JSON.parse(input);
const out=resolve(root,'editions/2026-09-20'), web=resolve(root,'../../public/entrance/assets');
await mkdir(out,{recursive:true});
async function freeze(path,bytes){try{const old=await readFile(path);assert(old.equals(Buffer.from(bytes)),`Refusing to replace frozen artifact ${path}`);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(path,bytes,{flag:'wx'});}}
const manifest={generator:'data-score/1',inputsSha256:sha(input),drawnOn:'2026-09-20',dimensions:[1000,900],outputs:[]};
for(const e of data.editions){
 assert(contours(e).length,'Unavailable data cannot produce a blank financial drawing.');
 const master=svg(e),plotter=svg(e,{plotter:true});
 const webp=await sharp(Buffer.from(master),{density:144}).resize(1600,1440).webp({lossless:true,effort:6}).toBuffer();
 await freeze(resolve(out,e.id+'.svg'),master);await freeze(resolve(out,e.id+'-pen-layers.svg'),plotter);
 await freeze(resolve(web,'data-score-'+e.id+'-v1.webp'),webp);
 manifest.outputs.push({id:e.id,edition:e.edition,masterSha256:sha(master),plotterSha256:sha(plotter),webSha256:sha(webp),paths:contours(e).length,sourceCutoff:e.sourceCutoff,sources:e.sources.map(s=>({key:s.key,bodySha256:s.bodySha256,excerptSha256:s.excerptSha256,speakerHand:hand(s.speaker),votesGrain:grain(s.votes)}))});
}
await freeze(resolve(out,'inputs.json'),input);
await freeze(resolve(out,'model.mjs'),await readFile(resolve(root,'model.mjs')));
await freeze(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest.outputs.map(({id,paths})=>({id,paths})),null,2));
