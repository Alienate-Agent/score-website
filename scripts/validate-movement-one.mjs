import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { entries } from '../lib/chronology.ts';
import { readChronologyLocation, writeChronologyLocation } from '../lib/chronology-location.ts';

const read = async (path) => readFile(new URL(path, import.meta.url), 'utf8');
const admission = JSON.parse(await read('../docs/site-spec/movement-one-admissions-2026-09-04.json'));
const ledger = JSON.parse(await read('../docs/site-spec/chronology-entry-ledger.json'));
const sourceBytes = await read('../public/records/dated-public-record-v1.json');
const source = JSON.parse(sourceBytes);
if (!process.env.CHARTER_SOURCE_PATH) throw new Error('Name the exact public-entry charter with CHARTER_SOURCE_PATH; a current amended charter is not a substitute.');
const charter = await readFile(process.env.CHARTER_SOURCE_PATH, 'utf8');
assert.equal(createHash('sha256').update(charter).digest('hex'), admission.charter_at_entry.sha256);
assert.match(charter, /No purchase\s+proceeds until the polity has adopted a decision rule/);
assert.match(charter, /The\s+campaign’s outcome|The\s+campaign's outcome/);
assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), admission.source_resource_sha256);
assert.deepEqual(ledger.entry_ids.slice(0, admission.prior_entry_count), admission.prior_ledger_prefix);
assert.deepEqual(ledger.entry_ids.slice(admission.prior_entry_count, admission.prior_entry_count + 3), ['E22', 'E22·2', 'E22·3']);

function checkEntry(entry, expected) {
  const record = source.records.find((record) => record.act_key === expected.source_key);
  assert.ok(record);
  assert.equal(entry.chronologyAt, record.occurred_at);
  assert.equal(entry.chronologyAt, expected.event_time);
  assert.equal(createHash('sha256').update(record.exact_content.body).digest('hex'), expected.source_body_sha256);
  assert.equal(entry.sequence, 'movement-one');
  assert.equal(entry.temporalStatus, 'retroactive');
  assert.equal(entry.admissionStatus, 'later admission');
  assert.equal(entry.editorialAccount.author, 'Sol Website');
  assert.equal(entry.editorialAccount.composedOn, admission.composition_date);
  assert.equal(entry.editorialAccount.admittedOn, admission.site_admission_date);
  assert.equal(entry.editorialAccount.sourceActKey, record.act_key);
  assert.equal(entry.publicSource.url, record.source_url);
  assert.ok(entry.charterContext.url.startsWith(`https://github.com/Alienate-Agent/window/blob/${admission.charter_at_entry.public_commit}/charter_v1_0.txt#L`));
  assert.ok(entry.charterContext.text.length > 80);
  assert.deepEqual(entry.voices, ['Alienate', 'Site interpretation']);
  assert.ok(entry.editorialAccount.qualification.length > 80);
}

for (const expected of admission.admissions) {
  const entry = entries.find((entry) => entry.id === expected.id);
  assert.ok(entry);
  checkEntry(entry, expected);
  for (const mode of ['date', 'event', 'voice', 'movement']) {
    const state = { id: entry.id, mode, sequence: 'movement-one' };
    const url = writeChronologyLocation(new URL('https://example.invalid/'), state);
    assert.deepEqual(readChronologyLocation(url, entries, 'E09').selection, state);
  }
}

// Negative controls cover time, authorship, temporal relation, and source identity.
const first = entries.find((entry) => entry.id === 'E22');
for (const mutation of [
  { ...first, chronologyAt: '2026-09-04T00:00:00Z' },
  { ...first, temporalStatus: 'contemporaneous' },
  { ...first, editorialAccount: { ...first.editorialAccount, author: 'Alienate' } },
  { ...first, editorialAccount: { ...first.editorialAccount, sourceActKey: 'alienate:post:3734' } },
]) assert.throws(() => checkEntry(mutation, admission.admissions[0]));

const second = entries.find((entry) => entry.id === 'E22·2');
const third = entries.find((entry) => entry.id === 'E22·3');
assert.match(first.body, /whether AI-generated work declared by a human artist/);
assert.match(first.charterContext.text, /the polity must also decide on the record/);
assert.match(first.charterContext.text, /creditor class—the artists whose labor built the corpora/);
assert.match(first.charterContext.text, /membership is distinct from the proposed remedy/);
assert.ok(first.recordTrail.some((line) => line.includes('4 September editorial correction')));
assert.match(second.body, /not evidence that the polity voted against purchasing human art/);
assert.match(second.body, /not an independently witnessed instant/);
assert.match(third.body, /bracketing procedure and requires an untruncated response/);
assert.match(third.body, /no outcome is supplied here/);
console.log('PASS: 3 Movement One admissions, exact charter-at-entry and unchanged public-record source, preserved historical prefix, separate event/composition/admission dates, 12 address round trips, 4 rejected mutations, and explicit narrative qualifications. Rendered reading and comprehension require separate checks.');
