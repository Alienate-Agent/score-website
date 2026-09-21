import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from '../../node_modules/sharp/lib/index.js';
import {contours,sha} from '../data-score-v1/model.mjs';
import {viewPaths} from './safeguard-views.mjs';
const input=JSON.parse(await readFile(new URL('../data-score-v1/inputs.json',import.meta.url))),e=input.editions.find(e=>e.id==='safeguard');
const dir=new URL('editions/2026-09-20/safeguard-reading-views/',import.meta.url),web=new URL('../../public/entrance/assets/',import.meta.url);
await mkdir(dir,{recursive:true});
async function freeze(file,b){try{assert((await readFile(file)).equals(Buffer.from(b)),'Frozen view differs');}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(file,b,{flag:'wx'});}}
const manifest={edition:'data-score/1:safeguard:1',projection:'safeguard-views/1',outputs:[]};
for(const view of [0,1]){
 const ps=viewPaths(contours(e),view),groups=new Map();for(const p of ps){const key=p.source+'|'+p.role;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 const render=plotter=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 1000 900" width="${plotter?'250mm':'1000'}" height="${plotter?'225mm':'900'}"><title>A safeguard nobody could check — reading view ${view}</title><desc>Margin. Drawn ${e.drawnAt}. Projection of the unchanged September20 data-score/1 edition.</desc>${plotter?'':'<rect width="1000" height="900" fill="#171516"/>'}${[...groups].map(([key,ps],i)=>`<g id="layer-${i}" inkscape:groupmode="layer" inkscape:label="${key}" fill="none" stroke="${ps[0].color}" stroke-width=".85" stroke-linecap="round">${ps.map(p=>`<path opacity="${plotter?1:p.opacity}" d="${p.points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(3)+' '+y.toFixed(3)).join(' ')}"/>`).join('')}</g>`).join('')}</svg>\n`;
 const master=render(false),pen=render(true),raster=await sharp(Buffer.from(master),{density:144}).resize(1600,1440).webp({lossless:true,effort:6}).toBuffer();
 await freeze(new URL(`view-${view}.svg`,dir),master);await freeze(new URL(`view-${view}-pen-layers.svg`,dir),pen);await freeze(new URL(`data-score-safeguard-view-${view}.webp`,web),raster);
 manifest.outputs.push({view,masterSha256:sha(master),penSha256:sha(pen),webSha256:sha(raster),paths:ps.length});
}
await freeze(new URL('projection.mjs',dir),await readFile(new URL('safeguard-views.mjs',import.meta.url)));
await freeze(new URL('manifest.json',dir),JSON.stringify(manifest,null,2)+'\n');
console.log('PASS: two reading projections; frozen final safeguard edition unchanged.');
