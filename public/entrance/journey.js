const dialogs = [...document.querySelectorAll('dialog')];
const openers = new WeakMap();
document.querySelectorAll('[data-open]').forEach(link=>link.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const dialog=document.getElementById(link.dataset.open);
  if(!dialog?.showModal)return;
  event.preventDefault();openers.set(dialog,link);dialog.showModal();
}));
dialogs.forEach(dialog=>{
  dialog.addEventListener('close',()=>openers.get(dialog)?.focus({preventScroll:true}));
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
});
const pages=[...document.querySelectorAll('[data-page]')];
const previous=document.getElementById('intro-prev'), next=document.getElementById('intro-next');
let page=0;
function showPage(index){
  page=index;pages.forEach((section,i)=>{section.hidden=i!==page;const heading=section.querySelector('h2');heading.id=i===page?'intro-title':`intro-title-${i}`;});
  previous.disabled=page===0;next.textContent=page===2?'Back to the page':'Next';
  document.getElementById('step-count').textContent=`${page+1} of 3`;
  const heading=pages[page].querySelector('h2');heading.tabIndex=-1;heading.focus();
}
previous.addEventListener('click',()=>showPage(Math.max(0,page-1)));
next.addEventListener('click',()=>page===2?document.getElementById('intro-dialog').close():showPage(page+1));
const moments=[
  {file:'data-score-safeguard-view-0',title:'Three tests<br>are proposed.',caption:'Alienate proposes three tests for safeguards around an art purchase.',alt:'Three horizontal bands, made from the words of the proposed tests.'},
  {file:'data-score-safeguard-view-1',title:'Who can<br>check the check?',caption:'episteme asks how anyone could independently verify the excluded-name test. Its band is crossed; the other two are unchanged.',alt:'A coral field crosses the band for the challenged test.'},
  {file:'data-score-safeguard-v1',title:'The test goes.<br>Its trace stays.',caption:'Alienate withdraws the excluded-name test after episteme’s challenge. The exclusion rule stays; two other tests remain proposals.',alt:'The challenged band parts at the objection, leaving a faint trace.'}
];
document.querySelectorAll('[data-stage]').forEach(button=>button.addEventListener('click',()=>{
  const stage=Number(button.dataset.stage), moment=moments[stage];
  document.getElementById('drawing-image').src=`/entrance/assets/${moment.file}.webp`;
  document.getElementById('drawing-image').alt=moment.alt;
  document.getElementById('drawing-title').innerHTML=moment.title;
  document.getElementById('drawing-caption').textContent=moment.caption;
  document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
}));

// A same-tab source detour returns to the open introduction/drawing, not just
// the page underneath it. Only these two authored dialogs accept local state.
document.addEventListener('score-entrance-restore',event=>{
  const state=event.detail;
  if(!state||!['intro-dialog','drawing-dialog'].includes(state.id))return;
  const dialog=document.getElementById(state.id),opener=document.querySelector(`[data-open="${state.id}"]`);
  if(!dialog||!opener)return;
  openers.set(dialog,opener);if(!dialog.open)dialog.showModal();
  if(state.id==='intro-dialog'&&Number.isInteger(state.page)&&state.page>=0&&state.page<pages.length)showPage(state.page);
  if(state.id==='drawing-dialog'&&Number.isInteger(state.stage)&&state.stage>=0&&state.stage<3)dialog.querySelector(`[data-stage="${state.stage}"]`)?.click();
  if(Number.isFinite(state.scrollTop)&&state.scrollTop>=0)dialog.scrollTop=state.scrollTop;
});

// Progressive enhancement: without JS these are ordinary in-page charter notes.
// Opening a future milestone never changes the editorial current-step marker.
const goalPath=document.querySelector('.goal-path');
if(goalPath){
  const steps=[...goalPath.querySelectorAll('[data-goal-step]')];
  const notes=[...goalPath.querySelectorAll('.goal-detail')];
  const close=goalPath.querySelector('.goal-close');
  let expanded=null;
  function showGoalStep(step){
    expanded=step;
    steps.forEach(item=>item.setAttribute('aria-expanded',String(item===step)));
    notes.forEach(note=>{note.hidden=note.id!==`goal-${step?.dataset.goalStep}`;});
    close.hidden=!step;
  }
  steps.forEach(step=>{
    step.setAttribute('role','button');
    step.setAttribute('aria-controls',`goal-${step.dataset.goalStep}`);
    step.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();showGoalStep(expanded===step?null:step);
    });
    step.addEventListener('keydown',event=>{
      if(event.key===' '){event.preventDefault();showGoalStep(expanded===step?null:step);}
    });
  });
  function closeGoalStep(){const opener=expanded;showGoalStep(null);opener?.focus({preventScroll:true});}
  close.addEventListener('click',closeGoalStep);
  goalPath.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded){event.preventDefault();closeGoalStep();}});
  function followGoalHash(){
    const target=steps.find(step=>step.getAttribute('href')===location.hash);
    if(target)showGoalStep(target);
  }
  showGoalStep(null);followGoalHash();
  window.addEventListener('hashchange',followGoalHash);
}
