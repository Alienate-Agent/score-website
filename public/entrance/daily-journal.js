const openHash=()=>{const el=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(el?.matches('details'))el.open=true;};
openHash();addEventListener('hashchange',openHash);
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
 const img=document.getElementById('daily-drawing');img.src=button.dataset.image;img.alt=button.dataset.alt;
 document.querySelectorAll('[data-image]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 const cards=[...document.querySelectorAll('[data-topic]')];let shown=0;
 cards.forEach(card=>{card.hidden=button.dataset.filter!=='All'&&card.dataset.topic!==button.dataset.filter;card.classList.toggle('feature',!card.hidden&&shown++===0);});
 document.getElementById('journal-count').textContent=shown+' updates shown';
}));
document.querySelector('[data-copy-link]')?.addEventListener('click',async e=>{
 const status=document.querySelector('.copy-status');
 const url=e.currentTarget.dataset.copyLink;
 try{await navigator.clipboard.writeText(url);status.textContent='Link copied.';}
 catch{status.textContent=url;}
});
