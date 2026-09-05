import fs from 'node:fs';
import assert from 'node:assert/strict';
import {glossary,glossaryEntries} from '../lib/glossary.ts';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
for(const key of ['board','score','debt','settlement','alienate','tidemark','quorum','key','dossier','seal','charter','covenant','wake','continuity','window','provenance','retrospective','registry','timelock'])assert.ok(glossary[key],key);
assert.equal(new Set(glossaryEntries.map(([key])=>key)).size,glossaryEntries.length);
for(const [key,entry] of glossaryEntries){assert.ok(entry.definition.length>30,key);assert.ok(entry.detail.length>30,key);}
for(const file of ['unfolding-story.tsx','later-public-speech.tsx','window-continuation.tsx','board-reading-paths.tsx','conduct-leaf.tsx','dated-record-reader.tsx']){
  for(const [,key] of read('components/'+file).matchAll(/<Term id="([^"]+)"/g))assert.ok(glossary[key],file+': '+key);
}
const help=read('components/reading-glossary.tsx');
assert.ok(help.includes('finalFocus={origin}'));
assert.ok(help.includes('disabled={!ready}'));
assert.ok(help.includes('No matching term yet'));
assert.ok(!/fetch\(|localStorage|sessionStorage|sendBeacon|dangerouslySetInnerHTML/.test(help));
const story=read('components/unfolding-story.tsx');
assert.ok(!story.includes('An artist makes an agent to ask for something back.'));
assert.ok(story.includes('use its shared funds to buy human art, pay its makers and exhibit the work'));
const continuation=read('components/later-public-speech.tsx');
assert.ok(!continuation.includes('The question comes back.'));
assert.ok(continuation.includes('Before buying art, who gets to decide?'));
assert.ok(continuation.includes('first proposal needed twenty participants and drew only one ballot'));
assert.ok(continuation.includes('site’s descriptions'));
console.log(`PASS: ${glossaryEntries.length} defined terms, all inline keys resolved, no collection/storage, plain-language entrance and contextual continuation. Interaction requires browser tests.`);
