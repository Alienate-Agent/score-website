import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {ENTRANCE_ROUTES,ENTRANCE_ALIASES,entranceResponse} from '../lib/entrance-routes.mjs';
import {storyPresent} from '../lib/story-present.ts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const pages=new Map(Object.entries(ENTRANCE_ROUTES).map(([route,asset])=>[route,read('public'+asset)]));
const ids=html=>[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const links=html=>[...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
const checkedAssets=new Set();
for(const [route,html] of pages){
 assert(!/local preview|local study H|noindex,nofollow|class="study-note"|127\.0\.0\.1/.test(html),route+' has no preview furniture');
 assert(html.includes(`rel="canonical" href="https://taasoart.com${route}"`));
 assert(html.includes('data-reading-mode="entrance"'));
 for(const script of ['/journeys.js','/engagement.js','/reading-return.js'])assert(html.includes(`src="${script}"`));
 assert(html.includes('2026-09-21T21:38:00Z'),'Actual admitted cutoff retained');
 const targets=ids(html);assert.equal(new Set(targets).size,targets.length,route+' unique IDs');
 for(const link of links(html)){
  if(/^(https?:|mailto:)/.test(link))continue;
  const url=new URL(link,'https://taasoart.com'+route);
  if(url.hash&&pages.has(url.pathname))assert(ids(pages.get(url.pathname)).includes(decodeURIComponent(url.hash.slice(1))),route+' -> '+link);
  if(url.pathname.startsWith('/entrance/')&&!ENTRANCE_ALIASES[url.pathname]){
   assert(existsSync(resolve(root,'public'+url.pathname)),route+' asset '+link);checkedAssets.add(url.pathname);
   if(url.pathname.endsWith('.svg'))assert(url.pathname.includes('/icons/'),'Artwork vector is not a web asset');
  }
 }
 for(const [,a] of html.matchAll(/(<a\b[^>]*href="\/(?!\/)[^"]*"[^>]*>[\s\S]*?<\/a>)/g))assert(!a.includes('new tab')&&!a.includes('target="_blank"'),'Same-site reading retains this tab');
 assert(html.includes('/record#correspondence')&&html.includes('/record#score-privacy'));
}
assert(pages.get('/').includes(storyPresent.compactSummary.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')));
assert.equal((pages.get('/journal').match(/class="story-connection compact"/g)||[]).length,4);
assert.equal((pages.get('/journal').match(/Read (?:entry|episode)/g)||[]).length,5);
for(const route of ['/journal/missing-post','/journal/one-ballot','/journal/who-owes','/episode'])assert(pages.get(route).includes('Drawing history')&&pages.get(route).includes('Drawn on'));

// Exercise actual Worker routing without invoking a renderer or network.
const calls=[],env={ASSETS:{fetch:async r=>{calls.push(r);return new Response('asset',{headers:{'Content-Type':'text/html'}});}}};
for(const [route,asset] of Object.entries(ENTRANCE_ROUTES))for(const method of ['GET','HEAD']){
 const r=await entranceResponse(new Request('https://taasoart.com'+route+'?reading=kept',{method}),env);
 assert.equal(r.status,200);assert.equal(new URL(calls.at(-1).url).pathname,asset);assert.equal(new URL(calls.at(-1).url).search,'?reading=kept');assert.equal(calls.at(-1).method,method);
}
for(const [alias,route] of Object.entries(ENTRANCE_ALIASES)){
 const r=await entranceResponse(new Request('https://taasoart.com'+alias+'?entry=kept'),env);
 assert.equal(r.status,308);assert.equal(r.headers.get('Location'),'https://taasoart.com'+route+'?entry=kept');
}
for(const url of ['/api/correspondence','/api/journeys','/record','/unknown'])assert.equal(await entranceResponse(new Request('https://taasoart.com'+url),env),null);
assert.equal(await entranceResponse(new Request('https://taasoart.com/',{method:'POST'}),env),null);

// Browser fragments never reach the server. Test migration as pure JS.
const legacy=read('public/entrance/legacy-links.js');
function migrated(suffix){let target=null;runInNewContext(legacy,{URL,Set,document:{getElementById:id=>ids(pages.get('/')).includes(id)},location:{href:'https://taasoart.com/'+suffix,replace:value=>target=value},addEventListener:()=>{}});return target;}
for(const id of ids(pages.get('/')))assert.equal(migrated('#'+id),null,'New homepage destination '+id);
for(const id of ['story-title','story-payment-names-work','story-room-not-plan','resources','all-record-search','correspondence','encounter-example~telling~one'])assert.equal(migrated('?kept=yes#'+id),'/record?kept=yes#'+id);
for(const id of ['chronology','chronology-entry-example'])assert.equal(migrated('#'+id),'/visual-score#'+id);
assert.equal(migrated('?reading=example'),'/visual-score?reading=example');
assert.equal(migrated('#declaration-question'),'/featured#responsibility-2026-09-08');
assert.equal(migrated(''),null);

if(process.argv.includes('--http')){
 const origin=process.env.ENTRANCE_TEST_ORIGIN||'http://127.0.0.1:3046';
 assert(['localhost','127.0.0.1'].includes(new URL(origin).hostname),'HTTP checks are local-only');
 for(const [route,html] of pages){const r=await fetch(origin+route);assert.equal(r.status,200,route);assert((await r.text()).includes('<body data-reading-mode="entrance"'),route+' served static reading document');}
 for(const asset of checkedAssets)assert.equal((await fetch(origin+asset)).status,200,asset);
 for(const path of ['/artwork-masters/lineage-score-v1/inputs.json','/artwork-masters/data-score-v1/editions/2026-09-20/safeguard.svg','/entrance/assets/lineage-one-ballot-v1.svg','/entrance/prepare-inputs.mjs'])assert.equal((await fetch(origin+path)).status,404,path+' not served');
}
console.log(`PASS: ${pages.size} documents, ${checkedAssets.size} assets, canonical/alias routes, legacy fragments, current content, related links and repo-only vector boundary.`);
