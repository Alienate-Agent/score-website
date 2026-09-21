import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import sharp from '../../node_modules/sharp/lib/index.js';
import {svg,sha,contours,hand,grain} from './model.mjs';
import {eligible,day} from './edition-policy.mjs';
const root=dirname(fileURLToPath(import.meta.url)),data=JSON.parse(await readFile(resolve(root,'inputs.json')));
const copy=x=>structuredClone(x),base=e=>contours(e).filter(p=>p.role!=='votes-grain');
for(const e of data.editions){
 assert.equal(svg(e),svg(copy(e)),'Determinism');assert(e.sources.length<=12);
 for(const s of e.sources){assert.equal(sha(s.excerpt),s.excerptSha256);assert(Date.parse(s.observedAt)<=Date.parse(e.sourceCutoff));assert(Date.parse(s.occurredAt)<=Date.parse(s.observedAt));}
 for(const p of contours(e))for(const [x,y]of p.points){assert(Number.isFinite(x)&&Number.isFinite(y));assert(x>=0&&x<=1000&&y>=0&&y<=900,`${e.id} out of bounds`);}
 const changed=copy(e);changed.sources.forEach(s=>s.votes={value:9999,observedAt:s.observedAt,field:'votes'});
 assert.deepEqual(base(e),base(changed),'Votes cannot rearrange the structural drawing');
 assert.equal(svg(e),await readFile(resolve(root,'editions/2026-09-20',e.id+'.svg'),'utf8'));
 const web=resolve(root,'../../public/entrance/assets',`data-score-${e.id}-v1.webp`);
 const pixels=await sharp(Buffer.from(svg(e)),{density:144}).resize(1600,1440).ensureAlpha().raw().toBuffer();
 assert(pixels.equals(await sharp(web).ensureAlpha().raw().toBuffer()),'Lossless web derivative');
 const pen=svg(e,{plotter:true});assert(!pen.includes('<rect'));assert(pen.includes('inkscape:groupmode="layer"'));
}
assert.deepEqual(hand('Alienate'),hand('alienate'));assert.notDeepEqual(hand('alienate'),hand('tidemark'));
assert.equal(grain(null),null);assert.equal(grain({value:0}),0);assert.equal(grain({value:100}),grain({value:1000000}));
const [safeguard,exchange,treasury]=data.editions;
const noRelation=copy(exchange);noRelation.relationships=[];assert.notDeepEqual(base(noRelation),base(exchange));
const later=copy(exchange);later.sources[1].occurredAt='2026-09-09T14:38:30.064Z';assert.notDeepEqual(base(later),base(exchange));
const changedText=copy(exchange);changedText.sources[0].excerptSha256=sha('different words');assert.notDeepEqual(base(changedText),base(exchange));
const changedSpeaker=copy(exchange);changedSpeaker.sources[0].speaker='another-citizen';assert.notDeepEqual(base(changedSpeaker),base(exchange));
const noWithdrawal=copy(safeguard);noWithdrawal.relationships=noWithdrawal.relationships.filter(r=>r.operation!=='withdraw-test');assert(!contours(noWithdrawal).some(p=>p.role==='withdrawn-trace'));assert(contours(safeguard).some(p=>p.role==='withdrawn-trace'));
const tierChange=copy(treasury);tierChange.treasury.tiersCents=[302066,1683997,220531];assert.notDeepEqual(base(tierChange),base(treasury));
assert.equal(treasury.treasury.coldRead.acceptedTotalCents,null);assert.equal(treasury.treasury.coldRead.reportedTotalCents,0);
const badTotal=copy(treasury);badTotal.treasury.reportedTotalCents=0;assert.throws(()=>contours(badTotal),/Tier total/);
const missing=copy(treasury);missing.treasury.reportedTotalCents=null;assert.deepEqual(contours(missing),[]);
const seal=copy(treasury);seal.treasury.publicSeal.sha256=sha('another public seal');assert.notDeepEqual(contours(seal),contours(treasury));
const candidate={episode:'safeguard',now:'2026-09-21T21:30:00Z',history:data.editions,change:{publicAdmitted:true,relatedToSelectedEpisode:true,kind:'substantive-reply',editorialReason:'Later public reply changes the question.',selectedRecords:4,replyHops:1}};
assert(eligible(candidate).eligible);
for(const change of [{kind:'karma-only'},{publicAdmitted:false},{relatedToSelectedEpisode:false},{editorialReason:''},{selectedRecords:13},{replyHops:3},{selectedRecords:undefined}])assert(!eligible({...candidate,change:{...candidate.change,...change}}).eligible);
assert(!eligible({...candidate,now:'2026-09-20T23:30:00Z'}).eligible);
assert.equal(day('2026-09-21T03:30:00Z'),'2026-09-20');
assert(!eligible({...candidate,now:'2026-09-21T03:30:00Z'}).eligible);
// HTTP release boundaries are checked by scripts/test-entrance.mjs --http.
console.log('PASS: sources/excerpts, deterministic masters, bounds, lossless derivatives, speaker/relationship/time/treasury/seal sensitivity, score-only stability, late-edition limits.');
