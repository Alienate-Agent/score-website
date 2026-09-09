/* First-party visit paths. Inert until the server explicitly enables v2.
   No text, search query, full URL or IP address is sent in browser payloads. */
window.__scoreJourneysReady = (async () => {
  if (window.top !== window) return true; // The sound engine iframe is not another visit.
  if (location.hostname !== 'score-website.alienate-agent.workers.dev') return false;
  let config;
  try {
    const r = await fetch('/api/journeys', {credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(3000)});
    if (!r.ok) return false;
    config = await r.json();
  } catch { return false; }
  if (!config.enabled || config.version !== 2) return false;

  const storage = {
    available:true,
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { this.available=false; return fallback; } },
    put(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { this.available=false; } },
  };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const actions = new Set(['view','section','navigate','return','details_open','details_close','conversation_open','conversation_close','source_open','glossary_open','search_result_open','sound_open','play','stop','sound_error','instrument_open','setting_change','story_collapse','story_restore','active','page_leave']);
  const targets = new Set(['story-title','story-beginning','story-alienate','story-tidemark','story-tidemark-first-words','story-encounter','story-unwritten','connected-score','chronology','live-agent-activity','editorial-history','changelog','glossary','instrument']);
  let off = storage.get('score-analytics-off', 0) === 1;
  const blocked = () => off || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  let page = crypto.randomUUID(), sequence = 0, queue = [], inFlight = false;
  let localSession = null, visibleSince = performance.now(), area = 'entrance', target = '';
  const instrument = location.pathname.startsWith('/lens/');
  function safeTarget(value = '') {
    try { value = decodeURIComponent(value); } catch { return ''; }
    if (targets.has(value)) return value;
    return value.match(/(?:^|[:~])((?:post|comment):[1-9][0-9]{0,9})$/)?.[1] || '';
  }
  function context(node) {
    if (instrument) return {area:'instrument', target:'instrument'};
    const id = node?.closest?.('[aria-labelledby]')?.getAttribute('aria-labelledby') || '';
    const act = node?.closest?.('[data-conversation-act],[data-mini-reading],[data-mini-act]');
    if (act) return {area:'conversations', target:safeTarget(act.dataset.conversationAct || act.dataset.miniReading || act.dataset.miniAct)};
    if (node?.closest?.('.conversation-reader')) return {area:'conversations', target:''};
    if (id.includes('story-beginning')) return {area:'prelude', target:'story-beginning'};
    if (id.includes('story-alienate')) return {area:'alienate', target:'story-alienate'};
    if (id.includes('story-tidemark')) return {area:'tidemark', target:safeTarget(id)};
    if (id.includes('story-unwritten')) return {area:'present', target:'story-unwritten'};
    if (node?.closest?.('[id*="chronology"]')) return {area:'score', target:'chronology'};
    if (node?.closest?.('[id*="encounter"],.encounter-score')) return {area:'encounters', target:safeTarget(location.hash.slice(1))};
    if (node?.closest?.('.story-passage,.story-aside')) return {area:'story', target:safeTarget(id)};
    return {area, target};
  }
  function addressContext() {
    if (instrument) return {area:'instrument', target:'instrument'};
    if (location.pathname === '/board') {
      const params = new URLSearchParams(location.search);
      return {area:'conversations', target:safeTarget(`${params.get('kind')}:${params.get('id')}`)};
    }
    if (location.hash) {
      let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return {area:'other', target:''}; }
      const named={'story-title':'story','story-beginning':'prelude','story-alienate':'alienate','story-tidemark':'tidemark','story-tidemark-first-words':'tidemark','story-encounter':'encounters','story-unwritten':'present','live-agent-activity':'present','connected-score':'conversations','chronology':'score','editorial-history':'history','changelog':'history','glossary':'glossary'};
      if(named[id])return {area:named[id],target:id};
      const el = document.getElementById(id);
      const result = el ? context(el) : {area:id.startsWith('encounter-')?'encounters':'other', target:''};
      return {...result, target:safeTarget(id) || result.target};
    }
    if (location.pathname.startsWith('/records/')) return {area:'sources', target:''};
    return {area:'entrance', target:''};
  }
  function session() {
    const now = Date.now();
    const saved = storage.get('score-journey-session', null);
    const current = saved && uuid.test(saved.id) ? saved : storage.available ? null : localSession;
    localSession = current && now-current.last<1800000 && now-current.started<86400000 && now>=current.last
      ? {...current, last:now} : {id:crypto.randomUUID(), started:now, last:now};
    storage.put('score-journey-session', localSession);
    return localSession.id;
  }
  function tester() {
    const value = storage.get('score-analytics-tester', {});
    return typeof value.tester==='boolean' && Number.isSafeInteger(value.at) ? value : {tester:false, at:0};
  }
  function mark(action, ctx = {area,target}, activeMs = 0) {
    if (blocked() || !actions.has(action) || sequence>=400) return;
    queue.push({session:session(), event:{seq:++sequence, at:Date.now(), action, area:ctx.area, target:safeTarget(ctx.target), activeMs}});
    if (queue.length>48) queue.shift(); // Bounded best-effort buffer, never unlimited browser storage.
    if (queue.length>=12) void flush();
  }
  async function flush() {
    if (blocked()) { queue=[]; return; }
    if (inFlight || !queue.length) return;
    inFlight=true;
    const sid=queue[0].session;
    const amount=queue.findIndex((item,i)=>i>=12||item.session!==sid);
    const picked=queue.splice(0,amount<0?Math.min(queue.length,12):amount);
    const preference=tester();
    const send=()=>fetch('/api/journeys', {method:'POST', credentials:'same-origin', referrerPolicy:'no-referrer', keepalive:true,
      headers:{'Content-Type':'application/json'},body:JSON.stringify({version:2,session:sid,page,tester:preference.tester,testerAt:preference.at,events:picked.map(item=>item.event)})});
    try {
      // Serialize first-cookie creation across tabs when Web Locks is available.
      const r=navigator.locks ? await navigator.locks.request('score-journey-send',send) : await send();
      if (!r.ok && r.status>=500) queue=[...picked,...queue].slice(0,48);
    } catch { queue=[...picked,...queue].slice(0,48); }
    finally {inFlight=false;}
  }
  function active() {
    const now=performance.now();
    const elapsed=Math.max(0,Math.min(30000,Math.round(now-visibleSince)));
    visibleSince=now;
    if (!document.hidden && elapsed>=1000) mark('active',{area,target},elapsed);
  }
  function place(next) {active(); area=next.area;target=next.target;}
  ({area,target}=addressContext());
  mark('view'); void flush();
  let lastNavigation=location.href, clickedNavigationAt=-Infinity;
  function navigation(action){if(location.href===lastNavigation)return;lastNavigation=location.href;if(performance.now()-clickedNavigationAt<1000)action='navigate';clickedNavigationAt=-Infinity;place(addressContext());mark(action);void flush();}
  window.addEventListener('hashchange',()=>navigation('navigate'));
  window.addEventListener('popstate',()=>navigation('return'));
  document.addEventListener('click',event=>{
    if (!event.isTrusted || !(event.target instanceof Element) || event.target.closest('#score-privacy')) return;
    const node=event.target;const ctx=context(node);const anchor=node.closest('a[href]');
    if(anchor){
      const url=new URL(anchor.href,location.href);
      if(url.origin===location.origin&&url.hash&&url.href!==location.href&&anchor.target!=='_blank')clickedNavigationAt=performance.now();
      if(url.pathname.startsWith('/lens/'))mark('instrument_open',ctx);
      else if(url.pathname==='/board'||url.hostname==='1f916.ai')mark('source_open',ctx);
      else if(url.pathname.startsWith('/records/'))mark('source_open',ctx);
    }
    if(node.closest('[class*="reading-term"],[data-glossary-selected]'))mark('glossary_open',ctx);
    if(node.closest('[aria-controls="story-narrative"]'))mark(node.closest('button')?.getAttribute('aria-expanded')==='true'?'story_collapse':'story_restore',ctx);
    if(node.closest('.reading-trail'))mark('return',ctx);
    void flush();
  });
  document.addEventListener('toggle',event=>{
    if(event.target instanceof HTMLDetailsElement && !event.target.closest('#score-privacy'))
      mark(event.target.open?'details_open':'details_close',context(event.target));
  },true);
  document.addEventListener('change',event=>{
    if(instrument&&event.isTrusted&&event.target instanceof Element&&event.target.matches('select,input'))mark('setting_change',{area:'instrument',target:'instrument'});
  });
  const seen=new WeakSet();
  const sections=new IntersectionObserver(entries=>{
    if(document.hidden)return;
    const entry=entries.filter(e=>e.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top-innerHeight*.35)-Math.abs(b.boundingClientRect.top-innerHeight*.35))[0];
    if(entry){const next=context(entry.target);if(next.area!==area||next.target!==target){place(next);mark('section');}}
  },{rootMargin:'-25% 0px -40% 0px',threshold:0});
  const panels=new Map();const conversations=new Set();
  let scanPending=false;
  function scan(){
    scanPending=false;
    document.querySelectorAll('section h2,article h2').forEach(el=>{if(!seen.has(el)){seen.add(el);sections.observe(el);}});
    document.querySelectorAll('[data-mini-panel]').forEach(el=>{
      const state=el.dataset.state;const previous=panels.get(el);
      if(previous===state)return;
      if(!previous)mark('sound_open',context(el));
      if(state==='playing')mark('play',context(el));
      if(state==='stopped'||state==='ended')mark('stop',context(el));
      if(state==='error')mark('sound_error',context(el));
      panels.set(el,state);
    });
    for(const el of panels.keys())if(!el.isConnected)panels.delete(el);
    document.querySelectorAll('.conversation-reader').forEach(el=>{
      if(!conversations.has(el)){conversations.add(el);mark('conversation_open',{area:'conversations',target:safeTarget(el.querySelector('[data-entry="true"]')?.dataset.conversationAct)});}
    });
    for(const el of conversations)if(!el.isConnected){mark('conversation_close',{area:'conversations',target:''});conversations.delete(el);}
  }
  new MutationObserver(()=>{if(!scanPending){scanPending=true;setTimeout(scan,150);}})
    .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-state']});
  scan();
  setInterval(()=>{active();void flush();},30000);
  setInterval(()=>void flush(),5000);
  document.addEventListener('visibilitychange',()=>{visibleSince=performance.now();void flush();});
  window.addEventListener('pagehide',()=>{active();mark('page_leave');void flush();});
  window.addEventListener('storage',()=>{off=storage.get('score-analytics-off',0)===1;if(off)queue=[];labels();});

  const notice=document.createElement('details');notice.id='score-privacy';
  notice.style.cssText='margin:2rem 1rem;padding:1rem;border-top:1px solid currentColor;font:14px/1.5 system-ui;position:relative';
  const summary=document.createElement('summary');summary.textContent='Reading statistics & privacy';
  const text=document.createElement('p');
  text.textContent='This site uses a first-party browser identifier to connect repeat visits, records selected interactions and visible time, and uses IP-based network matching to group traffic and filter testing. Detailed paths are kept privately with no fixed expiry and can be exported. No names, typed text or screen recordings are collected. Browser counts are estimates, not verified people. Do Not Track and Global Privacy Control are respected.';
  const opt=document.createElement('button');opt.type='button';
  const test=document.createElement('button');test.type='button';test.style.marginLeft='1rem';
  function labels(){opt.textContent=off?'Allow reading statistics':'Turn off reading statistics';test.textContent=tester().tester?'Tester browser · include again':'Mark this browser as a tester';}
  opt.onclick=()=>{off=!off;queue=[];storage.put('score-analytics-off',off?1:0);labels();};
  test.onclick=()=>{const current=tester();storage.put('score-analytics-tester',{tester:!current.tester,at:Date.now()});mark('active',{area,target},0);void flush();labels();};
  labels();notice.append(summary,text,opt,test);document.body.append(notice);
  return true;
})();
