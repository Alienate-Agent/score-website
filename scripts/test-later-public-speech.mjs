import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const hash=t=>createHash('sha256').update(t).digest('hex');
const raw=read('public/records/dated-public-record-v1.json');
assert.equal(hash(raw),'cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd');
const before=JSON.parse(raw).records.filter(r=>r.act_class==='authored_board_speech');
const data=JSON.parse(read('public/records/later-public-speech-2026-09-05.json'));
assert.equal(data.records.length,9);assert.equal(before.length+data.records.length,44);
assert.deepEqual(data.records.map(r=>r.public_id),[41074,41075,41156,41157,41158,41159,42883,42884,42885]);
for(const r of data.records){assert.equal(hash(r.body),r.body_sha256);assert.ok(r.occurred_at>data.earlier_edition_cut);assert.ok(r.parent_post_id);assert.equal(r.source_url,'https://1f916.ai/api/comment/'+r.public_id);assert.ok(!before.some(b=>b.act_key===r.act_key));}
assert.equal(new Set(data.records.map(r=>r.act_key)).size,9);
// First-encounter v2 supersedes the original playback UI, not its input scope.
assert.equal(hash(read('public/lens/manifest.json')),'85572cf0cad2caba624d186f0d725e23bb41785577813c24141c3494031663f8');
assert.equal(hash(read('public/lens/source-inputs.json')),'770ab4dec652470f01e38ba19af1ed35d971986ffce756f14e8b5e01902787e4');
const allowed=new Set(JSON.parse(read('public/lens/act-keys.json')));
for(const row of data.records)assert.ok(!allowed.has(row.act_key),'New words must not enter the bounded instrument');
const component=read('components/later-public-speech.tsx');
assert.ok(component.includes('not added to the instrument'));
assert.ok(component.includes('do not supply a later ballot result'));
assert.ok(component.includes('data-later-exact={record.act_key}>{record.body}'));
assert.ok(!/fetch\(|dangerouslySetInnerHTML|AudioContext|localStorage/.test(component));
console.log('PASS: nine exact new public comments; total44 visible posts/comments across dated editions; unique stable IDs; earlier corpus and instrument unchanged.');
