import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {presentEditions,storyPresent} from '../lib/story-present.ts';
const read = name => fs.readFileSync(new URL('../'+name, import.meta.url), 'utf8');
const story = read('components/unfolding-story.tsx');
const page = read('app/page.tsx');
const layers = read('components/story-layers.tsx');
const spine = read('components/story-spine.tsx');
const cover = story.slice(story.indexOf('<header'), story.indexOf('</header>')) + read('components/declaration-encounter.tsx');
for (const text of ['An ongoing artwork', 'AI narrator', 'human artist', 'existing online community', 'buy human art, pay its makers and exhibit the work', 'Who is speaking—and who can act?', 'human maintainer', 'Advisor interpretation is not either citizen’s speech']) assert.ok(cover.includes(text),text);
assert.ok(cover.includes('<time dateTime={storyPresent.asOf}>'));
assert.equal(presentEditions[0].asOf,'2026-09-05','Keep the historical first edition');
assert.equal(storyPresent,presentEditions.at(-1),'The entrance uses the latest admitted edition');
assert.equal(storyPresent.asOf,'2026-09-07');
assert.ok(storyPresent.summary.includes('Alienate has answered Tidemark’s question'));
assert.ok(!cover.includes('Through 3 September 2026'));
assert.ok(cover.includes('attemptHistory.map(entry=>')&&cover.includes("href={'record' in entry ?"),'Expandable dated attempt history provides the current source routes');
assert.equal(storyPresent.continuation,'#encounter-remedy~words~comment%3A46595');
assert.ok(cover.includes('Read the story'));
assert.ok(cover.includes('Focus on Tidemark’s question'));
assert.ok(cover.includes('Focus on Alienate’s answer'));
assert.ok(cover.includes('data-story-return="story-title"'));
assert.ok(story.includes('{storyPresent.ending}'));
for (const href of ['#story-beginning','#encounter-remedy','/lens/','#chronology-entry-E22']) assert.ok(cover.includes('href="'+href+'"'),href);
assert.ok(story.includes('17:51 UTC · first fetch'));
assert.ok(story.indexOf('Black bars withhold') > story.indexOf('<summary>Technical reading notes</summary>'),'Operator-directed reading qualifications remain in technical details');
assert.equal((story.match(/<WithheldPronoun id=/g)||[]).length,12);
assert.ok(story.includes('composed 5 September 2026 UTC from the admitted Prelude and preserved public sources through 3 September'));
assert.ok(page.indexOf('<ChronologyBook />') < page.indexOf('<DatedRecordReader />'));
assert.ok(page.indexOf('<DatedRecordReader />') < page.indexOf('<BoardReadingPaths />'));
assert.ok(page.indexOf('id="question-paths"') < page.indexOf('<BoardReadingPaths />'));
assert.ok(page.indexOf('id="earlier-entrance"') < page.indexOf('<SettlementProof />'));
assert.ok(page.indexOf('<ConductLeaf />') < page.indexOf('id="earlier-entrance"'));
assert.ok(layers.includes('ancestor instanceof HTMLDetailsElement'));
assert.ok(layers.includes('ancestor = ancestor.parentElement'));
assert.ok(spine.includes('aria-label="Chapters in the story"'));
assert.ok(!spine.includes("register: 'record'"));
for(const [path,hash] of [
  ['public/records/dated-public-record-v1.json','cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd'],
]) assert.equal(createHash('sha256').update(read(path)).digest('hex'),hash,path);
// Inventory consistency here; exact historical engine/input comparisons live
// in test-instrument-encounter-return.mjs, including bounded credit exceptions.
for(const file of JSON.parse(read('public/lens/manifest.json')).files){
  const bytes=fs.readFileSync(new URL('../public/lens/'+file.path,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
  assert.equal(bytes.length,file.bytes,file.path);
}
console.log('PASS: entrance roles, dated status, reading modes, first-use redaction, preserved historical cutoff, archive placement and immutable source/instrument identities. Browser reading/focus checks remain separate.');
