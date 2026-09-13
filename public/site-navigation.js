/* Presentation only: no navigation changes, storage, credentials or network calls. */
(() => {
 const isReturn=label=>/^(?:[←↑↩]\s*)?(?:back(?:\s+to\b|$)|return\s+to\b)/i.test((label||'').trim());
 const excluded='.site-masthead,.reading-top-link,.charter-home,.instrument-site-header,.board-speech__formatted,.public-words,blockquote,pre,code';
 function mark(){
  document.querySelectorAll('a,button').forEach(el=>{
   const match=!el.closest(excluded)&&[el.textContent,el.getAttribute('aria-label'),el.getAttribute('title')].some(isReturn);
   if(match&&!el.hasAttribute('data-return-link'))el.setAttribute('data-return-link','');
   else if(!match&&el.hasAttribute('data-return-link'))el.removeAttribute('data-return-link');
  });
 }
 let queued=false;
 const refresh=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mark();});};
 new MutationObserver(refresh).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title']});
 mark();
})();
