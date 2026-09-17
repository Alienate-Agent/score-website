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
  let map;
  try { map=await import('/journey-map.mjs'); } catch { return false; }

  const storage = {
    available:true,
    get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { this.available=false; return fallback; } },
    put(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { this.available=false; } },
  };
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const actions = new Set(['view','section','navigate','return','details_open','details_close','conversation_open','conversation_close','source_open','glossary_open','search_result_open','sound_open','play','stop','sound_error','instrument_open','setting_change','story_collapse','story_restore','active','page_leave']);
  const townActions=new Set(['town_step','town_reset','town_switch','town_example','town_run','town_export']);
  const townTargets=new Set(map.TOWN_TARGETS);
  for(const action of townActions)actions.add(action);
  actions.add('link_open');actions.add('contents_open');
  const studioTarget = map.addressContext(new URL(location.href)).area==='studio';
  let off = storage.get('score-analytics-off', 0) === 1;
  const blocked = () => off || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const page = crypto.randomUUID();
  let sequence = 0, queue = [], inFlight = false;
  let localSession = null, visibleSince = performance.now(), area = 'entrance', target = '';
  const instrument = location.pathname.startsWith('/lens/');
  const safeTarget=map.safeTarget;
  function context(node) {
    return map.nodeContext(node,new URL(location.href));
  }
  function addressContext() {
    const url=new URL(location.href);
    const result=map.addressContext(url);
    if(url.hash&&!safeTarget(url.hash.slice(1))){
      let id;try{id=decodeURIComponent(url.hash.slice(1));}catch{return result;}
      const el=document.getElementById(id);if(el)return context(el);
    }
    return result;
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
  const townFrame=document.querySelector('iframe[data-town-hosted]');
  function townPreference(){townFrame?.contentWindow?.postMessage({type:'score-town-tracking',enabled:!blocked()&&!tester().tester},'*');}
  if(townFrame){
    townFrame.addEventListener('load',townPreference);townPreference();
    window.addEventListener('message',event=>{
      if(event.source!==townFrame.contentWindow||event.origin!=='null'||blocked()||tester().tester)return;
      const d=event.data;
      if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).sort().join(',')!=='action,target,type'||d.type!=='score-town-v1'||!townActions.has(d.action))return;
      if(d.action==='town_step'?!townTargets.has(d.target):d.target!=='studio-town')return;
      mark(d.action,{area:'studio',target:d.target});void flush();
    });
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
  function navigation(action){
    if(location.href===lastNavigation)return;
    const previous=map.addressContext(new URL(lastNavigation));
    lastNavigation=location.href;
    const next=addressContext();
    // Search/filter queries are not destinations and are never collected.
    if(next.area===previous.area&&next.target===previous.target)return;
    if(performance.now()-clickedNavigationAt<1000)action='navigate';
    clickedNavigationAt=-Infinity;place(next);mark(action);void flush();
  }
  window.addEventListener('hashchange',()=>navigation('navigate'));
  window.addEventListener('popstate',()=>navigation('return'));
  // pushState/replaceState do not emit hashchange. Preserve native behavior and
  // observe the resulting safe destination (score selections and search jumps).
  for(const method of ['pushState','replaceState']){
    const original=window.history[method];
    window.history[method]=function(...args){
      const result=original.apply(this,args);
      setTimeout(()=>navigation('navigate'),0);
      return result;
    };
  }
  document.addEventListener('click',event=>{
    if (!event.isTrusted || !(event.target instanceof Element) || event.target.closest('#score-privacy')) return;
    const node=event.target;const ctx=context(node);const anchor=node.closest('a[href]');
    if(anchor){
      const url=new URL(anchor.href,location.href);
      if(url.origin===location.origin&&url.hash&&url.href!==location.href&&anchor.target!=='_blank')clickedNavigationAt=performance.now();
      if(url.origin===location.origin&&(url.pathname!==location.pathname||url.search!==location.search||anchor.target==='_blank'||anchor.hasAttribute('download'))){
        // Destination, not the source section. Never send the URL or its query.
        mark('link_open',map.addressContext(url));
      }else if(url.hostname==='1f916.ai'){
        const record=url.pathname.match(/^\/api\/(post|comment)\/([1-9][0-9]{0,9})\/?$/);
        mark('link_open',record?map.targetContext(`${record[1]}:${record[2]}`):{area:'conversations',target:'board-reader'});
      }
    }
    if(node.closest('[aria-controls="story-narrative"]'))mark(node.closest('button')?.getAttribute('aria-expanded')==='true'?'story_collapse':'story_restore',ctx);
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
  const panels=new Map();const conversations=new Map();
  const dialogs=new Map();
  let scanPending=false;
  function scan(){
    scanPending=false;
    document.querySelectorAll('main h1,section h2,article h2,section h3[id],details[id] > summary').forEach(el=>{if(!seen.has(el)){seen.add(el);sections.observe(el);}});
    document.querySelectorAll('dialog[aria-labelledby],.reading-glossary[role="dialog"]').forEach(el=>{
      const open=el instanceof HTMLDialogElement?el.open:el.getClientRects().length>0,id=el.getAttribute('aria-labelledby')||'';
      if(open&&!dialogs.get(el)){
        if(id==='contents-title')mark('contents_open',{area,target});
        else if(el.matches('.reading-glossary'))mark('glossary_open',{area:'glossary',target:'glossary'});
      }
      dialogs.set(el,open);
    });
    for(const el of dialogs.keys())if(!el.isConnected)dialogs.delete(el);
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
      if(!conversations.has(el)){const ctx={area:'conversations',target:safeTarget(el.querySelector('[data-entry="true"]')?.dataset.conversationAct)};conversations.set(el,ctx);mark('conversation_open',ctx);}
    });
    for(const [el,ctx] of conversations)if(!el.isConnected){mark('conversation_close',ctx);conversations.delete(el);}
  }
  new MutationObserver(()=>{if(!scanPending){scanPending=true;setTimeout(scan,150);}})
    .observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-state','open']});
  scan();
  setInterval(()=>{active();void flush();},30000);
  setInterval(()=>void flush(),5000);
  document.addEventListener('visibilitychange',()=>{visibleSince=performance.now();void flush();});
  window.addEventListener('pagehide',()=>{active();mark('page_leave');void flush();});
  window.addEventListener('storage',()=>{off=storage.get('score-analytics-off',0)===1;if(off)queue=[];labels();});

  const notice=document.createElement('details');notice.id='score-privacy';
  if(!studioTarget)notice.style.cssText='margin:2rem 1rem;padding:1rem;border-top:1px solid currentColor;font:14px/1.5 system-ui;position:relative';
  const summary=document.createElement('summary');summary.textContent='Reading statistics & privacy';
  const text=document.createElement('p');
  text.textContent='This site uses a first-party browser identifier to connect repeat visits, records selected interactions and visible time, and uses IP-based network matching to group traffic and filter testing. Detailed paths are kept privately with no fixed expiry and can be exported. No names, typed text or screen recordings are collected. Browser counts are estimates, not verified people. Do Not Track and Global Privacy Control are respected.';
  const opt=document.createElement('button');opt.type='button';
  const test=document.createElement('button');test.type='button';if(!studioTarget)test.style.marginLeft='1rem';
  function labels(){opt.textContent=off?'Allow reading statistics':'Turn off reading statistics';test.textContent=tester().tester?'Tester browser · include again':'Mark this browser as a tester';townPreference();}
  opt.onclick=()=>{off=!off;queue=[];storage.put('score-analytics-off',off?1:0);labels();};
  test.onclick=()=>{const current=tester();storage.put('score-analytics-tester',{tester:!current.tester,at:Date.now()});mark('active',{area,target},0);void flush();labels();};
  labels();notice.append(summary,text,opt,test);document.body.append(notice);
  return true;
})();
