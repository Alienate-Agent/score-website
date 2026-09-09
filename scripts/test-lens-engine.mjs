import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Executes the actual generated calculation/audio scheduling core against test
// doubles. This is not a browser, screen-reader, loudness or visual test.
const root = path.resolve(process.argv[2] ?? 'public/lens');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const inventory=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
assert.deepEqual(fs.readdirSync(root).sort((a,b)=>a.localeCompare(b)),['manifest.json',...inventory.files.map(f=>f.path)].sort((a,b)=>a.localeCompare(b)));
for(const file of inventory.files){const bytes=fs.readFileSync(path.join(root,file.path));assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);}
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
const events=[];
const document={querySelector:s=>node(s.startsWith('#')?s.slice(1):s),querySelectorAll:()=>[],getElementById:id=>node(id),createElement:tag=>node('new'+tag+nodes.size),addEventListener(){},dispatchEvent:e=>events.push(e),body:node('body')};
let audioStarts=0,timerId=0;
const contexts=[],intervals=[],timers=new Map();
function param(value=0){return{value,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}};}
class AudioDouble{
  constructor(){this.currentTime=0;this.sampleRate=100;this.frequencies=[];this.delays=[];this.closed=false;this.state='running';this.destination={};contexts.push(this);audioStarts++;}
  resume(){return Promise.resolve();}close(){this.closed=true;this.state='closed';return Promise.resolve();}
  make(){return{connect(dest){return dest;},disconnect(){},gain:param(),frequency:param(),Q:param(),pan:param(),delayTime:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};}
  createGain(){return this.make();}createBiquadFilter(){return this.make();}createStereoPanner(){return this.make();}createDynamicsCompressor(){return this.make();}createWaveShaper(){return this.make();}
  createChannelSplitter(){return this.make();}
  createAnalyser(){return{...this.make(),fftSize:1024,smoothingTimeConstant:0,getByteTimeDomainData(){},getByteFrequencyData(){}};}
  createDelay(max){this.delays.push(max);return this.make();}
  createPeriodicWave(){return {};}
  createBuffer(channels,len){assert.ok(Number.isFinite(len)&&len>=0);return{getChannelData:()=>new Float32Array(len)};}
  createBufferSource(){return{...this.make(),start(){},stop(){}};}
  createOscillator(){const n=this.make();const actual=n.frequency.setValueAtTime.bind(n.frequency);n.frequency.setValueAtTime=v=>{this.frequencies.push(v);actual(v);};n.setPeriodicWave=()=>{};n.start=()=>{};n.stop=()=>{};return n;}
}
const box={document,console,TextEncoder,Blob,URL,URLSearchParams,Event,CustomEvent,structuredClone,location:{search:''},
  setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),setInterval:fn=>{intervals.push(fn);return intervals.length;},clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},
  AudioContext:AudioDouble,addEventListener(){},fetch:async name=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'))})};
box.window=box;vm.createContext(box);
new vm.Script(fs.readFileSync(path.join(root,'lens-synth.js'),'utf8')).runInContext(box);
new vm.Script(engine).runInContext(box,{timeout:10000});
await new Promise(resolve=>setImmediate(resolve));
assert.equal(audioStarts,0,'No autoplay during load or calculation');
const E=box.E14;
assert.equal(E.OPT.pitch,'safe');assert.equal(E.OPT.bass,'hour');
const score=E.scoreDocument();assert.equal(score.inputs_ready,true);
assert.equal(score.generator,'Score Lens playback derivative v2 · Claude Advisor mapping; Sol Website adaptation');
assert.equal(score.inputs.input_sha256,JSON.parse(fs.readFileSync(path.join(root,'source-inputs.json'))).provenance.input_sha256);
assert.equal(score.calculated_events.filter(e=>e.kind==='withheld'&&e.who==='Tidemark').length,0);
assert.ok(score.calculated_events.some(e=>e.kind==='board_comment'));
for(const n of score.rendered_notes)assert.ok(n.output_hz>=60&&n.output_hz<4000);
assert.ok(!JSON.stringify(score).toLowerCase().includes('nothing chosen'));

