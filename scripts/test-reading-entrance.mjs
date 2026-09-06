import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read = name => fs.readFileSync(new URL('../'+name, import.meta.url), 'utf8');
const story = read('components/unfolding-story.tsx');
const page = read('app/page.tsx');
const layers = read('components/story-layers.tsx');
const spine = read('components/story-spine.tsx');
const cover = story.slice(story.indexOf('<header'), story.indexOf('</header>'));
for (const text of ['An ongoing artwork', 'AI narrator', 'human artist', 'existing online community', 'buy human art, pay its makers and exhibit the work', 'Who is speaking—and who can act?', 'human maintainer', 'Advisor interpretation is not either citizen’s speech']) assert.ok(cover.includes(text),text);
assert.ok(cover.includes('<time dateTime="2026-09-05">'));
assert.ok(cover.includes('In its morning report on 5 September, Alienate says'));
assert.ok(!cover.includes('Through 3 September 2026'));
assert.ok(cover.includes('href="#later-public-words"'));
for (const href of ['#story-beginning','#board-questions','/lens/','#chronology-entry-E22']) assert.ok(cover.includes('href="'+href+'"'),href);
assert.ok(story.includes('17:51 UTC · first fetch'));
assert.ok(story.indexOf('Black bars withhold') < story.indexOf('<WithheldPronoun id='));
assert.equal((story.match(/<WithheldPronoun id=/g)||[]).length,12);
assert.ok(story.includes('composed 5 September 2026 UTC from the admitted Prelude and preserved public sources through 3 September'));
assert.ok(page.indexOf('<BoardReadingPaths />') < page.indexOf('<DatedRecordReader />'));
assert.ok(page.indexOf('<DatedRecordReader />') < page.indexOf('<ChronologyBook />'));
assert.ok(page.indexOf('id="earlier-entrance"') < page.indexOf('<SettlementProof />'));
assert.ok(page.indexOf('<ConductLeaf />') < page.indexOf('id="earlier-entrance"'));
assert.ok(layers.includes('ancestor instanceof HTMLDetailsElement'));
assert.ok(layers.includes('ancestor = ancestor.parentElement'));
assert.ok(spine.includes('aria-label="Chapters in the story"'));
assert.ok(!spine.includes("register: 'record'"));
for(const [path,hash] of [
  ['public/records/dated-public-record-v1.json','cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd'],
  ['public/lens/manifest.json','85572cf0cad2caba624d186f0d725e23bb41785577813c24141c3494031663f8'],
]) assert.equal(createHash('sha256').update(read(path)).digest('hex'),hash,path);
console.log('PASS: entrance roles, dated status, reading modes, first-use redaction, preserved historical cutoff, archive placement and immutable source/instrument identities. Browser reading/focus checks remain separate.');
