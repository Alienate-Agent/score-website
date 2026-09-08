/* Per-tab navigation memory only. No network, analytics or cross-tab tracking. */
(() => {
 const key='score-reading-returns-v1', pending='score-reading-resume-v1';
 const here=()=>location.pathname+location.search+location.hash;
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(key)||'[]').filter(x=>x.at>Date.now()-1800000).slice(-8);}catch{return [];}};
 const save=s=>{try{sessionStorage.setItem(key,JSON.stringify(s));}catch{}};
 const matches=x=>x&&(x.to.startsWith('/#')?here()===x.to:location.pathname.replace(/index.html$/,'')===new URL(x.to,location.origin).pathname.replace(/index.html$/,''));
 let control;
 function resume(e,index){
  const stack=read(),selected=typeof index==='number'?index:stack.length-1,entry=stack[selected];if(!entry)return;
  e.preventDefault();save(stack.slice(0,selected));
  try{sessionStorage.setItem(pending,JSON.stringify(entry));}catch{}
  if(new URL(entry.from,location.origin).pathname===location.pathname){history.pushState(null,'',entry.from);dispatchEvent(new HashChangeEvent('hashchange'));restore();}
  else location.assign(entry.from);
 }
 function restore(){
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
  const stack=read(),entry=stack.at(-1);const active=matches(entry);
  const trail=document.getElementById('reading-trail');
  document.documentElement.dataset.readingTrail=String(!!trail&&stack.length>0);
  if(trail){
   const signature=JSON.stringify(stack.map(e=>[e.from,e.to,e.label]))+here();
   if(trail.dataset.signature!==signature){trail.dataset.signature=signature;trail.replaceChildren();
    if(stack.length){
     const make=(entry,index)=>{const b=document.createElement('button');b.type='button';b.textContent=entry.label.replace(/^Back to /,'');b.onclick=e=>resume(e,index);return b;};
     if(stack.length>1){const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('div');summary.textContent='Earlier stops';list.className='trail-earlier';stack.slice(0,-1).forEach((x,i)=>list.append(make(x,i)));details.append(summary,list);trail.append(details);}
     const previous=make(entry,stack.length-1);previous.className='trail-previous';trail.append(previous);
     const current=document.createElement('span');current.className='trail-current';current.textContent=' → '+(active?entry.destination||'Current reading':'Entrance / another view');trail.append(current);
     if(!active){const next=document.createElement('button');next.textContent='Resume';next.onclick=()=>{location.assign(entry.to);};trail.append(next);}
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
  const a=e.target.closest?.('a[href]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||a.download)return;
  if(a.closest('#reading-trail')||a.classList.contains('reading-top-link')||(a.dataset.originalLabel&&matches(read().at(-1))))return;
  const url=new URL(a.href,location.href);if(url.origin!==location.origin)return;
  const search=!!a.closest('#record-discovery-results');
  const page=['/featured','/changelog','/charter'].includes(url.pathname);
  const jump=!!url.hash&&!a.closest('.story-spine')&&!a.closest('#connected-score');
  if(!search&&!page&&!jump)return;
  const area=a.closest('section'),origin=a.dataset.storyReturn||area?.getAttribute('aria-labelledby')||area?.id;
  const from=search?location.pathname+location.search+'#record-discovery-results':origin?location.pathname+location.search+'#'+origin:here(),to=url.pathname+url.search+url.hash;if(from===to)return;
  const heading=origin&&document.getElementById(origin)?.textContent?.trim();
  const label=search?'Back to search results':location.pathname==='/changelog'?'Back to the changelog':location.pathname==='/featured'?'Back to previously featured':heading?'Back to '+heading.slice(0,55):'Back to the story';
  save([...read(),{from,to,label,destination:a.textContent.trim().slice(0,55),link:a.getAttribute('href'),top:a.getBoundingClientRect().top,y:scrollY,at:Date.now()}]);
  setTimeout(refresh,100);
 },true);
 addEventListener('hashchange',()=>{refresh();restore();});addEventListener('popstate',refresh);
 let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{refresh();restore();},100);}).observe(document.body,{childList:true,subtree:true});
 refresh();restore();
})();