// Compare every calculated event and rendered note with the released derivative,
// not merely a few examples or a generator-produced expected value.
const priorHtml=execFileSync('git',['show','45599ae:public/lens/index.html'],{encoding:'utf8',maxBuffer:2_000_000});
const priorEngine=[...priorHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const D='));
const priorBox={...box};priorBox.window=priorBox;vm.createContext(priorBox);
new vm.Script(fs.readFileSync(path.join(root,'lens-synth.js'),'utf8')).runInContext(priorBox);
new vm.Script(priorEngine).runInContext(priorBox,{timeout:10000});
await new Promise(resolve=>setImmediate(resolve));
const previous=priorBox.E14.scoreDocument();
for(const key of ['inputs','mapping','options','registers','percussion_register','pan_overrides','calculated_events','rendered_notes'])assert.equal(JSON.stringify(score[key]),JSON.stringify(previous[key]),'Unchanged '+key);
assert.equal(audioStarts,0,'Neither calculation starts audio');

const calls=[];
const realNote=box.Lens.note;box.Lens.note=(ctx,args)=>{calls.push(args);realNote(ctx,args);};
const realNoise=box.Lens.noiseBand;box.Lens.noiseBand=(...args)=>{calls.push({contextNoise:true});realNoise(...args);};
const realClick=box.Lens.click;box.Lens.click=(...args)=>{calls.push({contextClick:true});realClick(...args);};
for(const rc of E.REC()){
  const plan=E.playbackPlan(0,rc.r.key);
  assert.deepEqual(Array.from(plan.records,r=>r.r.key),[rc.r.key]);
  assert.equal(plan.start,rc.at);assert.ok(Number.isFinite(plan.end)&&plan.end>rc.end);
}
const startsBeforeInvalid=audioStarts;
assert.throws(()=>E.playAct('tidemark:excluded'),/eligible/);
assert.throws(()=>E.playAct(),/eligible/);
assert.equal(audioStarts,startsBeforeInvalid,'Invalid selection cannot create audio');
const solo=E.REC().find(rc=>rc.r.key==='tidemark:post:3581');
E.playAct(solo.r.key);const soloCtx=contexts.at(-1);
const soloTimer=timers.get(timerId);assert.ok(soloTimer.ms>0&&soloTimer.ms<60000);
soloCtx.currentTime=solo.end-solo.at+1;intervals.at(-1)();
assert.equal(calls.length,solo.notes.length,'Every selected note and no contextual sounds scheduled');
for(let i=0;i<calls.length;i++){
  assert.equal(calls[i].f,score.rendered_notes.filter(n=>n.act_key===solo.r.key)[i].output_hz);
  assert.equal(calls[i].dur,solo.notes[i].hd);
  assert.equal(calls[i].t,0.2+(solo.notes[i].t-solo.at));
}
assert.equal(E.scoreDocument().last_playback.act_key,solo.r.key);
assert.equal(E.scoreDocument().last_playback.mode,'individual-act');
soloTimer.fn();assert.equal(soloCtx.closed,true,'Solo ends without awaiting another act');
assert.equal(events.at(-1).detail.state,'ended');
E.playAct(solo.r.key);const cancelled=timerId;E.stop();assert.ok(!timers.has(cancelled),'Stop cancels solo end timer');
E.playAct(solo.r.key);assert.ok(timers.has(timerId));E.play(0);assert.ok(!timers.has(timerId),'Full playback cancels previous solo end timer');E.stop();

// Real engine remapping: keep the current context, already scheduled notes,
// current act, and its first unscheduled onset. Recalculate only the future.
calls.length=0;E.playAct(solo.r.key);const liveCtx=contexts.at(-1),starts=audioStarts;
intervals.at(-1)();const scheduled=calls.length;
assert.ok(scheduled>0&&scheduled<solo.notes.length);
const oldCalls=calls.map(c=>({f:c.f,t:c.t,dur:c.dur,gain:c.gain}));
const boundary=E.patchPerformance.notes[scheduled].t_s;
const patch={mapping:{...E.MAP,pitch:'len',dur:'first'},options:{pitch:'safe',quant:'off',temper:'off',reg:'off'}};
assert.equal(E.requestPatch(patch),'queued');assert.equal(E.MAP.pitch,'id');
liveCtx.currentTime=.06;intervals.at(-1)();
assert.equal(audioStarts,starts);assert.equal(liveCtx.closed,false);assert.equal(E.MAP.pitch,'len');
assert.deepEqual(calls.slice(0,scheduled).map(c=>({f:c.f,t:c.t,dur:c.dur,gain:c.gain})),oldCalls);
assert.equal(E.patchPerformance.notes[scheduled].t_s,boundary);
assert.equal(E.patchPerformance.notes.length,solo.notes.length);
assert.equal(E.patchPerformance.changes.length,1);
assert.equal(E.patchPerformance.changes[0].effective_from_s,boundary);
assert.equal(E.patchPerformance.act_key,solo.r.key);
liveCtx.currentTime=30;intervals.at(-1)();assert.equal(calls.length,solo.notes.length);
for(let i=scheduled;i<calls.length;i++){
 assert.equal(calls[i].f,E.patchPerformance.notes[i].output_hz);
 assert.equal(calls[i].dur,E.patchPerformance.notes[i].duration_s);
}
assert.ok(!calls.some(c=>c.contextNoise||c.contextClick));
const reset={mapping:{...E.MAPDEF},options:patch.options};
assert.equal(E.requestPatch(reset),'queued');E.stop();assert.equal(E.MAP.pitch,'id','Stopping preserves an accepted but not yet audible patch for next Play');
assert.throws(()=>E.requestPatch({mapping:{wrong:'id'},options:{}}),/Unknown/);
assert.throws(()=>E.requestPatch({mapping:{pitch:'private'},options:{}}),/Unknown/);
assert.throws(()=>E.requestPatch({mapping:{},options:{pitch:'unsafe'}}),/Unknown/);
assert.equal(E.requestPatch(reset),'applied');assert.equal(audioStarts,starts);
console.log('PASS: live patch preserves audio context, past schedule, next onset and exact act scope; future frequencies/durations match performed export; pending Stop and invalid routing are handled.');

// Listener transport: no duplicate note scheduling when Loop is off; repeated
// passes share the same audio clock and omit the 10.288-second echo gap.
assert.equal(E.soloTransport.echo,true,'Embedded/legacy engine keeps its original echo default');
assert.throws(()=>E.setSoloTransport({loop:'yes'}),/Invalid/);
assert.throws(()=>E.setSoloTransport({feedback:5}),/Invalid/);
E.setSoloTransport({loop:false,echo:false});calls.length=0;
E.playAct(solo.r.key);const dryCtx=contexts.at(-1),dryTimer=timers.get(timerId);
assert.ok(dryTimer.ms<2000,'Dry solo ends after its notes and release, without the delay gap');
dryCtx.currentTime=1.5;intervals.at(-1)();intervals.at(-1)();
assert.equal(calls.length,solo.notes.length,'A one-shot schedules only one phrase');
dryTimer.fn();assert.equal(dryCtx.closed,true);
const phrase=E.REC().find(rc=>rc.r.key===solo.r.key);
E.setSoloTransport({loop:true,echo:false});calls.length=0;
E.playAct(solo.r.key);const repeatCtx=contexts.at(-1),repeatStarts=audioStarts,period=phrase.end-phrase.at;
for(let t=0;t<period*5+.2;t+=.025){repeatCtx.currentTime=t;intervals.at(-1)();}
assert.equal(audioStarts,repeatStarts,'Loop never restarts the AudioContext');
assert.equal(repeatCtx.closed,false);assert.ok(E.patchPerformance.cycle>=5);
assert.ok(calls.length>=phrase.notes.length*5);
for(let pass=0;pass<4;pass++)for(let i=0;i<phrase.notes.length;i++){
 const note=calls[pass*phrase.notes.length+i];
 assert.ok(Math.abs(note.t-(.2+period*pass+phrase.notes[i].t-phrase.at))<1e-9,'Sample-clock loop start without inserted silence');
}
assert.ok(E.patchPerformance.notes.length===phrase.notes.length,'Visual/export contains the current pass, not an expanding list');
E.setSoloTransport({loop:false});assert.ok(timers.get(timerId)?.ms<2000,'Loop off finishes the already scheduled pass');
timers.get(timerId).fn();assert.equal(repeatCtx.closed,true);
E.setSoloTransport({loop:true});E.playAct(solo.r.key);const stoppedLoop=contexts.at(-1);E.stop();
assert.equal(stoppedLoop.closed,true);assert.equal(E.patchPerformance,null);
E.setSoloTransport({loop:false,echo:true});
console.log('PASS: explicit loop/echo settings, dry one-shot end, clock-continuous repeat, bounded current-pass view, loop-off finish and immediate Stop.');

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
console.log('PASS: all prior calculation outputs unchanged; all eligible solo plans bounded; exact solo-note scheduling, no contextual generators, invalid selection blocked, solo end and timer cancellation, export scope.');
