import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractData, filterInputs, eligibleTidemark } from './prepare-lens-inputs.mjs';

assert.deepEqual(extractData('const D={"a":"quoted \\\" }", "b":{"c":2}}; throw Error("never run");'), {a:'quoted " }', b:{c:2}});
assert.throws(() => extractData('const D=(()=>({records:[]}))();'));
assert.throws(() => extractData('const D={}; const D={};'));
assert.throws(() => extractData('const D={'));

if (!process.argv[2]) throw Error('Supply the generated candidate input JSON');
const candidate = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const baseline = filterInputs(candidate);
assert.equal(baseline.records.filter(r => r.who === 'Tidemark').length, 8);
for (const record of baseline.records.filter(r => r.who === 'Tidemark')) assert.ok(Object.hasOwn(eligibleTidemark, record.key));

// Metamorphic test: excluded material cannot alter eligible data or its hash.
for (const qty of [1, 81, 999999]) {
  const altered = structuredClone(candidate);
  altered.records.push({key:'excluded-test', who:'Tidemark', obj:'vote_or_karma_count', qty, at:'1900-01-01T00:00:00Z', body:'private test input', seed:qty});
  altered.C.unreviewed_private_field = qty;
  altered.C.caps.unreviewed_private_field = qty;
  altered.C.tuning.unreviewed_private_field = qty;
  assert.deepEqual(filterInputs(altered), baseline);
}
const changed = structuredClone(candidate);
changed.records.find(r => r.who === 'Tidemark').body += ' changed';
assert.throws(() => filterInputs(changed), /hash mismatch/);
const extra = structuredClone(candidate);
extra.records[0].unreviewed_private_field = 'must not travel';
assert.throws(() => filterInputs(extra), /Unreviewed record field/);
const missing = structuredClone(candidate);
missing.records = missing.records.filter(r => r.key !== 'tidemark:post:3581');
assert.throws(() => filterInputs(missing), /Missing eligible act/);
console.log('PASS: literal-JSON parsing without execution; eight exact public bodies; excluded quantities, timestamps, bodies, seeds and unknown constants cannot affect prepared inputs or hash.');
console.log('This tests input preparation only, not playback, downstream calculations, publication scope or hearing safety.');
