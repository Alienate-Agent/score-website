import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const script=read('public/lens/first-encounter.js');
assert.equal(script,read('scripts/lens-first-encounter.js'),'Generated approach script matches generator source');
const context={URLSearchParams};
vm.runInNewContext(script.split('\n(() => {')[0],context);
const resolve=context.scoreEncounterReturn;
assert.equal(typeof resolve,'function');

// Read the actual encounter data rather than assume there are only two eligible
// acts forever. A future added sound/encounter connection must extend the list.
const testModule={exports:{}};
vm.runInNewContext(ts.transpileModule(read('lib/encounters.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{
  module:testModule,exports:testModule.exports,require:id=>{
    if(id.includes('remedy-answer'))return JSON.parse(read('public/records/remedy-answer-2026-09-07.json'));
    if(id.includes('connected-encounters'))return JSON.parse(read('public/records/connected-encounters-2026-09-07.json'));
    if(id.includes('dated-public-record'))return JSON.parse(read('public/records/dated-public-record-v1.json'));
    throw Error(id);
  },
});
const {encounters,encounterHash}=testModule.exports;
const eligible=new Set(JSON.parse(read('public/lens/act-keys.json')));
let routes=0;
for(const event of encounters)for(const act of [event.post,...event.comments]){
  const record=`${act.author.toLowerCase()}:${act.kind}:${act.id}`;
  if(!eligible.has(record))continue;
  for(const view of ['words','telling']){
    const from=encounterHash({event:event.id,view,act:act.key});
    const query=new URLSearchParams({record,from});
    assert.equal(resolve(query.toString()),'/'+from);
    query.set('record','alienate:post:1844');
    assert.equal(resolve(query.toString()),'/'+from,'Choosing another eligible act does not erase the origin');
    routes++;
  }
}
assert.equal(routes,6,'Review added routes when the eligible encounter set changes');
for(const from of ['https://example.com/','//example.com/','javascript:alert(1)',
  '#encounter-kinship~words~post%3A9999','#encounter-rule~words~post%3A3581',
  '#encounter-kinship~words~post:3581','#encounter-kinship~words~post%3A3581<script>',
  '#encounter-unknown~words~post%3A3581','/#story-title','']){
  assert.equal(resolve(new URLSearchParams({record:'tidemark:post:3581',from}).toString()),null);
}
assert.equal(resolve(''),null);
// No sound/calculation change is hidden in the navigation repair.
for(const name of ['index.html','lens-synth.js','source-inputs.json','act-keys.json','board-posts.json','board-comments.json']){
  const before=execFileSync('git',['show',`444a161:public/lens/${name}`],{encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(read('public/lens/'+name),before,`${name} unchanged`);
}
assert.ok(read('components/encounter-score.tsx').includes('&from=${encodeURIComponent(encounterHash(location))}'));
assert.equal(read('public/lens/first-encounter.css'),read('scripts/lens-first-encounter.css'),'Operator-directed surface CSS matches its generator source');
console.log('PASS: six exact local return states; retained origin after act changes; unsafe/unknown targets rejected; engine and inputs byte-identical; surface CSS matches generator. Browser return/focus remains separate.');
