import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { entries } from '../lib/chronology.ts';
import { readChronologyLocation, writeChronologyLocation } from '../lib/chronology-location.ts';

const ledger = JSON.parse(await readFile(new URL('../docs/site-spec/chronology-entry-ledger.json', import.meta.url), 'utf8'));
const historical = ['E01','E09','E39','E39·2','E40','E41','E41·2','E43·1','E43·2','E43·3','E43·4','E49·1','E49·2','E49·3','E48·1','E48·2','E50','E50·2','E41·1','E10','E22','E22·2','E22·3'];
const admitted = ['E02','E03','E05','E06','E07','E08'];
assert.deepEqual(ledger.entry_ids.slice(0, 23), historical);
assert.deepEqual(ledger.entry_ids.slice(23), admitted);
const prelude = entries.filter(e => e.sequence === 'opening').sort((a,b) => a.chronologyAt.localeCompare(b.chronologyAt));
assert.deepEqual(prelude.map(e => e.id), ['E01', ...admitted, 'E09']);
assert.equal(prelude[0].chronologyAt, '2026-08-22T17:51:25.787Z');
assert.notEqual(prelude[0].admissionStatus, 'later admission');
assert.match(prelude[0].verification, /reported by Claude Advisor/);
assert.doesNotMatch(prelude[0].verification, /hash-sealed/);
assert.match(prelude.at(-1).summary, /first public-wake action/);
assert.doesNotMatch(prelude.at(-1).summary, /first live act/);
assert.ok(!entries.some(e => e.id === 'E04'));
function check(entry) {
  assert.equal(entry.temporalStatus, 'retroactive');
  assert.equal(entry.admissionStatus, 'later admission');
  assert.equal(entry.creationAccount.composedOn, '2026-09-04');
  assert.ok(entry.creationAccount.basis.length > 60);
  assert.ok(entry.voices.includes('Site interpretation'));
  assert.match(entry.route, /Sol Website/);
  assert.ok(entry.recordTrail.length >= 3);
  if (['E02','E03','E05','E08'].includes(entry.id)) {
    assert.match(entry.clockLabel, /reported by Claude Advisor/);
    assert.match(entry.creationAccount.basis, /reported|report/);
  }
}
for (const id of admitted) {
  const entry = entries.find(e => e.id === id);
  check(entry);
  for (const mode of ['date','event','voice','movement']) {
    const state = {id,mode,sequence:'opening'};
    assert.deepEqual(readChronologyLocation(writeChronologyLocation(new URL('https://example.invalid/'), state), entries, 'E09').selection, state);
  }
}
const registration = entries.find(e => e.id === 'E08');
assert.equal(new Date(1787526128938).toISOString(), registration.chronologyAt);
const construction = entries.find(e => e.id === 'E06');
assert.deepEqual(construction.voices, ['Artist Operator', 'Site interpretation']);
assert.match(construction.creationAccount.basis, /not a claim of sole code authorship/);
assert.equal(new Date('2026-08-23T18:25:54-04:00').toISOString(), new Date(construction.chronologyAt).toISOString());
assert.match(construction.body, /commit records a file being saved/);
const draft = entries.find(e => e.id === 'E07');
assert.match(draft.body, /draft mode prevents public execution/);
assert.ok(Date.parse(draft.chronologyAt) < Date.parse(registration.chronologyAt));
assert.throws(() => check({...registration, clockLabel:'independently verified exact time'}));
assert.throws(() => check({...draft, temporalStatus:'contemporaneous'}));
assert.throws(() => check({...draft, voices:['Alienate']}));
console.log('PASS: six later admissions, preserved 23-ID prefix and cold-open anchor, eight-passage sequence, reported-source qualifications, 24 URL round trips, timestamp conversions and three negative controls. This is not independent verification of the private exchanges or publication consent.');
