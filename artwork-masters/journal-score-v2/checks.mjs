import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from '../../node_modules/sharp/lib/index.js';
import {contours,svg,sha,hand,VERSION} from './model.mjs';
import {hand as originalHand,contours as originalContours} from '../data-score-v1/model.mjs';
import {eligible} from '../data-score-v1/edition-policy.mjs';
import {viewPaths} from './safeguard-views.mjs';
const read=p=>readFile(new URL(p,import.meta.url)),json=async p=>JSON.parse(await read(p));
const input=await json('inputs.json'),original=await json('../data-score-v1/inputs.json'),manifest=await json('editions/2026-09-20/manifest.json');
const web=new URL('../../public/entrance/',import.meta.url);
assert.deepEqual(input.editions.filter(e=>e.generator!==VERSION),original.editions,'Previously frozen studies reused exactly');
assert.equal(sha(await read('inputs.json')),manifest.inputsSha256);
assert.equal((await read('model.mjs')).toString(),(await read('editions/2026-09-20/model.mjs')).toString());
const base=e=>contours(e).filter(p=>p.role!=='votes-grain');
const editions=input.editions.filter(e=>e.generator===VERSION);
for(const e of editions){
 assert.equal(svg(e),svg(structuredClone(e)));assert(e.sources.length<=12);
 for(const s of e.sources){assert.equal(sha(s.excerpt),s.excerptSha256);assert(Date.parse(s.occurredAt)<=Date.parse(s.observedAt));assert(Date.parse(s.observedAt)<=Date.parse(e.sourceCutoff));}
 for(const p of contours(e))for(const [x,y] of p.points)assert(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1000&&y>=0&&y<=900,`${e.id}: unclipped finite paths`);
 const changed=structuredClone(e);changed.sources.forEach(s=>s.votes={value:100,field:'votes',observedAt:s.observedAt});assert.deepEqual(base(e),base(changed));
 const capped=structuredClone(changed);capped.sources.forEach(s=>s.votes.value=1000000);assert.deepEqual(contours(changed),contours(capped));
 for(const view of e.id==='art-without-service'?[0,1,2]:[2]){
  const id=e.id+(e.id==='art-without-service'?'-'+view:''),record=manifest.outputs.find(x=>x.id===id);
  const master=svg(e,{view}),pen=svg(e,{view,plotter:true}),raster=await readFile(new URL(`assets/journal-score-${id}-v2.webp`,web));
  assert.equal(master,(await read(`editions/2026-09-20/${id}.svg`)).toString());assert.equal(sha(master),record.masterSha256);assert.equal(sha(pen),record.penSha256);assert.equal(sha(raster),record.webSha256);
  assert(!pen.includes('<rect'));assert(pen.includes('inkscape:groupmode="layer"'));
  const pixels=await sharp(Buffer.from(master),{density:144}).resize(1600,1440).ensureAlpha().raw().toBuffer();assert(pixels.equals(await sharp(raster).ensureAlpha().raw().toBuffer()));
 }
 for(const field of ['speaker','occurredAt']){const changed=structuredClone(e);changed.sources[0][field]=field==='speaker'?'someone-else':'2026-09-18T12:00:00Z';assert.notDeepEqual(base(e),base(changed),`${e.id}: ${field} affects drawing`);}
}
for(const speaker of ['Alienate','Tidemark','episteme'])assert.deepEqual(hand(speaker),originalHand(speaker));
const [missing,ballot,art]=editions;
assert.equal(missing.facts.rejectedDraftBody,null);assert.equal(missing.facts.chosenOption,null);assert.equal(missing.facts.options.length,5);
for(const o of missing.facts.options)assert.equal(sha(o.text),o.sha256);
let changed=structuredClone(missing);changed.facts.reportedDraftCharacters=8000;assert.notDeepEqual(base(missing),base(changed));
changed=structuredClone(missing);changed.facts.options.pop();assert.notEqual(base(missing).length,base(changed).length);
assert.equal(base(ballot).filter(p=>p.role==='observed-participation').length,10);assert.equal(base(ballot).filter(p=>p.role==='threshold-guide').length,190);assert.equal(ballot.facts.eligibleParticipants,null);
changed=structuredClone(ballot);changed.facts.close='2026-09-01T20:00:00Z';assert.notDeepEqual(base(ballot),base(changed));
changed=structuredClone(ballot);changed.facts.requiredParticipants=10;assert.notEqual(base(ballot).length,base(changed).length);
changed=structuredClone(ballot);changed.facts.observedParticipants=2;assert.notDeepEqual(base(ballot),base(changed));
for(const p of art.passages){assert(art.sources[0].excerpt.includes(p.excerpt));assert.equal(sha(p.excerpt),p.sha256);}
assert(contours(art,0).length<contours(art,1).length&&contours(art,1).length<contours(art,2).length);
changed=structuredClone(art);changed.passages[0].sha256=sha('different passage');assert.notDeepEqual(base(art),base(changed));
for(const e of editions){const c={episode:e.id,now:'2026-09-21T21:30:00Z',history:input.editions,change:{publicAdmitted:true,relatedToSelectedEpisode:true,kind:'substantive-reply',editorialReason:'Changes the selected exchange.',selectedRecords:4,replyHops:1}};assert(eligible(c).eligible);assert(!eligible({...c,now:'2026-09-21T03:59:00Z'}).eligible);assert(!eligible({...c,change:{...c.change,kind:'karma-only'}}).eligible);}
const sg=original.editions.find(e=>e.id==='safeguard'),all=originalContours(sg);
assert.deepEqual(viewPaths(all,2),all);assert(!viewPaths(all,0).some(p=>p.role==='objection'));assert(viewPaths(all,1).some(p=>p.role==='objection'));assert(!viewPaths(all,1).some(p=>p.role==='correction'||p.role==='withdrawn-trace'));assert(all.some(p=>p.role==='withdrawn-trace'));
const pages=['index.html','journal.html','episode.html','journal-missing-post.html','journal-one-ballot.html','journal-who-owes.html'];
for(const file of pages){const page=(await readFile(new URL(file,web))).toString();assert(!page.includes('artwork-masters/'));if(file!=='index.html'){assert(page.includes('Drawn on'));if(file!=='journal.html')assert(page.includes('Drawing history'));}}
const publicInput=(await readFile(new URL('journal-score-inputs.json',web))).toString();assert.equal(publicInput,(await read('inputs.json')).toString());assert(!publicInput.includes('/'+'Users/')&&!publicInput.includes('site-publication/'));
// HTTP release boundaries are checked by scripts/test-entrance.mjs --http.
console.log('PASS: frozen sources, five lossless outputs, unclipped paths, fact/hash/date/speaker sensitivity, stable karma texture, prior editions, source-limited update policy.');
