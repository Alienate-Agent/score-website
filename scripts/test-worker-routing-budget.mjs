import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {ENTRANCE_ROUTES,ENTRANCE_ALIASES} from '../lib/entrance-routes.mjs';
import {PREPARED_PAGES} from '../lib/prepared-pages.mjs';
import worker from '../worker.mjs';
const source=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');
const expression=source.match(/run_worker_first: (\[[\s\S]*?\]\.filter\(\(value,index,all\)=>all\.indexOf\(value\)===index\)),/)[1]
  .replace('(name): name is string =>','(name) =>');
const evaluate=names=>new Function('ENTRANCE_ROUTES','ENTRANCE_ALIASES','PREPARED_PAGES','readdirSync','return '+expression.replace("new URL('./public/',import.meta.url)","'public'"))(ENTRANCE_ROUTES,ENTRANCE_ALIASES,PREPARED_PAGES,()=>names);
const files=readdirSync(new URL('../public/',import.meta.url),{recursive:true}),rules=evaluate(files);
assert(rules.length<=100);assert(rules.includes('/journal/*'));assert(rules.includes('/entrance/daily-*'));
const matches=path=>rules.some(rule=>rule.endsWith('*')?path.startsWith(rule.slice(0,-1)):path===rule);
for(const file of files.filter(name=>name.endsWith('.html')))assert(matches('/'+file),file);
for(const path of [...Object.keys(ENTRANCE_ROUTES),...Object.keys(ENTRANCE_ALIASES),...PREPARED_PAGES,...PREPARED_PAGES.map(p=>p+'/')])assert(matches(path),path);
const future=Array.from({length:366},(_,i)=>'entrance/daily-2099-'+String(Math.floor(i/31)+1).padStart(2,'0')+'-'+String(i%31+1).padStart(2,'0')+'.html');
assert.deepEqual(evaluate([...files,...future]),rules);
assert(!matches('/api/journeys'));assert(!matches('/studio/private.json'));assert(!matches('/entrance/assets/new.webp'));
for(const path of ['/entrance/daily-2026-10-16-inputs.json','/entrance/daily-journal.css','/entrance/daily-journal.js','/entrance/daily-score-model.mjs'])for(const method of ['GET','HEAD']){
  let requested;const response=await worker.fetch(new Request('https://taasoart.com'+path,{method}),{ASSETS:{fetch:r=>{requested=r;return new Response('public asset');}}},{});
  assert.equal(response.status,200);assert.equal(new URL(requested.url).pathname,path);assert.equal(requested.method,method);
}
console.log('PASS worker routing budget: '+rules.length+' rules; all public HTML covered; 366 future daily pages add zero rules.');
