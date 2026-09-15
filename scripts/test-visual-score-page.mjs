import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visualScoreDestination} from '../lib/visual-score-location.ts';
import {readChronologyLocation} from '../lib/chronology-location.ts';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const destination=path=>visualScoreDestination(new URL(path,'https://example.test'));
for(const hash of ['#chronology','#chronology-heading','#story-instruments','#evidence-specimen-title','#chronology-entry-E09','#chronology-entry-E22%C2%B73','#chronology-title-E10']){
  assert.equal(destination('/?reading=voice&sequence=opening&keep=1'+hash),'/visual-score?reading=voice&sequence=opening&keep=1'+hash);
}
assert.equal(destination('/?reading=movement&sequence=opening'),'/visual-score?reading=movement&sequence=opening');
for(const path of ['/','/?keep=1','/#story-title','/?sequence=opening#story-beginning','/#score-heading','/archive#chronology','/visual-score#chronology-entry-E09'])assert.equal(destination(path),null,path);
const entries=[{id:'E09',sequence:'opening'},{id:'E22·3',sequence:'movement-one'}];
const old='/?reading=voice&sequence=movement-one#chronology-entry-E22%C2%B73';
const before=readChronologyLocation(new URL(old,'https://example.test'),entries,'E09');
const after=readChronologyLocation(new URL(destination(old),'https://example.test'),entries,'E09');
assert.deepEqual(after,before,'relocation must not change event, mode or sequence');
assert.ok(!read('app/page.tsx').includes('ChronologyBook'));
assert.ok(!read('components/story-layers.tsx').includes('<ReadingLayer id="story-instruments"'));
assert.ok(read('components/story-layers.tsx').includes('href="/visual-score"'));
assert.ok(read('components/site-contents.tsx').includes("['Visual score', '/visual-score']"));
assert.ok(read('app/visual-score/page.tsx').includes('ReadingGlossary navigation={false}'),'retain glossary without a duplicate homepage masthead');
assert.ok(read('components/site-masthead.tsx').includes('data-fixed-reading-return>Back to Studio</a>'));
assert.ok(read('public/reading-return.js').includes("existing&&!existing.hasAttribute('data-fixed-reading-return')"));
assert.ok(read('app/visual-score/visual-score.css').includes('--score-top:var(--site-masthead-offset'));
assert.ok(read('components/legacy-archive-links.tsx').includes('visualScoreDestination(new URL(location.href))'));
assert.ok(read('lib/encounters.ts').includes("scoreAnchor:'/visual-score#chronology-entry-"));
console.log('PASS: dedicated score page, Studio/Contents routes, stable Back, legacy encoded identities/query preservation, no homepage reader or redirect loops.');
