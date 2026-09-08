import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {indexRecords,searchRecords} from '../lib/cross-record-search.ts';
import {recordLabel,recordSubjects} from '../lib/record-discovery.ts';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const json=p=>JSON.parse(read('public/records/'+p));
const compile=(code,require)=>{
  const compiledModule={exports:{}};
  vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module:compiledModule,exports:compiledModule.exports,require});
  return compiledModule.exports;
};
const encounterModule=compile(read('lib/encounters.ts'),id=>{
  if(id.includes('remedy-answer'))return json('remedy-answer-2026-09-07.json');
  if(id.includes('connected-encounters'))return json('connected-encounters-2026-09-07.json');
  if(id.includes('dated-public-record'))return json('dated-public-record-v1.json');
  throw new Error(id);
});
// The locator is a categorical voice index, not a count or shared authorship.
const {encounters,encounterVoices}=encounterModule;
assert.equal(encounters.length,4);
for(const encounter of encounters){
  const voices=Array.from(encounterVoices(encounter));
  const actual=[encounter.post,...encounter.comments].map(a=>a.author.toLowerCase());
  assert.equal(new Set(voices).size,voices.length);
  assert.equal(voices.includes('Alienate'),actual.includes('alienate'));
  assert.equal(voices.includes('Tidemark'),actual.includes('tidemark'));
  assert.equal(voices.includes('Polity participant'),actual.some(a=>!['alienate','tidemark'].includes(a)));
  assert.ok(voices.length<=3);
}
assert.deepEqual(Array.from(encounterVoices({post:{author:'tidemark'},comments:[{author:'Tidemark'},{author:'one'},{author:'two'}]})),['Tidemark','Polity participant']);
const storyCitations=[...read('components/unfolding-story.tsx').matchAll(/record="([^"]+)" encounter="([^"]+)"/g)];
assert.equal(storyCitations.length,2);
for(const [,key,href] of storyCitations){
  const location=encounterModule.parseEncounterHash(href);
  assert.ok(location,'A story citation must resolve to an existing encounter');
  const encounter=encounters.find(e=>e.id===location.event);
  const act=[encounter.post,...encounter.comments].find(a=>a.key===location.act);
  const source=json('dated-public-record-v1.json').records.find(r=>r.act_key===key);
  assert.equal(`${act.author.toLowerCase()}:${act.key}`,key);
  assert.equal(act.body_sha256,source.exact_content.body_sha256,'Changing presentation must not substitute a later source version');
  assert.equal(act.body,source.exact_content.body);
}
// Exercise the actual component's adapters, not a second copy of their mapping.
const {records}=compile(read('components/cross-record-search.tsx')+'\nexport {records};',id=>{
  if(id==='react'||id==='react/jsx-runtime'||id.endsWith('.css'))return {};
  if(id.includes('dated-public-record'))return json('dated-public-record-v1.json');
  if(id.includes('later-public-speech'))return json('later-public-speech-2026-09-05.json');
  if(id.endsWith('/encounters'))return encounterModule;
  if(id.endsWith('/record-discovery'))return {recordLabel,recordSubjects};
  if(id.endsWith('/cross-record-search'))return {indexRecords,searchRecords};
  throw new Error(id);
});
const find=(q,a)=>searchRecords(records,q,a);
assert.equal(find('44750').length,1);
assert.equal(find('46595').length,1);
assert.equal(find('46595')[0].sources[0].href,'#encounter-remedy~words~comment%3A46595');
assert.equal(find('44750')[0].sources[0].href,'#encounter-remedy~words~comment%3A44750');
assert.equal(find('inherit obligation','tidemark').length,1);
assert.equal(find('inherit obligation','alienate').length,0);
assert.ok(find('perception','tidemark').some(r=>r.key==='tidemark:comment:44950'));
assert.equal(find('xyzzy-no-such-record').length,0);
assert.equal(find('kínship').length,find('kinship').length);
assert.equal(find('kinship').length,4);
assert.ok(find('39535','golden-legend').length);
assert.ok(find('Microraptor').length);
const repeated=records.filter(r=>r.key==='alienate:comment:41157');
assert.equal(repeated.length,1);
assert.equal(repeated[0].sources.length,2);
const seed={key:'test:comment:1',digest:'one',author:'Test',title:'Example',originalTitle:false,body:'first body',date:null,subjects:'',source:{href:'#a',collection:'a'}};
const different=indexRecords([seed,{...seed,digest:'two',body:'changed body',source:{href:'#b',collection:'b'}}]);
assert.equal(different.length,2,'Changed bodies must not be silently merged');
assert.equal(searchRecords(different,'changed').length,1);
assert.ok(records.every(r=>r.sources.every(s=>s.href.startsWith('#'))));
console.log(`PASS: actual adapters index ${records.length} record versions, preserve repeated observations, separate changed bodies, and find newer/earlier speech and surrounding voices. Browser navigation remains separate.`);
