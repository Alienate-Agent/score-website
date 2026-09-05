import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Executes the actual generated calculation/audio scheduling core against test
// doubles. This is not a browser, screen-reader, loudness or visual test.
const root = path.resolve(process.argv[2] ?? 'public/lens');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const sourceData=JSON.parse(fs.readFileSync(path.join(root,'source-inputs.json'),'utf8'));
const actKeys=JSON.parse(fs.readFileSync(path.join(root,'act-keys.json'),'utf8'));
assert.deepEqual(actKeys,sourceData.records.filter(r=>r.at&&r.obj!=='vote_or_karma_count').map(r=>r.key));
const sourceKeys=new Set(JSON.parse(fs.readFileSync(path.join(root,'../records/dated-public-record-v1.json'),'utf8')).records.map(r=>r.act_key));
assert.ok(actKeys.every(key=>sourceKeys.has(key)),'Every instrument act can return to its exact readable record');
const engine = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const D='));
assert.ok(engine);
const defaults={oPitch:'safe',oTime:'uniform',oTemper:'off',oReg:'off',oScale:'off',oGrid:'off',oDyn:'lit',oBand:'off',oBass:'hour',oPerc:'off',oVoice:'off',oTonic:'polity',oQuant:'off'};
const nodes=new Map();
function node(id=''){
  if(nodes.has(id))return nodes.get(id);
  const n={id,dataset:{},value:defaults[id]??'',textContent:'',innerHTML:'',hidden:false,disabled:false,open:false,
    style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    appendChild(){},remove(){},setAttribute(){},addEventListener(){},querySelector:s=>node(id+' '+s),querySelectorAll:()=>[],
    getContext:()=>new Proxy({}, {get:()=>()=>{}})};
  nodes.set(id,n);return n;
}
const document={querySelector:s=>node(s.startsWith('#')?s.slice(1):s),querySelectorAll:()=>[],getElementById:id=>node(id),createElement:tag=>node('new'+tag+nodes.size),addEventListener(){},body:node('body')};
let audioStarts=0,contexts=[],intervals=[];
function param(value=0){return{value,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}};}
class AudioDouble{
  constructor(){this.currentTime=0;this.sampleRate=100;this.frequencies=[];this.delays=[];this.closed=false;this.destination={};contexts.push(this);audioStarts++;}
  resume(){return Promise.resolve();}close(){this.closed=true;return Promise.resolve();}
  make(){return{connect(dest){return dest;},disconnect(){},gain:param(),frequency:param(),Q:param(),pan:param(),delayTime:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};}
  createGain(){return this.make();}createBiquadFilter(){return this.make();}createStereoPanner(){return this.make();}createDynamicsCompressor(){return this.make();}createWaveShaper(){return this.make();}
  createAnalyser(){return{...this.make(),fftSize:1024,smoothingTimeConstant:0,getByteTimeDomainData(){},getByteFrequencyData(){}};}
  createDelay(max){this.delays.push(max);return this.make();}
  createPeriodicWave(){return {};}
  createBuffer(channels,len){assert.ok(Number.isFinite(len)&&len>=0);return{getChannelData:()=>new Float32Array(len)};}
  createBufferSource(){return{...this.make(),start(){},stop(){}};}
  createOscillator(){const n=this.make();const actual=n.frequency.setValueAtTime.bind(n.frequency);n.frequency.setValueAtTime=v=>{this.frequencies.push(v);actual(v);};n.setPeriodicWave=()=>{};n.start=()=>{};n.stop=()=>{};return n;}
}
const box={document,console,TextEncoder,Blob,URL,URLSearchParams,structuredClone,location:{search:''},
  setTimeout:()=>1,clearTimeout(){},setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  AudioContext:AudioDouble,addEventListener(){},fetch:async name=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'))})};
box.window=box;vm.createContext(box);
new vm.Script(fs.readFileSync(path.join(root,'lens-synth.js'),'utf8')).runInContext(box);
new vm.Script(engine).runInContext(box,{timeout:10000});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(audioStarts,0,'No autoplay during load or calculation');
const E=box.E14;
assert.equal(E.OPT.pitch,'safe');assert.equal(E.OPT.bass,'hour');
const score=E.scoreDocument();assert.equal(score.inputs_ready,true);
assert.equal(score.generator,'Score Lens playback derivative v1 · Claude Advisor mapping; Sol Website adaptation');
assert.equal(score.inputs.input_sha256,JSON.parse(fs.readFileSync(path.join(root,'source-inputs.json'))).provenance.input_sha256);
assert.equal(score.calculated_events.filter(e=>e.kind==='withheld'&&e.who==='Tidemark').length,0);
assert.ok(score.calculated_events.some(e=>e.kind==='board_comment'));
for(const n of score.rendered_notes)assert.ok(n.output_hz>=60&&n.output_hz<4000);
assert.ok(!JSON.stringify(score).toLowerCase().includes('nothing chosen'));

// Visitor inspection of unfolded values never sends them directly to oscillators.
node('oPitch').value='none';E.readOpts();E.applyOpts();
const unfolded=E.scoreDocument();assert.ok(unfolded.rendered_notes.some(n=>n.mapped_hz>=4000));
for(const n of unfolded.rendered_notes)assert.ok(n.output_hz>=60&&n.output_hz<4000);
const target=E.REC().find(r=>r.r.key==='tidemark:comment:32752');assert.ok(target);
E.play(target.at);const ctx=contexts.at(-1);ctx.currentTime=0.3;intervals.at(-1)();
assert.ok(ctx.frequencies.length>0,'Actual scheduling reached oscillators');
for(const f of ctx.frequencies)assert.ok(f>=60&&f<4000);
assert.ok(ctx.delays.some(s=>s>2),'Echo node allows its declared delay');
E.stop();assert.equal(ctx.closed,true,'Stop closes the actual planned context');
console.log('PASS: generated engine loads, fixed inputs settle, no autoplay, conservative defaults, complete comment export, excluded aggregate absent, authored receipt, out-of-range inspection with bounded oscillator output, declared delay capacity and context-closing Stop.');
console.log('Test doubles do not establish browser UI behavior, screen-reader usability, acoustic safety or artistic merit.');
