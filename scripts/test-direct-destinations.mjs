import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {PREPARED_PAGES} from '../lib/prepared-pages.mjs';
import {ROUTES} from '../public/journey-map.mjs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const before=p=>execFileSync('git',['show','767e50b45bb649c3649d30cee8b805a34e8bc188:'+p],{cwd:root,encoding:'utf8',maxBuffer:20_000_000});
for(const route of ['/works','/resources','/search','/about','/correspondence','/privacy']){
 assert(PREPARED_PAGES.includes(route));assert(ROUTES[route]);
 assert(read('app'+route+'/page.tsx').includes('DestinationPage'));
 assert(read('dist/client/_pages'+route+'.html').includes('<h1'));
}
for(const f of ['components/site-frame.tsx','components/site-masthead.tsx','scripts/build-entrance.mjs','scripts/build-daily-journal.mjs','app/agent-guide/page.tsx'])assert(!/\/record#(?:resources|correspondence|story-about|all-record-search|score-privacy|story-exploration)/.test(read(f)),f);
const frame=read('components/site-masthead.tsx');assert(frame.includes('href="/works"'));assert(frame.includes('href="/resources"'));assert(!frame.includes('>Record</a>'));
for(const file of ['lib/story-present.ts','content/daily-journal.mjs','lib/correspondence-notice.ts','lib/correspondence.mjs','lib/journeys.mjs','lib/journey-capacity.mjs','lib/charter-text.ts','worker.mjs','wrangler.journeys.json','wrangler.correspondence.json'])assert.equal(read(file),before(file),file+' preserved');
const oldNotice=before('public/journeys.js').match(/text.textContent='([^']+)';/)[1];assert(read('public/journeys.js').includes(oldNotice));assert(read('app/privacy/page.tsx').includes(oldNotice));
const oldStory=before('components/unfolding-story.tsx').split('export function AboutThisWork')[0];assert.equal(read('components/unfolding-story.tsx').split('export function AboutThisWork')[0],oldStory,'Historical narrative unchanged');
const frozen=execFileSync('git',['diff','--name-only','767e50b45bb649c3649d30cee8b805a34e8bc188','--','public/records','public/entrance/assets','artwork-masters','public/studio/tidemark/assets'],{cwd:root,encoding:'utf8'});assert.equal(frozen,'','Source and artwork bytes unchanged');
for(const file of ['public/entrance/daily-2026-09-26.html','public/entrance/daily-2026-09-17.html'])assert.equal(read(file).match(/<main[\s\S]*?<\/main>/)[0],before(file).match(/<main[\s\S]*?<\/main>/)[0],'Daily content unchanged');
const rules=JSON.parse(read('dist/server/wrangler.json')).assets.run_worker_first;assert(rules.length<=100);assert(rules.includes('/journal/*'));
console.log('PASS: six direct destinations, current navigation, exact notices/service boundaries, preserved narrative and drawings, bounded routing.');
