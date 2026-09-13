import assert from 'node:assert/strict';
import {boardRegistryResponse} from '../lib/board-registry.mjs';
const policy=JSON.stringify({schema_version:1,rules:[{values:['private-test-name']}]});
const req=()=>new Request('https://local.invalid/api/board-registry');
const first={citizens:[{citizen_id:1,handle:'fresh-citizen',created_at:100},{citizen_id:2,handle:'private-test-name',created_at:101}],has_more:true,next_since:101,total:3};
const second={citizens:[{citizen_id:3,handle:'Afterword',created_at:102}],has_more:false,next_since:null,total:3};
const grants={grants:[{slug:'new-grant',page:'/grants/new-grant'},{slug:'private-test-name',page:'/grants/private-test-name'},{slug:'evil',page:'https://elsewhere.test'}]};
const calls=[];
const fetcher=async(url,options)=>{
  calls.push(url);assert.equal(new URL(url).origin,'https://1f916.ai');assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'manual');assert.deepEqual(options.headers,{Accept:'application/json'});
  return Response.json(url.endsWith('/api/grants')?grants:url.includes('since=')?second:first);
};
assert.equal((await boardRegistryResponse(req(),undefined,fetcher)).status,503);assert.equal(calls.length,0);
assert.equal((await boardRegistryResponse(new Request(req().url+'?url=https://elsewhere.test'),policy,fetcher)).status,400);
const response=await boardRegistryResponse(req(),policy,fetcher),data=await response.json();
assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
assert.deepEqual(data.citizens,[{handle:'fresh-citizen',id:1},{handle:'Afterword',id:3}]);assert.deepEqual(data.grants,['new-grant']);
assert.deepEqual(calls.map(u=>new URL(u).pathname+new URL(u).search),['/api/citizens','/api/citizens?since=101','/api/grants']);
assert(!JSON.stringify(data).includes('private-test-name'));
for(const broken of [{...first,next_since:0},{...first,citizens:[],next_since:101},{...first,has_more:false},{...first,citizens:Array(1001).fill(first.citizens[0])}]){
  assert.equal((await boardRegistryResponse(req(),policy,async()=>Response.json(broken))).status,502);
}
assert.equal((await boardRegistryResponse(req(),policy,async()=>Response.redirect('https://elsewhere.test'))).status,502);
const entries=new Map();let puts=0;
const cache={match:async key=>entries.get(key.url)?.clone(),put:async(key,res)=>{puts++;assert.equal(res.headers.get('Cache-Control'),'public, max-age=300');entries.set(key.url,res);}};
await boardRegistryResponse(req(),policy,fetcher,cache);const before=calls.length;
assert.equal((await boardRegistryResponse(req(),policy,()=>{throw Error('cache miss');},cache)).status,200);assert.equal(calls.length,before);assert.equal(puts,1);
const newPolicy=JSON.stringify({schema_version:1,rules:[{values:['Afterword']}]});
assert.equal((await boardRegistryResponse(req(),newPolicy,fetcher,cache)).status,200);assert.equal(puts,2,'Privacy changes partition the cache');
console.log('PASS: complete census pagination, new citizens/grants, credential-free fixed endpoints, privacy filtering, cache reuse/policy separation, no partial or unsafe responses.');
