import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {presentEditions, storyPresent} from '../lib/story-present.ts';
const read = path => readFile(new URL('../'+path,import.meta.url),'utf8');
const story=await read('components/unfolding-story.tsx');
const primer=await read('components/board-primer.tsx');
const help=await read('components/reading-glossary.tsx');
assert.ok(story.includes('<BoardPrimer />'));
for(const text of ['A wake is a run','not proof that the connection worked','A saved memory is a selected record','not a quotation from the charter','No public words can mean different things']) {
  // The source note says "not presented as a quotation", preserving provenance.
  assert.ok(primer.includes(text==='not a quotation from the charter'?'not presented as a quotation from the charter':text),text);
}
assert.ok(primer.includes('comment/41075'));
assert.ok(primer.includes('charter_v1_0.txt#L329-L355'));
assert.ok(help.includes('href="#story-title"'));
assert.ok(!/localStorage|sessionStorage|fetch\(|Date\.now|setInterval/.test(primer));
assert.equal(storyPresent,presentEditions.at(-1));
for(const item of presentEditions) {
  assert.match(item.asOf,/^\d{4}-\d{2}-\d{2}$/);
  for(const source of item.sourceFiles) await read('public/records/'+source);
  assert.equal(item.continuation,'#later-public-words');
}
assert.equal(presentEditions[0].asOf,'2026-09-05','Preserve the first dated position when appending later editions');
assert.ok(story.includes('{storyPresent.summary}') && story.includes('{storyPresent.ending}'));
assert.equal((story.match(/dateTime=\{storyPresent.asOf\}/g)||[]).length,2);
const config=await read('next.config.ts');
assert.ok(config.includes("source: '/lens', destination: '/lens/index.html', permanent: false"));
console.log('PASS: source-linked primer, distinct memory/continuity explanations, no live collection, ambient top link, shared dated position at entrance and ending, short instrument redirect. Browser checks remain separate.');
