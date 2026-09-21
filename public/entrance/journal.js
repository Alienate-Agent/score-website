const filters=document.querySelector('.journal-filters');
if(filters){
 const buttons=[...filters.querySelectorAll('button')],cards=[...document.querySelectorAll('.journal-card')];
 const valid=new Set(buttons.map(button=>button.dataset.filter));
 function show(filter){
  if(!valid.has(filter))filter='all';
  buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
  cards.forEach(card=>{card.hidden=filter!=='all'&&!card.dataset.topics.split(' ').includes(filter);});
  document.querySelector('#filter-count').textContent=`${cards.filter(card=>!card.hidden).length} entries shown`;
 }
 filters.hidden=false;
 filters.addEventListener('click',event=>{
  const button=event.target.closest('button[data-filter]');if(!button)return;
  const filter=button.dataset.filter;show(filter);
  history.pushState({},'',filter==='all'?'journal.html':`journal.html#${filter}`);
 });
 addEventListener('popstate',()=>show(location.hash.slice(1)));
 addEventListener('hashchange',()=>show(location.hash.slice(1)));
 show(location.hash.slice(1));
}
