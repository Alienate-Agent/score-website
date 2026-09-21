import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const baseline='65e2bdbcb0ea32d7b304bb8e2711c07a971e1501';
const prior=path=>execFileSync('git',['show',`${baseline}:${path}`],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024});
const frame=read('components/site-frame.tsx');
for(const destination of ['/journal','/record','/archive','/charter','/record#all-record-search','/record#resources','/record#correspondence','/featured','/changelog','/record#score-privacy'])assert.ok(frame.includes(`href="${destination}"`),destination);
assert.ok(frame.includes('site-artwork-shell'),'independent artwork has a separate host scope');
assert.ok(frame.includes('className="site-skip" href="#reading-main"'));
assert.ok(frame.includes('id="reading-main" tabIndex={-1}'));
const masthead=read('components/site-masthead.tsx');
for(const destination of ['/journal','/#agents','/#works','/record'])assert.ok(masthead.includes(`href="${destination}"`));
for(const file of ['index','journal','episode','journal-missing-post','journal-one-ballot','journal-who-owes']){
 const html=read(`public/entrance/${file}.html`);
 assert.ok(html.includes('href="/entrance/site-continuity.css"'),file);
 assert.ok(/<nav[^>]*>[\s\S]*?<a[^>]*href="\/record"[^>]*>Record<\/a>[\s\S]*?<\/nav>/.test(html),`${file}: Record in navigation`);
}
const currentStory=read('components/unfolding-story.tsx'),oldStory=prior('components/unfolding-story.tsx');
const storyStart='<section className="story-current ';
assert.ok(currentStory.includes(storyStart)&&oldStory.includes(storyStart));
assert.equal(currentStory.slice(currentStory.indexOf(storyStart)),oldStory.slice(oldStory.indexOf(storyStart)),'historical narrative and current editorial content unchanged');
assert.ok(currentStory.includes('Earlier entrance · the claim and the replies'));
assert.ok(read('components/declaration-encounter.tsx').includes("'.site-masthead, .reading-help-bar'"),'old declaration arrival accounts for the current masthead');
for(const path of ['lib/charter-text.ts','lib/story-present.ts','lib/correspondence.mjs','lib/correspondence-notice.ts','lib/journeys.mjs','lib/journey-capacity.mjs','public/journeys.js','public/entrance/journey.js','worker.mjs','vite.config.ts','wrangler.correspondence.json','wrangler.journeys.json'])assert.equal(read(path),prior(path),`${path}: content/service boundary`);
const withoutPreparationTime=text=>text.replace(/export const siteUpdatedAt = '[^']+';/,"export const siteUpdatedAt = 'PREPARATION_TIME';");
assert.equal(withoutPreparationTime(read('lib/site-update-times.ts')),withoutPreparationTime(prior('lib/site-update-times.ts')),'only edition preparation time changes, not the admitted board cutoff or its source');
const protectedFiles=execFileSync('git',['ls-tree','-r',baseline,'public/records','public/studio','public/lens'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const entry of protectedFiles){
 const [meta,path]=entry.split('\t'),expected=meta.split(' ')[2];
 const actual=fs.readFileSync(new URL(path,root));
 const blob=createHash('sha1').update(`blob ${actual.length}\0`).update(actual).digest('hex');
 assert.equal(blob,expected,`${path}: frozen source/artwork bytes`);
}
const layer=read('components/story-layers.tsx');
assert.ok(layer.includes("id={id==='story-search'?'all-record-search':undefined}"),'legacy search anchor lands on the visible heading');
assert.ok(read('components/cross-record-search.tsx').includes('<section data-site-search-ignore'),'search results remain excluded from the site text index');
assert.ok(!read('components/cross-record-search.tsx').includes('id="all-record-search"'),'legacy anchor is not duplicated on the form');
assert.ok(read('app/site-masthead.css').includes('grid-template-columns:repeat(2,max-content)'),'stable phone navigation grid');
console.log(`PASS: shared destinations/skip link, six static readers, full narrative, charter, services, and ${protectedFiles.length} unchanged source/artwork files; legacy search landing guards.`);
