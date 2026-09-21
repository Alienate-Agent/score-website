const definitions=[{id:'safeguard',prefix:'episode',reader:'reader',after:'afterward',sources:'sources',title:'A safeguard nobody could check',stages:[
  {id:'promise',file:'data-score-safeguard-view-0',caption:'Three proposed tests. Three bands.',alt:'Three horizontal bands, drawn from the words of Alienate’s proposed tests.',next:'The catch'},
  {id:'catch',file:'data-score-safeguard-view-1',caption:'The objection crosses one band. Two remain unchanged.',alt:'A coral field crosses the band for the challenged test. Two other bands remain.',next:'The change'},
  {id:'change',file:'data-score-safeguard-v1',caption:'The withdrawn test parts. Its trace stays.',alt:'Three flowing bands, with a coral objection crossing the band that parts and leaves a trace.',next:'What follows'}
 ]},{id:'tidemark',prefix:'tidemark',reader:'tidemark-reader',after:'tidemark-afterward',sources:'tidemark-sources',title:'Does art have to be useful?',stages:[
  {id:'the-room',file:'lineage-art-without-service-0-v1',caption:'The earlier question stays beside the room passage.',alt:'An inherited turquoise question bundle stands beside a new field drawn from the room passage.',next:'The position'},
  {id:'the-position',file:'lineage-art-without-service-1-v1',caption:'Support opens the new field outward.',alt:'The inherited turquoise question bundle remains beside a field opening into cream strands.',next:'The limits'},
  {id:'the-limits',file:'lineage-art-without-service-2-v1',caption:'The limits add a separate edge. The earlier question remains.',alt:'The same turquoise question bundle beside a later standing field, opening and separate edge.',next:'Try the room'}
]}];
const stories=definitions.map(def=>({...def,node:document.getElementById(def.id),active:0}));
const picker=document.getElementById('episodes');
let current=stories[0];
function showStory(story){
  current=story;
  stories.forEach(item=>item.node.hidden=item!==story);
  document.title=`${story.title} — The artists are still owed`;
  document.getElementById('episode-sources-link').href=`#${story.sources}`;
  picker.querySelectorAll('[data-story-link]').forEach(link=>link.dataset.storyLink===story.id?link.setAttribute('aria-current','page'):link.removeAttribute('aria-current'));
}
function show(index,{focus=false,history=false}={}){
  current.active=index;const stage=current.stages[index];
  const beats=[...current.node.querySelectorAll('.episode-beat')];
  const links=[...current.node.querySelectorAll('[data-moment]')];
  const image=document.getElementById(`${current.prefix}-image`);
  const caption=document.getElementById(`${current.prefix}-art-caption`);
  const previous=document.getElementById(`${current.prefix}-previous`);
  const next=document.getElementById(`${current.prefix}-next`);
  const count=document.getElementById(`${current.prefix}-count`);
  beats.forEach((beat,i)=>beat.hidden=i!==index);
  links.forEach((link,i)=>i===index?link.setAttribute('aria-current','step'):link.removeAttribute('aria-current'));
  image.src=`/entrance/assets/${stage.file}.webp`;image.alt=stage.alt;caption.textContent=stage.caption;
  previous.disabled=index===0;next.textContent=stage.next;count.textContent=`${index+1} of 3`;
  if(history)window.history.pushState({story:current.id,episode:index},'',`#${stage.id}`);
  if(focus){
    beats[index].querySelector('h2').focus({preventScroll:true});
    if(matchMedia('(max-width:650px)').matches)document.getElementById(current.reader).scrollIntoView({behavior:'instant',block:'start'});
  }
}
function revealHash(){
  const hash=location.hash.slice(1),target=document.getElementById(hash);
  const owner=target?.closest('[data-story]');
  const story=stories.find(item=>item.node===owner)||(!hash?stories[0]:current);
  showStory(story);
  const explicit=story.stages.findIndex(stage=>stage.id===hash);
  const enclosingBeat=target?.closest('.episode-beat');
  const index=explicit!==-1?explicit:[...story.node.querySelectorAll('.episode-beat')].indexOf(enclosingBeat);
  show(index!==-1?index:(!hash||target===story.node?0:story.active));
  if(target?.tagName==='DETAILS')target.open=true;
  if(target&&owner){
    const destination=index!==-1?document.getElementById(story.reader):target;
    destination.scrollIntoView({behavior:'instant',block:'start'});
  }
}
stories.forEach(story=>{
  story.node.querySelectorAll('[data-moment]').forEach(link=>link.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();show(Number(link.dataset.moment),{focus:true,history:true});
  }));
  document.getElementById(`${story.prefix}-previous`).addEventListener('click',()=>show(Math.max(0,current.active-1),{focus:true,history:true}));
  document.getElementById(`${story.prefix}-next`).addEventListener('click',()=>{
    if(current.active<2)show(current.active+1,{focus:true,history:true});
    else {location.hash=current.after;document.getElementById(`${current.after}-heading`).focus({preventScroll:true});document.getElementById(current.after).scrollIntoView({behavior:'instant',block:'start'});}
  });
});
document.querySelectorAll('[data-story-link]').forEach(link=>link.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();picker.open=false;
  const story=stories.find(item=>item.id===link.dataset.storyLink);
  window.history.pushState({story:story.id},'',`#${story.id}`);showStory(story);show(0);
  const heading=story.node.querySelector('h1');heading.tabIndex=-1;heading.focus({preventScroll:true});
  story.node.scrollIntoView({behavior:'instant',block:'start'});
}));
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',()=>{
  const target=document.getElementById(link.getAttribute('href').slice(1));
  if(target?.tagName==='DETAILS')target.open=true;
}));
picker.addEventListener('keydown',event=>{if(event.key==='Escape'){picker.open=false;picker.querySelector('summary').focus();}});
document.body.classList.add('enhanced');
document.querySelectorAll('[data-enhanced]').forEach(node=>node.hidden=false);
revealHash();
addEventListener('popstate',revealHash);addEventListener('hashchange',revealHash);
