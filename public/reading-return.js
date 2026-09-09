/* Per-tab navigation memory only. No network, analytics or cross-tab tracking. */
(() => {
 const key='score-reading-returns-v1', pending='score-reading-resume-v1';
 const ready=()=>document.body.dataset.readingReturnReady==='true';
 const here=()=>location.pathname+location.search+location.hash;
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'[]').filter(x=>x.at>Date.now()-1800000).slice(-8);}catch{return [];}};
 const save=s=>{try{sessionStorage.setItem(key,JSON.stringify(s));}catch{}};
 const samePlace=(a,b)=>{try{const x=new URL(a,location.origin),y=new URL(b,location.origin);return x.pathname.replace(/index.html$/,'')===y.pathname.replace(/index.html$/,'')&&x.search===y.search&&decodeURIComponent(x.hash)===decodeURIComponent(y.hash);}catch{return false;}};
 const matches=x=>x&&samePlace(here(),x.to);
 const clean=s=>(s||'').replace(/\s+/g,' ').trim();
 const short=s=>{const value=clean(s);return value.length>85?value.slice(0,82).replace(/\s+\S*$/,'')+'…':value;};
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
  const pages={'/featured':'Previously featured','/changelog':'Site changelog','/charter':'Alienate’s public charter'};
  if(pages[url.pathname])return pages[url.pathname];
  const names={'':'Entrance','story-title':'Entrance','story-exploration':'Explore beyond the story','all-record-search':'Find public words','record-discovery-results':'Search results','story-instruments':'Score and public records','chronology':'Visual score','connected-score':'Selected encounters','live-agent-activity':'Live agent activity'};
  if(names[id])return names[id];
  if(id.startsWith('encounter-')){
   const [event,view,act]=id.slice(10).split('~');
   const link=[...document.querySelectorAll('[data-encounter-id]')].find(n=>n.dataset.encounterId===event);
   const voice=[...document.querySelectorAll('[data-reading-act]')].find(n=>n.dataset.readingAct===act)?.dataset.readingLabel;
   return (link?.dataset.readingLabel||'Selected encounter')+' · '+(view==='telling'?'site account':voice||'public words');
  }
  const record=id.match(/^public-record-(.+):(post|comment):(\d+)$/);
  if(record)return `${record[1][0].toUpperCase()+record[1].slice(1)} · ${record[2]} ${record[3]}`;
  if(id.startsWith('chronology-entry-'))return 'Score · '+id.slice(17);
  return headingText(document.getElementById(id))||'Reading';
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
   const root=entry.label==='Back to search results'?document.getElementById('record-discovery-results'):document;
   const link=[...(root?.querySelectorAll('a[href]')||[])].find(a=>a.getAttribute('href')===entry.link&&a.getClientRects().length);
   if(link&&link.getClientRects().length){link.focus({preventScroll:true});window.scrollTo({top:Math.max(0,scrollY+link.getBoundingClientRect().top-entry.top),behavior:'instant'});}
   else window.scrollTo({top:entry.y,behavior:'instant'});
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
     const make=(entry,index)=>{const b=document.createElement('button');b.type='button';const name=destination(entry.from);b.textContent=name;b.title='Back to '+name;b.setAttribute('aria-label','Back to '+name);b.onclick=e=>resume(e,index);return b;};
     if(stack.length>1){const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');summary.textContent='Earlier stops';list.className='trail-earlier';stack.slice(0,-1).forEach((x,i)=>list.append(make(x,i)));details.append(summary,list);trail.append(details);}
     const previous=make(entry,stack.length-1);previous.className='trail-previous';trail.append(previous);
     const current=document.createElement('span');current.className='trail-current';current.textContent=' → '+destination(here());current.title=destination(here());current.setAttribute('aria-current','location');trail.append(current);
     if(!active){const next=document.createElement('button');next.className='trail-resume';next.textContent='Resume';next.title='Resume '+destination(entry.to);next.setAttribute('aria-label',next.title);next.onclick=()=>{location.assign(entry.to);};trail.append(next);}
    }
   }
  }
  const existing=document.querySelector('main.editorial-history > a:first-child, .charter-reader > nav a:first-child');
  if(control&&(!active||existing||control.textContent!==entry.label)){control.remove();control=null;}
  if(existing){if(!existing.dataset.originalLabel)existing.dataset.originalLabel=existing.textContent;const label=active?entry.label:existing.dataset.originalLabel;if(existing.textContent!==label)existing.textContent=label;existing.onclick=active?resume:null;}
  if(active&&!existing&&!control&&!trail){
   control=document.createElement('button');control.type='button';control.textContent=entry.label;control.className='contextual-reading-return';control.onclick=resume;
   Object.assign(control.style,{position:'fixed',bottom:'1rem',left:'1rem',zIndex:'48',background:'#000',color:'#fff',border:'1px solid #fff',padding:'.75rem 1rem',font:'600 14px Arial',cursor:'pointer',maxWidth:'calc(100vw - 2rem)'});
   document.body.append(control);
  }
 }
 document.addEventListener('click',e=>{
  if(!ready())return;
  const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.download)return;
  if(a.closest('#reading-trail')||a.classList.contains('reading-top-link')||(a.dataset.originalLabel&&matches(read().at(-1))))return;
  const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;
  const search=!!a.closest('#record-discovery-results');
  const page=['/featured','/changelog','/charter'].includes(url.pathname);
  const jump=!!url.hash&&!a.closest('.story-spine')&&!a.closest('#connected-score');
  if(!search&&!page&&!jump)return;
  const area=a.closest('section'),origin=a.dataset.storyReturn||area?.getAttribute('aria-labelledby')||area?.id;
  const from=search?location.pathname+location.search+'#record-discovery-results':origin?location.pathname+location.search+'#'+origin:here(),to=url.pathname+url.search+url.hash;if(from===to)return;
  const label=search?'Back to search results':'Back to '+destination(from);
  save([...read(),{from,to,label,destination:destination(to),link:a.getAttribute('href'),top:a.getBoundingClientRect().top,y:scrollY,at:Date.now()}]);
  setTimeout(refresh,100);
 },true);
 addEventListener('hashchange',()=>{refresh();restore();});addEventListener('popstate',refresh);addEventListener('score-reading-arrival',refresh);
 addEventListener('score-reading-ready',()=>{refresh();restore();});
 let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{refresh();restore();},100);}).observe(document.body,{childList:true,subtree:true});
 refresh();restore();
})();
