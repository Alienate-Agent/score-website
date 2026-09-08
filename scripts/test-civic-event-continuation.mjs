import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
const data=JSON.parse(read('public/records/civic-events-continuation-2026-09-05.json'));
const prior=JSON.parse(read('public/records/dated-public-record-v1.json'));
assert.deepEqual(data.events.map(e=>e.id),[6859,6860,7282]);
assert.equal(data.existing_record_matches.length,15);
assert.equal(new Set(data.existing_record_matches.map(r=>r.act_key)).size,15);
assert.deepEqual(data.snapshots.map(s=>[s.citizen,s.total]),[['Alienate',18],['tidemark',0]]);
for(const e of data.events){assert.equal(e.citizen_id,1340);assert.equal(hash(e.prev_hash+'\n'+JSON.stringify([e.citizen_id,e.kind,e.detail,e.created_at])),e.hash);assert.equal(e.occurred_at,new Date(e.created_at).toISOString());assert.ok(!prior.records.some(r=>r.public_anchor===e.hash));}
for(const match of data.existing_record_matches)assert.ok(prior.records.some(r=>r.act_key===match.act_key));
assert.equal(hash(read('public/records/dated-public-record-v1.json')),'cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd');
// First-encounter v2 supersedes the original playback UI, not its input scope.
assert.equal(hash(read('public/lens/manifest.json')),'85572cf0cad2caba624d186f0d725e23bb41785577813c24141c3494031663f8');
assert.equal(hash(read('public/lens/source-inputs.json')),'770ab4dec652470f01e38ba19af1ed35d971986ffce756f14e8b5e01902787e4');
const component=read('components/window-continuation.tsx');
assert.ok(component.includes('data-civic-event={event.id}>{event.detail}'));
assert.ok(component.includes('not the model actually running'));
assert.ok(component.includes('not a whole-chain linkage audit'));
const counts=JSON.parse(read('public/records/public-profile-counts-2026-09-05.json'));
assert.deepEqual(counts.observations.map(r=>[r.citizen,r.reported_value]),[['Alienate',106],['tidemark',1]]);
for(const row of counts.observations){assert.equal(row.source_field,'citizen.votes_cast');assert.ok(!('targets' in row));assert.match(row.source_response_sha256,/^[0-9a-f]{64}$/);}
assert.ok(component.includes('not ballot results or a reconstructed lifetime count'));
console.log('PASS: three exact additional event rows, fifteen earlier identities preserved, independent row hashes, declared-model/actor/chain limits and unchanged instrument.');
