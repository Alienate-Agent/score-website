// Collector event tests in a Node VM with DOM-shaped fixtures. No browser,
// production requests, cookies or visitor records are created.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validJourneyBatch} from '../lib/journeys.mjs';
const script=readFileSync(new URL('../public/journeys.js',import.meta.url),'utf8');
async function fixture(href,privacy={}) {
  const sent=[],listeners={},intervals=[],store=new Map();let time=0,observer;
  class Element {
    constructor(id='',parentElement=null,attrs={}){Object.assign(this,{id,parentElement,attrs,dataset:{},style:{},children:[],isConnected:true});}
    getAttribute(k){return this.attrs[k]||null;}
    hasAttribute(k){return Object.hasOwn(this.attrs,k);}
    append(...items){this.children.push(...items);}
    matches(){return false;}
    closest(selector){if(selector==='a[href]'&&this.href)return this;if(selector==='#score-privacy'&&this.id==='score-privacy')return this;return this.parentElement?.closest(selector)||null;}
  }
  class Details extends Element {}
  class Dialog extends Element {}
  const document={hidden:false,body:new Element(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>new Element(),getElementById:()=>null,addEventListener:(key,fn)=>listeners['document:'+key]=fn};
  const window={addEventListener:(key,fn)=>listeners['window:'+key]=fn};window.top=window;
  const ctx=vm.createContext({window,document,location:new URL(href),navigator:privacy,crypto,URL,URLSearchParams,AbortSignal,
    Element,HTMLDetailsElement:Details,HTMLDialogElement:Dialog,innerHeight:900,
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
    performance:{now:()=>time},setTimeout:fn=>fn(),setInterval:(fn,ms)=>intervals.push({fn,ms}),
    IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}},MutationObserver:class{observe(){}},
    fetch:async(_url,options)=>{if(options?.method==='POST'){sent.push(JSON.parse(options.body));return {ok:true};}return {ok:true,json:async()=>({enabled:true,version:2})};},
  });
  const history={pushState(_state,_title,url){assert.equal(this,history);ctx.location=new URL(url,ctx.location);return 'native-result';},replaceState(_state,_title,url){assert.equal(this,history);ctx.location=new URL(url,ctx.location);}};
  window.history=history;
  await new vm.Script(script,{importModuleDynamically:()=>import('../public/journey-map.mjs')}).runInContext(ctx);
  await window.__scoreJourneysReady;
  const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  return {ctx,sent,Element,Details,listeners,async emit(key,event){listeners[key]?.(event);intervals.find(i=>i.ms===5000)?.fn();await settle();},
    async tick(){time+=30000;intervals.find(i=>i.ms===30000)?.fn();await settle();},
    async intersect(el){observer([{isIntersecting:true,boundingClientRect:{top:300},target:el}]);await this.emit('noop');}};
}
const f=await fixture('https://score-website.alienate-agent.workers.dev/#story-beginning');
const events=()=>f.sent.flatMap(b=>b.events);
assert.equal(events()[0].target,'story-beginning');
f.ctx.location.hash='#all-record-search';await f.emit('window:hashchange');
assert(events().some(e=>e.action==='navigate'&&e.target==='all-record-search'));
assert.equal(f.ctx.window.history.pushState(null,'','#chronology-entry-E09'),'native-result');await f.emit('noop');
assert(events().some(e=>e.action==='navigate'&&e.target==='chronology-entry-E09'));
const beforeRepeat=events().length;await f.emit('window:hashchange');assert.equal(events().length,beforeRepeat);
f.ctx.window.history.replaceState(null,'','#record-discovery-results');await f.emit('noop');
assert.equal(events().at(-1).target,'record-discovery-results');
const beforeQuery=events().length;f.ctx.window.history.replaceState(null,'','?q=do-not-collect#record-discovery-results');await f.emit('noop');assert.equal(events().length,beforeQuery);
assert.throws(()=>f.ctx.window.history.pushState(null,'','http://['),TypeError);
await f.intersect(new f.Element('resources'));
await f.tick();assert(events().some(e=>e.action==='active'&&e.area==='resources'&&e.activeMs===30000));
const details=new f.Details('major-progress-updates');details.open=true;
await f.emit('document:toggle',{target:details});
assert(events().some(e=>e.action==='details_open'&&e.target==='major-progress-updates'));
const anchor=new f.Element();anchor.href='https://score-website.alienate-agent.workers.dev/charter#charter-movement-one';anchor.target='';
await f.emit('document:click',{isTrusted:true,target:anchor});
assert(events().some(e=>e.action==='link_open'&&e.target==='charter-movement-one'));
anchor.href='https://score-website.alienate-agent.workers.dev/agent-words?agent=someone-private&message=do-not-collect';
await f.emit('document:click',{isTrusted:true,target:anchor});
assert(events().some(e=>e.target==='citizen-reader'));
assert(!JSON.stringify(f.sent).includes('someone-private'));assert(!JSON.stringify(f.sent).includes('do-not-collect'));
assert(f.sent.every(b=>validJourneyBatch(b)));
for(const privacy of [{doNotTrack:'1'},{globalPrivacyControl:true}]){const privateFixture=await fixture('https://score-website.alienate-agent.workers.dev/',privacy);await privateFixture.tick();assert.equal(privateFixture.sent.length,0);}
const local=await fixture('http://127.0.0.1:3032/');assert.equal(local.sent.length,0);
console.log('PASS collector fixtures: arrival, hash jump, scrolling, section time, exact fold, cross-page charter/citizen links, no queries/text, privacy signals and inert localhost.');
