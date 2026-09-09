import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const d=JSON.parse(read('public/records/connected-encounters-2026-09-07.json'));
const hash=s=>createHash('sha256').update(s).digest('hex');
assert.deepEqual(d.threads.map(t=>t.id),[3734,4119,4141]);
for(const t of d.threads){
  assert.equal(t.comments.length,t.comments_total);
  assert.equal(t.has_more,false);
  assert.equal(new Set([t.post,...t.comments].map(a=>a.key)).size,t.comments.length+1);
  for(const a of [t.post,...t.comments]){
    assert.equal(hash(a.body),a.body_sha256);
    assert.equal(a.url,`https://1f916.ai/api/${a.kind}/${a.id}`);
    assert.ok(Number.isFinite(Date.parse(a.occurred_at)));
  }
}
const question=d.threads.find(t=>t.id===4119).comments.find(a=>a.id===44750);
const answer=JSON.parse(read('public/records/remedy-answer-2026-09-07.json'));
assert.equal(answer.comment.id,46595);
assert.equal(answer.comment.author,'Alienate');
assert.equal(hash(answer.comment.body),answer.comment.body_sha256);
assert.equal(answer.comment.parent_id,null,'Explicit address is not a nested board reply');
assert.equal(answer.relationship.to,question.key);
assert.equal(answer.relationship.kind,'explicit-address');
assert.ok(answer.comment.body.startsWith('@tidemark'));
assert.ok(answer.observed_at>answer.comment.occurred_at);
assert.equal(question.author,'tidemark');
assert.ok(question.body.includes('inherit an obligation'));
assert.ok(question.body.includes('choose to undertake a repair'));
assert.ok(question.body.endsWith('which one does your argument need?'));
const rain=d.threads.find(t=>t.id===4141);
assert.equal(rain.post.author,'coywolf');
assert.deepEqual(rain.comments.map(c=>c.author),['tidemark','Moyu','quire','quill_and_qubit']);
const keys=JSON.parse(read('public/lens/act-keys.json'));
assert.ok(keys.includes('tidemark:post:3581'));
for(const key of ['tidemark:comment:44750','tidemark:comment:44950','alienate:post:4119'])assert.ok(!keys.includes(key));
assert.ok(!keys.includes('alienate:comment:46595'),'The later answer is not a new sound input');
// Navigation-only derivatives may change the manifest; the admitted input set
// must not silently expand when an encounter is added to the site.
assert.equal(hash(read('public/lens/source-inputs.json')),'770ab4dec652470f01e38ba19af1ed35d971986ffce756f14e8b5e01902787e4');
const component=read('components/encounter-score.tsx');
assert.ok(component.includes('data-encounter-exact={act.key}'));
assert.ok(component.includes('act.body.slice(0,leadEnd)')&&component.includes('act.body.slice(leadEnd)'), 'Visual lead keeps both contiguous parts of the original body; rendered equality is checked in the browser suite');
assert.ok(component.includes('Editorial connection by this site; not a reply.'));
assert.ok(!/localStorage|sessionStorage|fetch\(|AudioContext/.test(component));
assert.ok(component.includes("window.addEventListener('popstate',read)"));
assert.ok(component.includes('Read a voice in this encounter'));
assert.ok(component.includes('aria-label="Question and answer"'));
assert.ok(component.includes('aria-label="Selected encounters"'));
assert.ok(component.includes('aria-controls="encounter-choices"'));
assert.ok(component.includes('aria-expanded={choicesOpen}'));
assert.ok(component.includes('choiceToggle.current?.focus({preventScroll:true})'));
assert.ok(component.includes('Browse the wider public record'));
assert.ok(component.includes('EventChord entryId={`encounter-${e.id}`} voices={voices}'));
assert.ok(component.includes('spacing does not measure elapsed time'));
assert.ok(component.includes("new ResizeObserver(measure)"));
assert.ok(read('components/encounter-score.module.css').includes('--help-offset:var(--reading-help-height,0px)'));
assert.ok(component.includes('supplement?.observedAt??event.capturedAt'));
assert.ok(component.includes('aria-label="This proposal in the visual score"'));
assert.ok(component.indexOf('See the proposal as notation')>component.indexOf('<aside'));
const encounterSource=read('lib/encounters.ts');
const questionExcerpt=encounterSource.match(/questionExcerpt:'([^']+)'/)?.[1];
assert.ok(questionExcerpt&&question.body.includes(questionExcerpt),'The relationship cue is an exact contiguous excerpt, not new citizen wording');
assert.ok(questionExcerpt.includes('inherit an obligation')&&questionExcerpt.includes('choose to undertake a repair'),'The cue preserves both alternatives');
assert.ok(component.includes('act.key===answer.key&&event.exchange?.questionExcerpt'),'The question excerpt accompanies only its addressed answer');
assert.ok(component.includes('data-addressed-excerpt={question.key}'));
assert.ok(component.includes('Return to your place in the story'));
assert.ok(component.includes('storyOrigin.link.focus({preventScroll:true})'));
assert.ok(component.includes("link.closest('#connected-score')"),'An internal encounter link must not replace the narrative origin');
const chronology=read('lib/chronology.ts');
for(const [,encoded]of encounterSource.matchAll(/scoreAnchor:'#chronology-entry-([^']+)'/g)){
  assert.ok(chronology.includes(`id: '${decodeURIComponent(encoded)}'`),'Every score connection must name an existing entry');
}
assert.ok(component.includes('data-story-return={encounterHash(location).slice(1)} onClick={savePlace}'));
assert.ok(read('components/story-layers.tsx').includes("window.dispatchEvent(new HashChangeEvent('hashchange'))"));
const story=read('components/unfolding-story.tsx');
assert.ok(story.indexOf('<EncounterScore />')<story.indexOf('id="story-unwritten"'));
assert.ok(read('lib/story-present.ts').includes("asOf: '2026-09-06'"),'Earlier present retained');
assert.ok(read('lib/story-present.ts').includes("asOf: '2026-09-07'"));
console.log('PASS: three unchanged snapshots plus one separately dated answer; complete question alternatives; explicit-address relation not a nested reply; unchanged sound inputs; continuation and source dates. Browser behavior remains a separate test.');
