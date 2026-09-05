import assert from 'node:assert/strict';
import { readChronologyLocation, writeChronologyLocation } from '../lib/chronology-location.ts';

const entries = [
  { id: 'E09', sequence: 'opening' },
  { id: 'E10', sequence: 'public-conduct' },
  { id: 'E39·2', sequence: 'study-002' },
];
const read = (address) => readChronologyLocation(new URL(address), entries, 'E09');
const states = [];
for (const entry of entries) {
  for (const mode of ['date', 'event', 'voice', 'movement']) {
    for (const sequence of ['all', entry.sequence]) states.push({ id: entry.id, mode, sequence });
  }
}
for (const state of states) {
  const address = writeChronologyLocation(new URL('https://example.invalid/subpath/?keep=1#other'), state);
  assert.deepEqual(read(address).selection, state);
  assert.equal(address.pathname, '/subpath/');
  assert.equal(address.searchParams.get('keep'), '1');
  assert.equal(read(address).unavailable, false);
}
assert.equal(read('https://example.invalid/#chronology-entry-E10').selection.id, 'E10');
assert.equal(read('https://example.invalid/#chronology-entry-E39%C2%B72').selection.id, 'E39·2');
assert.equal(read('https://example.invalid/#chronology-entry-E39·2').selection.id, 'E39·2');
assert.equal(read('https://example.invalid/?sequence=opening#chronology-entry-E10').selection.sequence, 'all');
assert.equal(read('https://example.invalid/?reading=invalid#chronology-entry-E10').selection.mode, 'date');
for (const fragment of ['missing', '%E0%A4%A', '']) {
  const parsed = read('https://example.invalid/#chronology-entry-' + fragment);
  assert.equal(parsed.unavailable, true);
  assert.equal(parsed.selection.id, 'E09');
}
assert.equal(read('https://example.invalid/#chronology').requested, false);
assert.equal(read('https://example.invalid/').unavailable, false);
const cleaned = writeChronologyLocation(new URL('https://example.invalid/?reading=voice&sequence=opening&keep=1'), { id: 'E10', mode: 'date', sequence: 'all' });
assert.equal(cleaned.search, '?keep=1');
console.log('PASS: 24 reading-state round trips, encoded identities, conflicting filters, malformed/unknown links, and unrelated query preservation. Browser event/focus behavior requires separate live tests.');
