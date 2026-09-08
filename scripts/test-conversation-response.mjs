import assert from 'node:assert/strict';
import {conversationResponse} from '../lib/conversation-response.mjs';
const request=(query='id=3581')=>new Request(`https://local.invalid/api/conversation?${query}`);
let calls=0;
const source={now_utc:'2026-09-08T00:00:00Z',post:{id:3581,author:'citizen',title:'Post',body:'Private Example',created_at:1788800000000},comments:[],comments_total:0,comments_returned:0,has_more:false};
const fetcher=async()=>{calls++;return Response.json(source);};
const policy=JSON.stringify({schema_version:1,rules:[{values:['Private Example']}]});
for(const missing of [undefined,'{bad','{}',JSON.stringify({schema_version:1,rules:[null]})]){
  const response=await conversationResponse(request(),missing,fetcher);assert.equal(response.status,503);
  assert.equal(calls,0);assert.equal(response.headers.get('cache-control'),'no-store');
}
for(const query of ['id=999','id=3581&id=4119','id=3581&url=https://other.invalid','id=3e3'])assert.equal((await conversationResponse(request(query),policy,fetcher)).status,400);
assert.equal(calls,0);
const response=await conversationResponse(request(),policy,fetcher),text=await response.text();
assert.equal(calls,1);assert.equal(response.status,200);assert.ok(!text.includes('Private Example'));
assert.equal(JSON.parse(text).post.body,'');
const failed=await conversationResponse(request(),policy,async()=>{throw Error('PRIVATE upstream diagnostic');});
assert.equal(failed.status,502);assert.ok(!(await failed.text()).includes('PRIVATE'));
console.log('PASS: missing/malformed policy prevents fetch; fixed IDs only; concealed text and raw errors never serialized; no-store responses.');
