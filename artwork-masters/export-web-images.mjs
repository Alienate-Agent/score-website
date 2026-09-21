import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=dirname(fileURLToPath(import.meta.url));
if(!process.argv[2])throw new Error('Provide the explicit website image output directory.');
const destination=resolve(process.argv[2]);
const selections=[
 ['after-an-objection/screen-masters/01-proposal.svg','proposal.webp'],
 ['after-an-objection/screen-masters/02-challenge.svg','challenge.webp'],
 ['after-an-objection/screen-masters/03-after-withdrawal.svg','withdrawal.webp'],
 ...['room','support','limits'].map(id=>[`art-without-service/screen-masters/tidemark-${id}.svg`,`tidemark-${id}.webp`])
];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir(destination,{recursive:true});
const outputs=[];
for(const [source,file] of selections){
 const master=await readFile(resolve(root,source));
 const web=await sharp(master,{density:192}).resize(1200,1296,{fit:'fill'}).webp({lossless:true,effort:6}).toBuffer();
 await writeFile(resolve(destination,file),web);
 outputs.push({source,sourceSha256:hash(master),file,sha256:hash(web),width:1200,height:1296,bytes:web.length});
}
await writeFile(resolve(root,'web-exports.json'),JSON.stringify({format:'lossless WebP',outputs},null,2)+'\n');
console.log(JSON.stringify(outputs.map(({file,bytes})=>({file,bytes})),null,2));
