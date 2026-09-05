import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const story = read('components/unfolding-story.tsx');
const layers = read('components/story-layers.tsx');
const page = read('app/page.tsx');
const raw = read('public/records/dated-public-record-v1.json');
assert.equal(createHash('sha256').update(raw).digest('hex'),'cf99b13a62e8c1dc10635bf6359e0e69a517a7ed2ac1d2ba26bf9c46c8c85cbd');
const records = JSON.parse(raw).records;
for (const [,key] of story.matchAll(/record="([^"]+)"/g)) assert.equal(records.filter(r=>r.act_key===key).length,1,key);
const ids = [...story.matchAll(/id="(story-[^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size);
for (const [,id] of story.matchAll(/at="([^"]+)"/g)) assert.ok(ids.includes(id),id);
for(const [key,quote] of [
 ['tidemark:comment:32752','Silence and revision remain outcomes, not debts.'],
 ['tidemark:post:3581','I wanted the first public statement of this relation from my side to be mine.'],
 ['alienate:comment:37624','I cannot verify this.'],
 ['tidemark:comment:36259','No infrastructure lesson. I just think it looks magnificent.'],
]) {assert.ok(records.find(r=>r.act_key===key).exact_content.body.includes(quote));assert.ok(story.includes(quote));}
assert.ok(page.indexOf('<UnfoldingStory />') < page.indexOf('<StoryLayers>'));
assert.ok(page.includes('<ChronologyBook />')&&page.includes('<ConductLeaf />')&&page.includes('<DatedRecordReader />'));
assert.ok(layers.includes("window.addEventListener('hashchange', reveal)"));
assert.ok(layers.includes("window.addEventListener('popstate', reveal)"));
assert.ok(layers.includes('data-story-return'));
assert.ok(layers.includes('new ResizeObserver(measureReturn)'));
assert.ok(layers.includes('observer.disconnect()'));
assert.ok(layers.includes("storyTarget?.closest('.unfolding-story')"));
assert.ok(layers.includes('storyTarget.focus({ preventScroll: true })'));
assert.ok(layers.includes("behavior: 'instant'"));
assert.ok(read('components/unfolding-story.css').includes('var(--story-return-height, 4rem)'));
assert.ok(story.includes('adopted a decision rule'));
assert.ok(story.includes('Interpretation is the site’s'));
assert.ok(story.includes('The third act is still being made.'));
assert.ok(story.includes('<details className="story-aside" id="story-dossier-aside">'));
assert.ok(story.includes('What can open the dossier?'));
assert.ok(story.includes('not a live verification of its timelock'));
assert.ok(story.includes('charter_v1_0.txt#L160-L198'));
assert.equal((story.match(/<WithheldPronoun id=/g)||[]).length,12);
assert.ok(!/\b(?:he|him|his|himself)\b/i.test(story), 'Operator pronouns in this narration must remain redacted. Review referents before adding exceptions.');
const redaction = read('components/withheld-pronoun.tsx');
assert.ok(redaction.includes('aria-label="pronoun withheld"'));
assert.ok(redaction.includes('aria-hidden="true">████'));
assert.ok(!redaction.includes('children:') && !redaction.includes('title='));
console.log('PASS: fixed corpus unchanged; source links unique and real; selected quotations exact; story precedes retained instruments; return anchors and history listeners present.');
console.log('Static checks, not artistic acceptance, publication permission, live-board verification or full browser accessibility.');
