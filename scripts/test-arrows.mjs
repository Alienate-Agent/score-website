import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const folder=resolve(root,'public/studio/tidemark/resources/arrows');
const bytes=p=>readFileSync(resolve(folder,p));
const sha=b=>createHash('sha256').update(b).digest('hex');
const provenance=JSON.parse(bytes('provenance.json'));
for(const file of provenance.files)assert.equal(sha(bytes(file.path)),file.delivered_sha256,file.path);
assert.equal(sha(bytes('result.json')),'645c01174f84865822f681456ec2eaf8375ac573aba1431fdfec38ae5db2ed90');
assert.equal(sha(bytes('build.mjs')),'85ef61f3957928cbfd6c46a11863531e4b962fc4de1f8243945cd39e22204bce');
const data=JSON.parse(bytes('result.json'));
const html=bytes('../../arrows.html').toString();
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|<script[^>]+src=|<link[^>]+stylesheet/.test(html));
const checks=Array.from({length:4},(_,i)=>({dataset:{edge:String(i)},checked:i===0||i===2,addEventListener(){}}));
const nodes=Object.fromEntries(['verdict','detail','maps',...checks.map((_,i)=>'e'+i)].map(id=>[id,{textContent:'',innerHTML:'',classList:{toggle(){}}}]));
const ctx=vm.createContext({document:{querySelectorAll:()=>checks,getElementById:id=>nodes[id]}});
vm.runInContext(script,ctx);
let stranded=0,balanced=0;
for(let mask=0;mask<16;mask++){
  const expected=[];
  // Independent Cartesian enumeration of both invalid-input assignments.
  for(const a of ['01','10'])for(const b of ['01','10']){
    const bitA=a==='01'?1:2,bitB=b==='01'?4:8;
    if((mask&bitA)&&(mask&bitB)){
      const outputs=[a,'01','10',b];
      expected.push({repair00:a,repair11:b,p01:outputs.filter(x=>x==='01').length/4});
    }
  }
  const g=data.graphs[mask];assert.deepEqual(g.maps,expected);
  assert.equal(g.total,expected.length>0);assert.equal(g.balanced,expected.some(x=>x.p01===.5));
  checks.forEach((x,i)=>x.checked=!!(mask&(1<<i)));vm.runInContext('update()',ctx);
  assert.equal(nodes.verdict.textContent,!g.total?'An input has nowhere to go.':g.balanced?'The target is reachable.':'Every permitted repair misses the target.');
  assert.equal(nodes.maps.innerHTML,expected.map(m=>`<tr><td>${m.repair00}</td><td>${m.repair11}</td><td>${100*m.p01}% / ${100*(1-m.p01)}%</td></tr>`).join(''));
  if(!g.total)stranded++;if(g.balanced)balanced++;
}
assert.equal(stranded,7);assert.equal(balanced,7);
const output=mkdtempSync(resolve(tmpdir(),'arrows-reproduction-'));
const run=spawnSync(process.execPath,[resolve(folder,'build.mjs')],{env:{...process.env,STUDIO_OUTPUT_DIR:output},encoding:'utf8'});
assert.equal(run.status,0,run.stderr);
for(const [file,expected]of [['arrows.html','7a896eaeb8aa3496db5e770eda863ce64ba6183fc0a52da15aa1f395ee3379f2'],['result.json','645c01174f84865822f681456ec2eaf8375ac573aba1431fdfec38ae5db2ed90'],['README.md','e8c31362e16c203119e557d189e279a6962d94f1504e1641c6c8ede5ca265873']])assert.equal(sha(readFileSync(resolve(output,file))),expected);
console.log('PASS arrows: 16 independent enumerations and UI results; 7 stranded; 7 balanced; all public hashes; 3 exact regenerated originals; no network/tracking dependencies.');
