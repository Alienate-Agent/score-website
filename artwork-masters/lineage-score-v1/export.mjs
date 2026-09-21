import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from '../../node_modules/sharp/lib/index.js';
import {contours as v1,sha} from '../data-score-v1/model.mjs';
import {contours as v2} from '../journal-score-v2/model.mjs';
import {compose,inheritedPaths,svg,VERSION} from './model.mjs';
export const paths=(recipe,view=2)=>recipe.generator==='data-score/1'?v1(recipe):v2(recipe,view);
const input=await readFile(new URL('inputs.json',import.meta.url),'utf8'),d=JSON.parse(input),dir=new URL('studies/2026-09-20/',import.meta.url),web=new URL('../../public/entrance/assets/',import.meta.url);
await mkdir(dir,{recursive:true});async function freeze(file,bytes){try{assert((await readFile(file)).equals(Buffer.from(bytes)),'Refusing to overwrite '+file);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(file,bytes,{flag:'wx'});}}
const manifest={version:VERSION,status:d.status,drawnAt:d.drawnAt,inputsSha256:sha(input),outputs:[],motifs:[]};
for(const l of d.lineages){const motif=inheritedPaths(paths(l.rootRecipe),l);manifest.motifs.push({id:l.id,key:l.motifKey,sha256:sha(JSON.stringify(motif)),paths:motif.length});await freeze(new URL(l.id+'-motif.json',dir),JSON.stringify(motif)+'\n');}
for(const e of d.entries)for(const view of e.id==='art-without-service'?[0,1,2]:[2]){
 const l=d.lineages.find(l=>l.id===e.lineage),ps=compose(paths(e.recipe,view),paths(l.rootRecipe),l,e.id);
 const id=e.id+(e.id==='art-without-service'?'-'+view:''),master=svg(ps,e.recipe.title,{drawnAt:d.drawnAt}),pen=svg(ps,e.recipe.title,{drawnAt:d.drawnAt,plotter:true});
 const raster=await sharp(Buffer.from(master),{density:144}).resize(1600,1440).webp({lossless:true,effort:6}).toBuffer();
 await freeze(new URL(id+'.svg',dir),master);await freeze(new URL(id+'-pen-layers.svg',dir),pen);await freeze(new URL('lineage-'+id+'-v1.webp',web),raster);
 manifest.outputs.push({id,entry:e.id,view,lineage:l.id,masterSha256:sha(master),penSha256:sha(pen),webSha256:sha(raster),paths:ps.length});
}
for(const file of ['inputs.json','model.mjs'])await freeze(new URL(file,dir),await readFile(new URL(file,import.meta.url)));
await freeze(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');
console.log(manifest.outputs.map(x=>({id:x.id,paths:x.paths})));
