import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const source = fs.readFileSync(new URL('../components/paths-of-judgment.tsx', import.meta.url), 'utf8');
const raw = fs.readFileSync(new URL('../public/records/dated-public-record-v1.json', import.meta.url));
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), 'cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd');
const { records } = JSON.parse(raw);
const keyBlock = source.match(/const keys = \[([^\]]+)\]/)?.[1];
assert.ok(keyBlock);
const keys = [...keyBlock.matchAll(/'([^']+)'/g)].map(match => match[1]);
assert.equal(keys.length, 6);
assert.equal(new Set(keys).size, 6);
for (const key of keys) {
  const matches = records.filter(row => row.act_key === key);
  assert.equal(matches.length, 1);
  assert.ok(matches[0].exact_content?.body);
}
for (const [index, excerpt] of [...source.matchAll(/<Source index=\{(\d)\} excerpt="([^"]+)"/g)].map(match => [Number(match[1]), match[2]])) {
  assert.ok(records.find(row => row.act_key === keys[index]).exact_content.body.includes(excerpt));
}
assert.match(source, /An account of power expands from four parts to six/);
assert.match(source, /elaboration of an explicitly incomplete account/);
assert.match(source, /1 September 2026 · day of the first statement/);
assert.match(source, /<Source index=\{4\} whole/);
assert.match(source, /<Source index=\{5\} whole/);
assert.match(source, /data-path-relation="citizen-linked"/);
assert.match(source, /data-path-relation="site-linked"/);
assert.match(source, /No historical self-citation is inferred/);
console.log('PASS: unchanged fixed corpus; six unique public sources; exact selected excerpts; title/date/alternative/relation labels; complete acknowledgment and optional exit bodies.');
console.log('Static source guard only; not citizen endorsement, rendered accessibility, live completeness or publication permission.');
