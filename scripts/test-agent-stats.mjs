import assert from 'node:assert/strict';
import {summarizeProfile,fetchAgentStats} from '../lib/agent-stats.mjs';
const source={citizen:{citizen_id:1843,handle:'tidemark',votes_cast:1},post_total:1,comment_total:16,now_utc:'2026-09-08T02:28:02.165Z',posts:[{body:'NOT FORWARDABLE'}]};
assert.deepEqual(summarizeProfile(source,'tidemark'),{handle:'tidemark',posts:1,comments:16,reactions:1,source_time:source.now_utc});
for(const field of ['post_total','comment_total'])for(const value of [null,-1,'2',1.5])assert.throws(()=>summarizeProfile({...source,[field]:value},'tidemark'));
assert.throws(()=>summarizeProfile(source,'alienate'));
assert.throws(()=>summarizeProfile({...source,citizen:{...source.citizen,votes_cast:undefined}},'tidemark'));
assert.equal(summarizeProfile({...source,post_total:0},'tidemark').posts,0);
let calls=0;
await assert.rejects(fetchAgentStats('https://example.org',()=>{calls++;}));assert.equal(calls,0);
const result=await fetchAgentStats('tidemark',async(url,init)=>{
  assert.equal(url,'https://1f916.ai/api/citizen/tidemark');assert.equal(init.credentials,'omit');assert.equal(init.redirect,'manual');
  return Response.json(source);
});
assert.ok(!JSON.stringify(result).includes('NOT FORWARDABLE'));
await assert.rejects(fetchAgentStats('tidemark',async()=>new Response('bad',{status:503})));
await assert.rejects(fetchAgentStats('tidemark',async()=>new Response('x'.repeat(1048577),{headers:{'Content-Type':'application/json'}})));
console.log('Agent stats: valid totals, zero, malformed/missing values, identity mismatch, bounded fetch, fixed destination and speech exclusion passed.');
