import assert from 'node:assert/strict';
import {parsePublicConversation} from '../lib/public-conversation.mjs';
import {prepareConversationDisplay} from '../lib/conversation-display-policy.mjs';
const policy={schema_version:1,rules:[{id:'test-only',values:['Private Example']}]};
const row=(id,extra={})=>({id,title:'Post',author:'Citizen',body:'Public words',created_at:1788800000000,...extra});
const source={now_utc:'2026-09-08T00:00:00Z',post:row(3581),comments:[row(1,{body:'A PRIVATE EXAMPLE appears here.'}),row(2,{mod_state:'held privately'}),row(3)],comments_total:3,comments_returned:3,has_more:false};
const observation={...parsePublicConversation(source,3581),observed_at:'2026-09-08T00:01:00Z'};
const result=prepareConversationDisplay(observation,policy);
assert.equal(result.withheld_count,2);assert.equal(result.comments[0].body,'');assert.equal(result.comments[0].author,'Withheld');assert.equal(result.comments[1].withheld,'moderation');assert.equal(result.comments[2].body,'Public words');
assert.ok(!JSON.stringify(result).includes('PRIVATE EXAMPLE'));assert.ok(!JSON.stringify(result).includes('held privately'));assert.ok(!JSON.stringify(result).includes('test-only'));
assert.equal(observation.comments[0].body,source.comments[0].body,'Original observation not mutated');
for(const bad of [null,{}, {schema_version:1,rules:[]},{schema_version:1,rules:[{values:['x']}]}])assert.throws(()=>prepareConversationDisplay(observation,bad),/privacy-policy/);
const unicode=structuredClone(observation);unicode.post.author='Ｐｒｉｖａｔｅ Ｅｘａｍｐｌｅ';assert.equal(prepareConversationDisplay(unicode,policy).post.withheld,'concealment');
for(const body of ['Private&#32;Example','Pri**vate Ex**ample','Private [Example](https://example.invalid)','Private&nbsp;Example','[link](https://example.invalid/Private%20Example)']){
 const formatted=structuredClone(observation);formatted.post.body=body;
 const protectedResult=prepareConversationDisplay(formatted,policy);
 assert.equal(protectedResult.post.withheld,'concealment',body);assert.equal(protectedResult.post.body,'');
}
console.log('PASS: mandatory private policy; fixed whole-act placeholders; normalized identifying matches and moderation withheld before serialization; safe acts exact; original observation unchanged. Does not prove all contextual identity clues are detectable.');
