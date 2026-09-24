import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {dailyJournal} from '../public/daily-journal-routes.mjs';
import {ENTRANCE_ROUTES,entranceResponse} from '../lib/entrance-routes.mjs';
import {presentEditions} from '../lib/story-present.ts';
import {layers} from '../artwork-masters/daily-score-v1/model.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(dailyJournal.length,16);
assert.deepEqual(dailyJournal.map(p=>p.date),[...new Set(presentEditions.map(e=>e.asOf))]);
let vectors=0;const motifs=new Map();
for(const p of dailyJournal){
 const html=fs.readFileSync('public'+ENTRANCE_ROUTES['/journal/'+p.date],'utf8');
 for(const text of ['How this was drawn','Original words &amp; sources','Edition history','2026-09-24T21:37:32.791Z','/record#score-privacy','og:image','og:description','Copy link'])assert(html.includes(text),p.date+' '+text);
 assert(html.includes('https://taasoart.com/journal/'+p.date));
 assert(!html.includes('This address is not live'));
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
 for(const m of html.matchAll(/(?:href|src)="([^"#]+)"/g)){const u=new URL(m[1].replaceAll('&amp;','&'),'https://taasoart.com');if(u.pathname.startsWith('/entrance/')||u.pathname.startsWith('/records/'))assert(fs.existsSync('public'+u.pathname),p.date+' '+m[1]);}
 const resp=await entranceResponse(new Request('https://taasoart.com/journal/'+p.date+'/?kept=1'),{});assert.equal(resp.status,308);assert(resp.headers.get('location').endsWith(p.date+'?kept=1'));
 const manifest='artwork-masters/daily-score-v1/editions/2026-09-22/'+p.date+'.json';
 if(fs.existsSync(manifest)){
  const m=JSON.parse(fs.readFileSync(manifest));assert.equal(m.editionDate,p.date);assert.equal(m.svgSha256,hash(fs.readFileSync(manifest.replace('.json','.svg'))));assert.equal(m.webpSha256,hash(fs.readFileSync('public/entrance/assets/'+p.image)));
  for(const s of m.sources){assert.equal(hash(s.text),s.textSha256);assert.equal(s.karma,null);}for(const e of m.evidence)assert.equal(hash(fs.readFileSync('public/records/'+e.file)),e.sha256);
  const motif=JSON.stringify(layers(m).at(-1));if(motifs.has(m.family))assert.equal(motif,motifs.get(m.family));motifs.set(m.family,motif);vectors++;
 }
}
assert.equal(vectors,11);
assert(fs.readFileSync('public/entrance/index.html','utf8').includes('/journal/2026-09-24'));
console.log('PASS 16 daily routes, all source references, 11 frozen drawing hashes, family recurrence, metadata and legacy routing.');
