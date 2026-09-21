import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from '../../node_modules/sharp/lib/index.js';
import {svg,seed,contours} from './journal-drawing-model.mjs';
const root=dirname(fileURLToPath(import.meta.url));
if(!process.argv[2])throw Error('Pass an explicit website raster destination');
const destination=resolve(process.argv[2]);
const data=JSON.parse(await readFile(resolve(root,'entries.json'),'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(resolve(root,'screen-masters'),{recursive:true});
const outputs=[];
for(const entry of data.entries){
 const master=svg(entry),name=`journal-${entry.id}`;
 await writeFile(resolve(root,`screen-masters/${name}.svg`),master);
 const raster=await sharp(Buffer.from(master),{density:192}).resize(1200,1296).webp({lossless:true,effort:6}).toBuffer();
 await writeFile(resolve(destination,`${name}.webp`),raster);
 outputs.push({id:entry.id,sourceKey:entry.sourceKey,seed:seed(entry),wordContours:contours(entry).length,master:`screen-masters/${name}.svg`,masterSha256:sha(master),webFile:`${name}.webp`,webSha256:sha(raster),width:1200,height:1296});
}
await writeFile(resolve(root,'manifest.json'),JSON.stringify({version:1,drawnOn:data.drawingCreatedOn,modelSha256:sha(await readFile(resolve(root,'journal-drawing-model.mjs'))),inputsSha256:sha(await readFile(resolve(root,'entries.json'))),outputs},null,2)+'\n');
console.log(outputs.map(o=>`${o.id}: seed ${o.seed}; ${o.wordContours} open contours`).join('\n'));
