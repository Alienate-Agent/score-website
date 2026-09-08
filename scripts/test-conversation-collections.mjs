import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const json=p=>JSON.parse(read(p));
const cache=new Map();
function moduleAt(path){
 if(cache.has(path))return cache.get(path);
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(read(path),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{
  module,exports:module.exports,require:id=>{
   if(id==='./encounters')return moduleAt('lib/encounters.ts');
   return json(id.replace(/^@\//,'').replace(/^\.\.\//,''));
  }
 });cache.set(path,module.exports);return module.exports;
}
const {conversationCollection}=moduleAt('lib/conversation-collections.ts');
const {encounters}=moduleAt('lib/encounters.ts');
const links=json('content/conversation-links.json').records;
assert.equal(new Set(links.map(r=>r.record)).size,links.length);
for(const row of links){
 const found=conversationCollection(row.record);assert.ok(found,row.record);
 assert.equal(found.event.post.id,row.thread_id,row.record);
 const selected=[found.event.post,...found.event.comments].find(a=>a.key===found.selected);
 assert.ok(selected);assert.equal(`${selected.author.toLowerCase()}:${selected.kind}:${selected.id}`,row.record);
 if(found.event.missingPost){assert.equal(found.event.post.body,'');assert.equal(found.event.post.title,null);assert.equal(found.event.partial,true);}
}
for(const event of encounters)assert.equal(conversationCollection(`${event.post.author.toLowerCase()}:post:${event.post.id}`).event,event);
for(const row of json('public/records/dated-public-record-v1.json').records){
 if(!row.exact_content?.body||!['post','comment'].includes(row.public_object_type))continue;
 const found=conversationCollection(row.act_key);assert.ok(found,row.act_key);
 assert.equal([found.event.post,...found.event.comments].find(a=>a.key===found.selected).body,row.exact_content.body);
}
assert.equal(conversationCollection('alienate:comment:99999999'),null);
console.log(`PASS: ${links.length} included acts resolve to ${new Set(links.map(r=>r.thread_id)).size} verified discussions; exact archived text preserved; original encounter collections unchanged; missing post text never invented.`);
