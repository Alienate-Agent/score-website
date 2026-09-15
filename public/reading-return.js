/* Per-tab navigation memory only. No network, analytics or cross-tab tracking. */
(() => {
 // Static host pages share the same return-link presentation as app routes.
 if(!document.querySelector('script[src="/site-navigation.js"]')){
  const style=document.createElement('link');style.rel='stylesheet';style.href='/site-navigation.css';document.head.append(style);
  const script=document.createElement('script');script.src='/site-navigation.js';document.head.append(script);
 }
 const key='score-reading-returns-v1', pending='score-reading-resume-v1';
 const ready=()=>document.body.dataset.readingReturnReady==='true';
 const here=()=>location.pathname+location.search+location.hash;
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'[]').filter(x=>x.at>Date.now()-1800000).slice(-8);}catch{return [];}};
 const save=s=>{try{sessionStorage.setItem(key,JSON.stringify(s));}catch{}};
 const samePlace=(a,b)=>{try{const x=new URL(a,location.origin),y=new URL(b,location.origin);return x.pathname.replace(/index.html$/,'')===y.pathname.replace(/index.html$/,'')&&x.search===y.search&&decodeURIComponent(x.hash)===decodeURIComponent(y.hash);}catch{return false;}};
 const matches=x=>{if(!x)return false;if(samePlace(here(),x.to))return true;try{const to=new URL(x.to,location.origin);return location.pathname!=='/'&&location.pathname===to.pathname&&location.search===to.search;}catch{return false;}};
 const clean=s=>(s||'').replace(/\s+/g,' ').trim();
 const short=s=>{const value=clean(s);return value.length>85?value.slice(0,82).replace(/\s+\S*$/,'')+'…':value;};
 function fragmentTarget(hash){const raw=hash.replace(/^#/,'');const literal=document.getElementById(raw);if(literal)return literal;try{return document.getElementById(decodeURIComponent(raw));}catch{return null;}}
 function headingText(el){
  if(!el)return '';
  if(el.dataset.readingLabel)return el.dataset.readingLabel;
  const named=el.getAttribute('aria-labelledby')?.split(/\s+/).map(id=>document.getElementById(id)).find(Boolean);
  const heading=named||(/^(H[1-6]|SUMMARY)$/.test(el.tagName)?el:el.querySelector('h1,h2,h3,summary'));
  if(!heading)return el.getAttribute('aria-label')||'';
  const copy=heading.cloneNode(true);copy.querySelectorAll('time,small,svg,.sr-only,[aria-hidden=true]').forEach(n=>n.remove());
  return short(copy.textContent);
 }
 function destination(address){
  let url,id;try{url=new URL(address,location.origin);id=decodeURIComponent(url.hash.slice(1));}catch{return 'Reading';}
  if(url.pathname.startsWith('/lens'))return 'Sound instrument';
  if(url.pathname.startsWith('/studio/tidemark/'))return ({'study-001.html':'Can a Tidemark jump?','study-002.html':'Does the bridge hold?','town.html':'A town you cannot hold at once','resources.html':'Studio resources'})[url.pathname.split('/').at(-1)]||'Tidemark’s Studio';
  if(url.pathname==='/visual-score')return id.startsWith('chronology-entry-')?'Score · '+id.slice(17):'Visual score';
  const pages={'/featured':'Previously featured','/changelog':'Site changelog','/charter':'Alienate’s public charter','/archive':'Historical archive'};
  if(pages[url.pathname])return pages[url.pathname];
  const names={'':'Entrance','story-title':'Entrance','story-exploration':'Studio','all-record-search':'Search posts and comments','record-discovery-results':'Search results','story-instruments':'Visual score and public records','chronology':'Visual score','connected-score':'Conversations','live-agent-activity':'Live agent activity'};
  if(names[id])return names[id];
  if(id.startsWith('encounter-')){
   const [event,view,act]=id.slice(10).split('~');
   const link=[...document.querySelectorAll('[data-encounter-id]')].find(n=>n.dataset.encounterId===event);
   const voice=[...document.querySelectorAll('[data-reading-act]')].find(n=>n.dataset.readingAct===act)?.dataset.readingLabel;
   return (link?.dataset.readingLabel||'Selected conversation')+' · '+(view==='telling'?'Summary':voice||'Original words');
  }
  const record=id.match(/^public-record-(.+):(post|comment):(\d+)$/);
  if(record)return `${record[1][0].toUpperCase()+record[1].slice(1)} · ${record[2]} ${record[3]}`;
  if(id.startsWith('chronology-entry-'))return 'Score · '+id.slice(17);
  return headingText(fragmentTarget(url.hash))||'Reading';
 }
 let control;
 function resume(e,index){
  const stack=read(),selected=typeof index==='number'?index:stack.length-1,entry=stack[selected];if(!entry)return;
  e.preventDefault();save(stack.slice(0,selected));
  try{sessionStorage.setItem(pending,JSON.stringify(entry));}catch{}
  if(new URL(entry.from,location.origin).pathname===location.pathname){history.pushState(null,'',entry.from);dispatchEvent(new HashChangeEvent('hashchange'));restore();}
  else location.assign(entry.from);
 }
 function restore(){
  if(!ready())return;
  let entry;try{entry=JSON.parse(sessionStorage.getItem(pending)||'null');}catch{}if(!entry||here()!==entry.from)return;
  sessionStorage.removeItem(pending);
  // Allow destination readers to reveal their sections before restoring the link.
  setTimeout(()=>{
   const origin=fragmentTarget(new URL(entry.from,location.origin).hash);
   for(const id of entry.disclosures||[]){const detail=document.getElementById(id);if(detail instanceof HTMLDetailsElement)detail.open=true;}
   for(let node=origin;node;node=node.parentElement)if(node instanceof HTMLDetailsElement)node.open=true;
   const root=entry.label==='Back to search results'?document.getElementById('record-discovery-results'):origin?.closest('section')||document;
   const links=[...(root?.querySelectorAll('a[href]')||[])].filter(a=>a.getAttribute('href')===entry.link);
   const link=links[entry.linkIndex||0];
   // A source link may be inside an unnamed nested disclosure. Reveal it too.
   for(let node=link;node;node=node.parentElement)if(node instanceof HTMLDetailsElement)node.open=true;
   if(link){
    // Font loading, revealed details and the registry can reflow a long story.
    // Keep the source anchored briefly, but stop as soon as the reader acts.
    let stopped=false,frame=0;
    const stop=()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();for(const name of ['wheel','touchstart','pointerdown','keydown'])window.removeEventListener(name,stop);};
    const align=()=>{if(!stopped&&here()===entry.from&&link.getClientRects().length)window.scrollTo({top:Math.max(0,scrollY+link.getBoundingClientRect().top-entry.top),behavior:'instant'});};
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(align);});};
    const observer=new ResizeObserver(schedule);observer.observe(document.body);
    for(const name of ['wheel','touchstart','pointerdown','keydown'])window.addEventListener(name,stop,{passive:true});
    link.focus({preventScroll:true});schedule();
    void document.fonts.ready.then(()=>{if(!stopped)schedule();});
    setTimeout(stop,2500);
   }else window.scrollTo({top:entry.y,behavior:'instant'});
   refresh();
  },450);
 }
 function refresh(){
  if(!ready())return;
  const stack=read(),entry=stack.at(-1);const active=matches(entry);
  const trail=document.getElementById('reading-trail');
  document.documentElement.dataset.readingTrail=String(!!trail&&stack.length>0);
  if(trail){
   const signature=JSON.stringify(stack.map(e=>[e.from,e.to,e.label,destination(e.from)]))+here()+destination(here());
   if(trail.dataset.signature!==signature){trail.dataset.signature=signature;trail.replaceChildren();
    if(stack.length){
     const make=(entry,index)=>{const b=document.createElement('button');b.type='button';const name=destination(entry.from);b.textContent='Back to '+name;b.title=b.textContent;b.setAttribute('aria-label',b.textContent);b.setAttribute('data-return-link','');b.onclick=e=>resume(e,index);return b;};
     const previous=make(entry,stack.length-1);previous.className='trail-previous';trail.append(previous);
     const current=document.createElement('span');current.className='trail-current';current.textContent=' → '+destination(here());current.title=destination(here());current.setAttribute('aria-current','location');trail.append(current);
     if(stack.length>1){const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');summary.textContent='Earlier stops';list.className='trail-earlier';stack.slice(0,-1).forEach((x,i)=>list.append(make(x,i)));details.append(summary,list);trail.append(details);}
    }
   }
  }
  const existing=document.querySelector('#contextual-reading-return > a, main.editorial-history > a:first-child, .studio-host-nav > a[data-studio-back]');
  if(control&&(!active||existing||control.textContent!==entry.label)){control.remove();control=null;}
  if(existing&&!existing.hasAttribute('data-fixed-reading-return')){if(!existing.dataset.originalLabel)existing.dataset.originalLabel=existing.textContent;const label=active?entry.label:existing.dataset.originalLabel;if(existing.textContent!==label)existing.textContent=label;existing.onclick=active?resume:null;}
  if(active&&!existing&&!control&&!trail){
   const slot=document.getElementById('contextual-reading-return');
   control=document.createElement('button');control.type='button';control.textContent=entry.label;control.className='contextual-reading-return'+(slot?'':' contextual-reading-return--floating');control.setAttribute('data-return-link','');control.onclick=resume;
   (slot||document.body).append(control);
  }
 }
 document.addEventListener('click',e=>{
  if(!ready())return;
  const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.download)return;
  if(a.closest('#reading-trail')||a.classList.contains('reading-top-link')||a.hasAttribute('data-fixed-reading-return')||(a.dataset.originalLabel&&matches(read().at(-1))))return;
  const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;
  // Ordinary board links are in-place conversations, not page detours.
  if(url.pathname==='/board'||a.closest('.conversation-reader,.board-reader-wait'))return;
  const search=!!a.closest('#record-discovery-results');
  const page=['/featured','/changelog','/charter','/archive'].includes(url.pathname)||(url.pathname==='/board'&&a.hasAttribute('data-board-conversation'))||url.pathname.startsWith('/studio/tidemark/')&&url.pathname.endsWith('.html');
  const jump=!!url.hash&&!a.closest('.story-spine')&&!a.closest('#connected-score');
  if(!search&&!page&&!jump)return;
  const area=a.closest('section'),origin=a.dataset.storyReturn||area?.getAttribute('aria-labelledby')||area?.id;
  const from=search?location.pathname+location.search+'#record-discovery-results':origin?location.pathname+location.search+'#'+origin:here(),to=url.pathname+url.search+url.hash;if(from===to)return;
  const label=search?'Back to search results':'Back to '+destination(from);
  const disclosures=[];for(let node=a.parentElement;node;node=node.parentElement)if(node instanceof HTMLDetailsElement&&node.open&&node.id)disclosures.push(node.id);
  const root=search?document.getElementById('record-discovery-results'):fragmentTarget(new URL(from,location.origin).hash)?.closest('section')||document;
  const linkIndex=[...(root?.querySelectorAll('a[href]')||[])].filter(link=>link.getAttribute('href')===a.getAttribute('href')).indexOf(a);
  save([...read(),{from,to,label,destination:destination(to),link:a.getAttribute('href'),linkIndex:Math.max(0,linkIndex),disclosures,top:a.getBoundingClientRect().top,y:scrollY,at:Date.now()}]);
  setTimeout(refresh,100);
 });
 addEventListener('hashchange',()=>{refresh();restore();});addEventListener('popstate',refresh);addEventListener('score-reading-arrival',refresh);
 addEventListener('score-reading-ready',()=>{refresh();restore();});
 let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{refresh();restore();},100);}).observe(document.body,{childList:true,subtree:true});
 refresh();restore();
})();
