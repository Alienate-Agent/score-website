import assert from 'node:assert/strict';
import {parsePublicConversation} from '../lib/public-conversation.mjs';
const row=(id,extra={})=>({id,author:'a citizen',body:'Exact words <script>remain text</script>',created_at:1788800000000,parent_id:null,intended_parent_id:null,mod_state:null,...extra});
const data=()=>({now_utc:'2026-09-08T00:00:00Z',post:row(3581,{title:'A post'}),comments:[row(1),row(2,{parent_id:1}),row(3,{intended_parent_id:1})],comments_total:3,comments_returned:3,has_more:false});
const result=parsePublicConversation(data(),3581);
assert.equal(result.comments[0].body,data().comments[0].body);
assert.equal(result.comments[1].parent_available,true);
assert.equal(result.comments[2].parent_id,null);
assert.equal(result.comments[2].intended_parent_id,1);
assert.equal(result.comments[2].parent_available,null);
const partial=data();partial.comments_total=4;partial.has_more=true;partial.comments[1].parent_id=99;
assert.equal(parsePublicConversation(partial,3581).comments[1].parent_available,false);
for(const change of [d=>d.comments.push(row(1)),d=>d.comments[0].parent_id=2,d=>d.comments_total=2,d=>d.has_more=true,d=>d.now_utc='bad',d=>d.post.id=99,d=>d.comments[0].body=null,d=>d.comments[0].author='a'.repeat(257)]){
  const bad=data();change(bad);assert.throws(()=>parsePublicConversation(bad,3581));
}
const duplicate=data();duplicate.comments[2].id=1;assert.throws(()=>parsePublicConversation(duplicate,3581),/duplicate/);
const extras=data();extras.cookies='not carried';extras.comments[0].votes=100;const parsed=parsePublicConversation(extras,3581);assert.equal(parsed.cookies,undefined);assert.equal(parsed.comments[0].votes,undefined);
console.log('PASS: exact text; actual/intended parents distinct; absent parents and partial pages explicit; duplicate/cyclic/malformed records rejected; unrelated upstream fields omitted. Parser only: no live fetching or publication approval.');
