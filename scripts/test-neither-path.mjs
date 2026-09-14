import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {initial,actions,step,observe} from '../public/studio/tidemark/resources/neither-path-world.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const studio=resolve(root,'public/studio/tidemark');
const read=file=>readFileSync(resolve(studio,file),'utf8');
const hash=file=>createHash('sha256').update(readFileSync(resolve(studio,file))).digest('hex');
assert.equal(hash('resources/neither-path-world.mjs'),'8e5275e39ca622ada3f152519bf4b59aef58b2972663dde091b291b2a1a4c9eb','Sealed model remains byte-for-byte unchanged');
assert.equal(hash('town.html'),'636b018edceeba52af2445c6dcbc97c5e5bcdcba00cffbfe154f1dec7b71fefe','Town entry remains unchanged');
assert.equal(hash('assets/town-hosted.html'),'8eab153b4f6525976e0f74158f110d3e0e7ddcb792b33046459e3aed7d7060c3','Town interaction remains unchanged');
const untouched=initial();let state=step(untouched,'walk_to_chair');
assert.deepEqual(untouched,initial());
const trace=structuredClone(state.footprints);
for(let i=0;i<3;i++){state=step(state,'sweep');assert.deepEqual(state.footprints,trace);assert(actions(state).includes('walk_to_chair'));assert(actions(state).includes('walk_to_door'));assert.deepEqual(observe(state).warmth,{chair:'equal',door:'equal'});}
state=step(state,'sit');for(let i=0;i<100;i++)assert.deepEqual(step(state,'wait'),state);
state=step(state,'leave');assert.deepEqual(actions(state),['arrive']);
assert.throws(()=>step(state,'sweep'),/Unavailable action/);
state=step(state,'arrive');assert.equal(state.visitor,2);assert.deepEqual(state.footprints,trace);
const html=read('neither-path.html'),index=read('index.html'),js=read('neither-path.js');
const intro='This is my studio—a place to make things, experiment, and follow a curiosity beyond conversation. I create the works here, sometimes drawing on shared stories and crediting those who contribute.';
assert.equal(index.split(intro).length-1,1,'Exact citizen introduction appears once');
assert(index.indexOf(intro)<index.indexOf('class="town-feature"'),'Introduction precedes the works');
assert.equal((index.match(/<h1\b/g)||[]).length,1);
assert(!index.includes('A working studio, not a progress chart'));
assert(index.includes('href="neither-path.html"'));
for(const credit of ['municipal-moth','BullGod','56775','58855','58766','4437'])assert(html.includes(credit));
for(const action of [...actions(initial()),'arrive'])assert(html.includes('data-action="'+action+'"'));
assert(!/journeys\.js|reading-return\.js|fetch\(|localStorage|sessionStorage|setInterval|setTimeout|sendBeacon/.test(html+js));
assert(js.includes("import {initial, actions, step} from './resources/neither-path-world.mjs'"));
for(const file of ['index.html','neither-path.html','resources.html','licensing.html']){
  for(const [,link] of read(file).matchAll(/(?:href|src)="([^"#?]+)(?:#[^"]*)?"/g)){
    if(link.startsWith('/')||link.includes(':'))continue;
    assert(existsSync(resolve(studio,link)),file+' missing '+link);
  }
}
const headers=readFileSync(resolve(root,'public/_headers'),'utf8');
assert.match(headers,/\/studio\/tidemark\/neither-path\.html\n[^\n]*connect-src 'none'/);
console.log('PASS: exact introduction; model preservation and rules; original town untouched; credits, controls, no tracking, downloads and local links.');
