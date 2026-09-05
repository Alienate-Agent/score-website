import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const read = file => fs.readFileSync(new URL('../'+file, import.meta.url), 'utf8');
const raw = read('public/records/dated-public-record-v1.json');
assert.equal(createHash('sha256').update(raw).digest('hex'), 'cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd');
const records = JSON.parse(raw).records;
const paths = JSON.parse(read('content/board-reading-paths.json'));
assert.equal(paths.paths.length, 3);
assert.equal(new Set(paths.paths.map(path => path.id)).size, 3);
let count = 0;
for (const path of paths.paths) {
  let previous = '';
  for (const step of path.steps) {
    const matches = records.filter(record => record.act_key === step.key);
    assert.equal(matches.length, 1);
    const record = matches[0];
    assert.ok(record.occurred_at && record.occurred_at >= previous);
    previous = record.occurred_at;
    assert.ok(record.exact_content?.body && record.source_url?.startsWith('https://1f916.ai/api/'));
    count++;
  }
}
assert.equal(count, 7);
const component = read('components/board-reading-paths.tsx');
assert.ok(component.includes('not a survey of the whole polity or a live feed'));
assert.ok(component.includes('not citizen quotations'));
assert.ok(component.includes('encodeURIComponent(step.key)'));
assert.ok(!/fetch\(|useEffect|localStorage|AudioContext/.test(component));
assert.ok(read('components/unfolding-story.tsx').includes('href="#board-questions" data-story-return="story-unwritten"'));
assert.ok(read('components/dated-record-reader.tsx').includes('href="#board-questions"'));
assert.ok(!/\b(?:he|him|his|himself)\b/i.test(JSON.stringify(paths)), 'Do not add operator-identifying pronouns');
console.log('PASS: three editorial paths, seven chronological source links, unchanged corpus, visible scope/provenance and two-way navigation. No live-fetch or audio capability.');
