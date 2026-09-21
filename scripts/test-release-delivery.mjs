import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preparedPageResponse,PREPARED_PAGES} from '../lib/prepared-pages.mjs';
import {createConversationRestrictionTest,validateConversationPolicy} from '../lib/conversation-display-policy.mjs';
import {markdownVisibleText} from '../lib/markdown-visible-text.mjs';
import worker from '../worker.mjs';
const old=(value,policy)=>{
 validateConversationPolicy(policy);
 const match=s=>policy.rules.some(r=>r.values.some(v=>(r.case_sensitive?s.normalize('NFKC'):s.normalize('NFKC').toLowerCase()).includes(r.case_sensitive?v.normalize('NFKC'):v.normalize('NFKC').toLowerCase())));
 return match(value)||match(markdownVisibleText(value));
};
const policies=[{schema_version:1,rules:[{values:['private-name','needle','MixedCase']}]},{schema_version:1,rules:[{case_sensitive:true,values:['Exact','safe\n']},{values:['private']}] }];
const values=['safe','safe-identifier','private-name','PRIVATE-NAME','private_name','**private**','[safe](https://example.test/private)','pri**vate**','ＭｉｘｅｄＣａｓｅ','Exact','exact','safe\n','a--b','name_underscores_here',...Array.from({length:400},(_,i)=>`citizen-${i}`)];
for(const policy of policies){const check=createConversationRestrictionTest(policy);for(const v of values)assert.equal(check(v),old(v,policy),v);}
assert.throws(()=>createConversationRestrictionTest(null));
const sample=Array.from({length:1000},(_,i)=>`citizen-${i}`),policy=policies[0],check=createConversationRestrictionTest(policy);
let start=performance.now();for(const v of sample)old(v,policy);const baseline=performance.now()-start;
start=performance.now();for(const v of sample)check(v);const compiled=performance.now()-start;
const calls=[],env={ASSETS:{fetch:async request=>{calls.push(request);return new Response('prepared',{headers:{'Content-Type':'text/html'}});}}};
for(const path of PREPARED_PAGES){
 for(const method of ['GET','HEAD']){const r=await preparedPageResponse(new Request('https://taasoart.com'+path+'?agent=tidemark',{method}),env);assert.equal(r.status,200);assert.equal(new URL(calls.at(-1).url).pathname,'/_pages'+path+'.html');assert.equal(new URL(calls.at(-1).url).search,'');assert.equal(calls.at(-1).method,method);}
 const rsc=await preparedPageResponse(new Request('https://taasoart.com'+path,{headers:{RSC:'1'}}),env);assert.equal(rsc.headers.get('Content-Type'),'text/x-component');assert.equal(new URL(calls.at(-1).url).pathname,'/_pages'+path+'.rsc');
 const redirect=await preparedPageResponse(new Request('https://taasoart.com'+path+'/?kept=1'),env);assert.equal(redirect.status,308);assert.equal(redirect.headers.get('Location'),'https://taasoart.com'+path+'?kept=1');
}
assert.equal(await preparedPageResponse(new Request('https://taasoart.com/api/journeys'),env),null);
assert.equal(await preparedPageResponse(new Request('https://taasoart.com/record',{method:'POST'}),env),null);
for(const path of ['/lens','/lens/'])for(const method of ['GET','HEAD']){
 const response=await worker.fetch(new Request('https://taasoart.com'+path+'?record=tidemark%3Apost%3A3581&from=%23story-title',{method}),env,{});
 assert.equal(response.status,307);assert.equal(response.headers.get('Location'),'https://taasoart.com/lens/index.html?record=tidemark%3Apost%3A3581&from=%23story-title');
}
for(const route of ['/journal/','/episode/','/journal/who-owes/']){const response=await worker.fetch(new Request('https://taasoart.com'+route+'?kept=yes'),env,{});assert.equal(response.status,308);assert.equal(response.headers.get('Location'),'https://taasoart.com'+route.slice(0,-1)+'?kept=yes');}
// Every application API remains represented once in the direct dispatcher.
const dispatcher=readFileSync(new URL('../lib/api-dispatch.mjs',import.meta.url),'utf8');
for(const route of ['agent-stats','agent-words','board-registry','board-search','conversation','correspondence','engagement','journey-admin','journeys','thread-check'])assert(dispatcher.includes(`'/api/${route}'`));
console.log(`PASS: privacy parity (${policies.length*values.length} cases), ${PREPARED_PAGES.length} prepared routes, queries/HEAD/RSC/redirects and API inventory. Synthetic 1000-name scan: original ${baseline.toFixed(2)}ms; compiled ${compiled.toFixed(2)}ms (local CPU, not an edge guarantee).`);
