import assert from 'node:assert/strict';
import fs from 'node:fs';
import {archiveDestination} from '../lib/archive-location.ts';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('app/page.tsx'),story=read('components/unfolding-story.tsx'),layers=read('components/story-layers.tsx');
assert.equal((story.match(/id="story-status-heading"/g)||[]).length,1);
assert.equal((story.match(/id="story-unwritten"/g)||[]).length,1);
assert.equal((story.match(/<LiveAgentStats \/>/g)||[]).length,1);
const present=story.indexOf('id="story-unwritten"');
assert.ok(present<story.indexOf('id="story-status-heading"'));
assert.ok(story.indexOf('id="story-status-heading"')<story.indexOf('storyPresent.scenes.map'));
assert.ok(story.indexOf('storyPresent.scenes.map')<story.indexOf('id="story-about"'));
assert.ok(!story.includes('The purchase is still a proposal.'));
assert.ok(home.includes('score={<ChronologyBook />} search={<CrossRecordSearch />}'));
for(const [id,label,body] of [['story-search','Search the site and board','search'],['story-instruments','Visual score','score'],['story-reading-notes','Reading notes and context','children']]){
  assert.ok(layers.includes(`<ReadingLayer id="${id}" label="${label}">{${body}}</ReadingLayer>`));
}
assert.ok(!layers.includes('Visual score and public records'));
assert.ok(layers.includes("selectedScore ? id === 'story-instruments'"));
assert.ok(layers.includes("storyTarget?.closest('[data-reading-layer]')"));
assert.ok(!home.includes('EarlierStoryEnding')&&!home.includes('SettlementProof'));
const editions=read('components/earlier-site-editions.tsx');
assert.ok(read('app/archive/page.tsx').includes('<DatedRecordReader/><EarlierSiteEditions/>'));
assert.ok(!read('app/archive/page.tsx').includes('ReadingGlossary'),'Do not duplicate the secondary-page masthead');
assert.ok(editions.includes('separate from the board records above'));
assert.ok(editions.includes('<EarlierStoryEnding />')&&editions.includes('<SettlementProof />'));
for(const file of ['components/earlier-site-editions.tsx','components/earlier-story-ending.tsx','components/settlement-proof.tsx']){
  for(const [,id] of read(file).matchAll(/<[a-z][^>]*\bid="([^"]+)"/g)){
    assert.equal(archiveDestination('#'+id),'/archive#'+id,`Legacy edition fragment ${id}`);
  }
}
for(const hash of ['#story-title','#story-status-heading','#all-record-search','#record-discovery-results','#chronology-entry-E09','#question-paths','#board-questions'])assert.equal(archiveDestination(hash),null);
assert.ok(read('components/settlement-proof.tsx').includes("window.location.href = '/?sequence=opening#chronology-entry-E09'"));
assert.ok(read('components/settlement-proof.tsx').includes("hash === '#proof-interpretation'"));
assert.ok(read('components/archive-edition-arrival.tsx').includes('ancestor.open=true'));
assert.ok(read('components/dated-record-reader.tsx').includes('href="#earlier-site-editions"'));
assert.ok(read('lib/site-search.ts').includes("'/archive'"),'Moved prose stays in the site search corpus');
console.log('PASS: one present/status, independent reading destinations, archived editions, legacy fragments, archive discovery and cross-page returns.');
