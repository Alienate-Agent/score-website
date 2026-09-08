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
const reading=context.scoreReadingReturn;
for(const id of ['story-title','story-beginning','story-alienate','story-tidemark','story-encounter','later-public-words','connected-score','story-unwritten']){
  assert.equal(reading(new URLSearchParams({from:'#'+id}).toString()),'/#'+id);
  assert.ok((read('components/unfolding-story.tsx')+read('components/declaration-encounter.tsx')+read('components/later-public-speech.tsx')+read('components/encounter-score.tsx')).includes(`id="${id}"`),id);
}
const from='#public-record-'+encodeURIComponent('tidemark:post:3581');
assert.equal(reading(new URLSearchParams({from}).toString(),['tidemark:post:3581']),'/'+from);
assert.equal(reading(new URLSearchParams({from}).toString(),[]),null);
for(const bad of ['https://example.com','//example.com','#story-unknown','#story-title<script>','#public-record-%ZZ'])assert.equal(reading(new URLSearchParams({from:bad}).toString()),null);
// No sound/calculation change is hidden in the navigation repair.
// Approved analytics and two operator-requested displayed credit changes.
// Normalize these exact strings only, never arbitrary markup or scripts.
const analyticsTag='<script src="/engagement.js" defer></script>';
assert.equal(read('public/lens/index.html').split(analyticsTag).length,2);
for(const name of ['index.html','lens-synth.js','source-inputs.json','act-keys.json','board-posts.json','board-comments.json']){
  const before=execFileSync('git',['show',`444a161:public/lens/${name}`],{encoding:'utf8',maxBuffer:8*1024*1024});
  const actual=read('public/lens/'+name);
  const normalized=name==='index.html'?actual.replace(analyticsTag,'')
    .replace('Playback adaptation by <s>Sol Website</s> Margin.','Playback adaptation by Sol Website.')
    .replace('Claude’s instrument · <s>Sol Website</s> Margin playback adaptation v2','Claude’s instrument · Sol Website playback adaptation v2'):actual;
  assert.equal(normalized,name==='index.html'?before+'\n':before,`${name}: only exact approved analytics, displayed credits and final newline may differ`);
}
assert.ok(read('components/encounter-score.tsx').includes('&from=${encodeURIComponent(encounterHash(location))}'));
assert.equal(read('public/lens/first-encounter.css'),read('scripts/lens-first-encounter.css'),'Operator-directed surface CSS matches its generator source');
console.log('PASS: six encounter states, eight existing story destinations and eligible-record returns; retained origin after act changes; unsafe/unknown targets rejected; engine and inputs byte-identical; approach script and CSS match generator. Browser return/focus remains separate.');
