import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function validateReader(candidate, source) {
  assert.equal(candidate.records.length,source.records.length);
  assert.equal(new Set(candidate.records.map(r=>r.act_key)).size,source.records.length);
  assert.deepEqual(candidate.evidence_cut,source.evidence_cut);
  assert.equal(candidate.evidence_cut.fresh_live_board_reconciliation_completed,false);
  let speech=0, windows=0;
  const fields = ['act_key','originator_role','act_class','quantity','actor_mode','source_surface','public_object_type','public_id','public_event_id','public_commit','occurred_at','occurred_during','public_anchor','admission_status','presentation_status','candidate_entry_ids','relation_confidence','relation_note','disclosure_state','exact_content','source_url'];
  for (const record of candidate.records) {
    assert.deepEqual(Object.keys(record).sort(),[...fields].sort(),'Exact public-safe field inventory');
    const original=source.records.find(r=>r.act_key===record.act_key);
    assert(original, 'Unrecognized record');
    for(const [key,value] of Object.entries(record)) assert.deepEqual(value,original[key]??null,record.act_key+' '+key);
    assert.deepEqual(record.exact_content,original.exact_content);
    const content=record.exact_content;
    if(content?.body!=null) {
      assert.equal(createHash('sha256').update(content.body).digest('hex'),content.body_sha256);
      assert.equal(Buffer.byteLength(content.body),content.body_bytes);
      speech++;
    }
    if(content?.added_text!=null) {
      assert.equal(createHash('sha256').update(content.added_text).digest('hex'),content.added_text_sha256);
      assert.equal(Buffer.byteLength(content.added_text),content.added_text_bytes);
      windows++;
    }
    if(record.act_class==='public_reaction_aggregate') {
      assert.equal(record.occurred_at,null);
      assert(!('target' in record));
      assert.equal(record.exact_content,null);
      assert(record.disclosure_state);
    }
  }
  assert.equal(speech,35);
  assert.equal(windows,4);
  assert.equal(candidate.counts.records,candidate.records.length);
  assert.equal(candidate.counts.effects,candidate.records.reduce((n,r)=>n+r.quantity,0));
  assert.equal(candidate.counts.effects,140);
}

const sourcePath=process.env.PUBLIC_RECORD_SOURCE_PATH;
assert(sourcePath,'Set PUBLIC_RECORD_SOURCE_PATH to the fixed private source candidate; no substitute inventory is accepted.');
const original=await readFile(sourcePath);
assert.equal(createHash('sha256').update(original).digest('hex'),'d754ab9e1a1baf252688ea787808803e25114ab9ed85209ab571170703d73b43');
const source=JSON.parse(original);
const file=fileURLToPath(new URL('../public/records/dated-public-record-v1.json',import.meta.url));
const candidate=JSON.parse(await readFile(file));
assert.equal(candidate.source_dataset_sha256,createHash('sha256').update(original).digest('hex'));
validateReader(candidate,source);
for(const mutate of [
  d=>d.records.pop(),
  d=>{d.records[1]=d.records[0];},
  d=>{d.records.find(r=>r.exact_content?.body).exact_content.body+=' altered';},
  d=>{d.records.find(r=>r.act_class==='public_reaction_aggregate').occurred_at='2026-09-03T00:00:00Z';},
  d=>{d.evidence_cut.fresh_live_board_reconciliation_completed=true;},
  d=>{delete d.records[0].actor_mode;},
]) {
  const changed=structuredClone(candidate); mutate(changed);
  assert.throws(()=>validateReader(changed,source),'Mutation must be rejected');
}
console.log('PASS: all 57 fixed records / 140 effects preserved; 35 speech bodies and four Window additions byte-verified; six negative controls rejected. Rendered reachability needs browser testing.');
