import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from '../../node_modules/sharp/lib/index.js';
import {contours as v1,sha} from '../data-score-v1/model.mjs';
import {contours as v2} from '../journal-score-v2/model.mjs';
import {compose,inheritedPaths,svg} from './model.mjs';
const read=p=>readFile(new URL(p,import.meta.url)),d=JSON.parse(await read('inputs.json')),m=JSON.parse(await read('studies/2026-09-20/manifest.json'));
const paths=(r,v=2)=>r.generator==='data-score/1'?v1(r):v2(r,v),web=new URL('../../public/entrance/',import.meta.url);
assert.equal(sha(await read('inputs.json')),m.inputsSha256);assert.equal((await read('model.mjs')).toString(),(await read('studies/2026-09-20/model.mjs')).toString());
const motifHashes=[];
for(const l of d.lineages){
 assert.equal(sha(JSON.stringify(l.rootRecipe)),l.rootRecipeSha256);assert.equal(l.rootSource.key,l.sourceKey);assert.equal(sha(l.rootSource.excerpt),l.rootSource.excerptSha256);
 assert(l.memberIds.includes(l.rootId));assert.equal(l.relationship.kind,'editorial-continuation');assert.equal(l.relationship.nativeReplyEdge,false);
 for(const ev of l.evidence){const r=d.entries.find(e=>e.id===ev.episode).recipe;assert(r.sources.find(s=>s.key===ev.source).excerpt.includes(ev.quote));}
 const motif=inheritedPaths(paths(l.rootRecipe),l),hash=sha(JSON.stringify(motif));assert.equal(hash,m.motifs.find(x=>x.id===l.id).sha256);motifHashes.push(hash);
 for(const e of d.entries.filter(e=>e.lineage===l.id)){
  assert.equal(sha(JSON.stringify(e.recipe)),e.recipeSha256);
  const sourceKeys=new Set([...l.rootRecipe.sources,...e.recipe.sources].map(s=>s.key));assert(sourceKeys.size<=12);
  const composed=compose(paths(e.recipe),paths(l.rootRecipe),l,e.id);assert.deepEqual(composed.filter(p=>p.role==='inherited-source'),motif);
  // A new contribution may change the base but not the frozen inherited bundle.
  const changed=paths(e.recipe).map(p=>({...p,points:p.points.map(([x,y])=>[x+1,y+2])}));assert.deepEqual(compose(changed,paths(l.rootRecipe),l,e.id).filter(p=>p.role==='inherited-source'),motif);
  // Neither current child karma nor a new drawing date enters the parent identity.
  const voted=structuredClone(e.recipe);voted.sources.forEach(s=>s.votes={value:99,field:'votes',observedAt:s.observedAt});assert.deepEqual(compose(paths(voted),paths(l.rootRecipe),l,e.id).filter(p=>p.role==='inherited-source'),motif);
 }
}
assert.equal(new Set(motifHashes).size,2,'Unrelated lines have distinct motifs');
for(const o of m.outputs){const e=d.entries.find(e=>e.id===o.entry),l=d.lineages.find(l=>l.id===e.lineage),ps=compose(paths(e.recipe,o.view),paths(l.rootRecipe),l,e.id);
 for(const p of ps)for(const[x,y]of p.points)assert(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1000&&y>=0&&y<=900,'Unclipped geometry');
 const vector=svg(ps,e.recipe.title,{drawnAt:d.drawnAt}),pen=svg(ps,e.recipe.title,{drawnAt:d.drawnAt,plotter:true});assert.equal(vector,(await read(`studies/2026-09-20/${o.id}.svg`)).toString());assert.equal(sha(vector),o.masterSha256);assert.equal(sha(pen),o.penSha256);assert(!pen.includes('<rect'));
 const raster=await readFile(new URL(`assets/lineage-${o.id}-v1.webp`,web));assert.equal(sha(raster),o.webSha256);
 const pixels=await sharp(Buffer.from(vector),{density:144}).resize(1600,1440).ensureAlpha().raw().toBuffer();assert(pixels.equals(await sharp(raster).ensureAlpha().raw().toBuffer()));
}
// Root ballot is one observed bundle plus19guides, not a duplicated participant.
const ballot=d.entries.find(e=>e.id==='one-ballot'),bl=d.lineages.find(l=>l.id===ballot.lineage),bp=compose(paths(ballot.recipe),paths(bl.rootRecipe),bl,ballot.id);assert.equal(bp.filter(p=>p.role==='observed-participation').length,0);assert.equal(bp.filter(p=>p.role==='inherited-source').length,10);assert.equal(bp.filter(p=>p.role==='threshold-guide').length,190);
const old=['../data-score-v1/editions/2026-09-20/manifest.json','../journal-score-v2/editions/2026-09-20/manifest.json'];
for(const f of old){const m=JSON.parse(await read(f));for(const o of m.outputs){const asset=f.includes('data-score')?`data-score-${o.id}-v1.webp`:`journal-score-${o.id}-v2.webp`;assert.equal(sha(await readFile(new URL('assets/'+asset,web))),o.webSha256);}}
const html=(await readFile(new URL('journal.html',web))).toString();assert.equal((html.match(/class="story-connection compact"/g)||[]).length,4);assert.equal((html.match(/<small>Continues/g)||[]).length,2);assert.equal((html.match(/<small>Later in this story/g)||[]).length,2);
const publicData=JSON.parse(await readFile(new URL('lineage-inputs.json',web)));assert(!('authority'in publicData));assert(!JSON.stringify(publicData).includes('/'+'Users/'));assert.deepEqual(publicData.lineages,d.lineages);
// HTTP release boundaries are checked by scripts/test-entrance.mjs --http.
console.log('PASS: exact evidence, inherited geometry identical across each pair and child mutations, distinct lineages, frozen earlier outputs, lossless unclipped vectors, four two-way related links and serving boundaries.');
