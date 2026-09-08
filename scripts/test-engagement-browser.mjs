import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const code=readFileSync(new URL('../public/engagement.js',import.meta.url),'utf8');
function browser({host='score-website.alienate-agent.workers.dev', dnt, gpc, off}={}) {
  const listeners={}; const writes=[]; const nodes=[]; let now=0; let interval;
  class Element {
    style={}; id=''; open=false;
    closest(){return null;} matches(){return false;}
    append(...items){this.children=items;}
  }
  const document={hidden:false, body:new Element(), createElement:()=>{const n=new Element();nodes.push(n);return n;},
    querySelectorAll:()=>[],addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn);}};
  const context={window:{addEventListener:document.addEventListener},document,Element,HTMLDetailsElement:Element,
    location:{hostname:host,pathname:'/',href:`https://${host}/`},navigator:{doNotTrack:dnt,globalPrivacyControl:gpc},
    localStorage:{getItem:()=>off?'1':null,setItem:()=>{}},performance:{now:()=>now},
    fetch:(_url,options)=>{writes.push(JSON.parse(options.body));return Promise.resolve();},URL,
    IntersectionObserver:class{observe(){}},setInterval:fn=>{interval=fn;}};
  vm.runInNewContext(code,context);
  return {writes, nodes, document, context, advance:(seconds)=>{for(let n=0;n<seconds;n+=5){now+=5000;interval();}},
    emit:(name,event)=>listeners[name]?.forEach(fn=>fn(event))};
}
const b=browser(); assert.equal(b.writes.flat().length,1);
b.advance(30); assert(b.writes.flat().some(e=>e.event==='visible_30s'));
b.document.hidden=true;b.advance(200);assert(!b.writes.flat().some(e=>e.event==='visible_120s'));
b.document.hidden=false;b.advance(90);assert(b.writes.flat().some(e=>e.event==='visible_120s'));
b.advance(120);assert.equal(b.writes.flat().filter(e=>e.event==='visible_120s').length,1);
const details=new b.context.Element();details.open=true;
b.emit('toggle',{target:details});b.emit('toggle',{target:details});b.advance(5);
assert.equal(b.writes.flat().filter(e=>e.event==='details_open').length,1);
assert.equal(b.writes.flat().filter(e=>e.event==='explore').length,1);
const before=b.writes.flat().length;b.nodes.at(-1).onclick();b.emit('error',{});b.advance(10);assert.equal(b.writes.flat().length,before);
for(const options of [{host:'localhost'},{dnt:'1'},{gpc:true},{off:true}]){const x=browser(options);x.advance(150);assert.equal(x.writes.length,0);}
assert(b.writes.flat().every(e=>Object.keys(e).sort().join(',')==='area,event,surface'));
console.log('Browser pilot: visible/background time, deduplication, exploration, opt-out, DNT/GPC, localhost and payload minimization pass.');
