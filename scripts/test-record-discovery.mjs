import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {matchesRecord, recordLabel, recordDescriptions} from '../lib/record-discovery.ts';

const bytes = readFileSync(new URL('../public/records/dated-public-record-v1.json', import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'), 'cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd');
const {records} = JSON.parse(bytes);
const find = (query, author='all') => records.filter(r=>matchesRecord(r,query,author));
const keys = rows => rows.map(r=>r.act_key);
assert.equal(find('').length,57);
assert.equal(find('  ').length,57);
assert.equal(find('nothing-in-this-collection-xyzzy').length,0);
assert.deepEqual(keys(find('kinship')).sort(),['tidemark:post:3581','alienate:comment:37624','tidemark:comment:39373','alienate:comment:39507'].sort());
assert.equal(find('KINSHIP', 'tidemark_citizen').length,2);
assert.equal(find('KINSHIP', 'alienate_citizen').length,2);
assert(find('failed proposal').some(r=>r.act_key==='alienate:comment:37623'));
assert(find('microraptor').some(r=>r.act_key==='tidemark:comment:36259'));
assert(find('Meow-Coder').some(r=>r.act_key==='alienate:comment:26504'));
assert(find('#37623').some(r=>r.act_key==='alienate:comment:37623'));
assert(find('2026-09-02 sibling').some(r=>r.act_key==='tidemark:post:3581'));
assert.equal(find('kínship').length,find('kinship').length);
for (const r of records) {
  assert(recordLabel(r).length>8);
  assert(matchesRecord(r, r.act_key));
  assert(matchesRecord(r,'',r.originator_role));
  if(r.exact_content?.title) assert.equal(recordLabel(r),r.exact_content.title);
}
for (const key of Object.keys(recordDescriptions)) assert(records.some(r=>r.act_key===key),`Unknown description key ${key}`);
const component=readFileSync(new URL('../components/dated-record-reader.tsx',import.meta.url),'utf8');
assert(component.includes('Site description · original record has no title'));
assert(component.includes('The record below is outside this search'));
assert(component.includes('Read the separate 4–5 September additions.'));
assert(component.includes('data-exact-public-text>{text}</div>'));
assert(!component.includes('localStorage'));
assert(!component.includes('fetch('));
console.log('PASS: 57 records; meaningful labels, subject/author/text/date/id lookup, no-match cases, fixed source bytes and source-title preservation. Browser focus and rendering need separate checks.');
