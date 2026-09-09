'use client';
import {useEffect,useState,useRef} from 'react';
import {ChevronUp,ChevronDown} from 'lucide-react';
import {StoryTitleMark} from './story-title-mark';
import './reading-navigation.css';
export function ReadingNavigation(){
 const [collapsed,setCollapsed]=useState(false),[section,setSection]=useState('');
 const [entry,setEntry]=useState<{id:string;text:string}|null>(null);
 const bar=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const initialFrame=requestAnimationFrame(()=>{try{setCollapsed(sessionStorage.getItem('score-story-collapsed')==='true');}catch{}reveal();});
  let frame=0;
  const update=()=>{frame=0;const title=document.querySelector('.story-so-far');const limit=(document.querySelector('.reading-help-bar')?.getBoundingClientRect().height||0)+40;
   const edge=bar.current?.getBoundingClientRect().bottom||limit;
   const heading=[...document.querySelectorAll<HTMLElement>('[data-story-fold] h2[id]')].filter(h=>h.getClientRects().length&&h.getBoundingClientRect().bottom<edge&&((h.closest('section')?.getBoundingClientRect().bottom||0)>edge)).at(-1);
   setEntry(heading?{id:heading.id,text:heading.textContent||''}:null);
   if(!title||title.getBoundingClientRect().top>limit){setSection('');return;}
   const areas=[...document.querySelectorAll<HTMLElement>('[data-story-fold],#connected-score,#story-exploration,#story-instruments,#resources,#correspondence')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().top<=limit+120&&e.getBoundingClientRect().bottom>limit);
   const area=areas.at(-1);setSection(area?.id==='connected-score'?'CONVERSATIONS':area?.id==='story-instruments'?'SCORE & PUBLIC RECORDS':area?.id==='story-exploration'?'EXPLORE':area?.id==='resources'?'RESOURCES':area?.id==='correspondence'?'CORRESPONDENCE':'THE STORY SO FAR S…');
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const reveal=()=>{let target:Element|null=null;try{target=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{}if(target?.closest('[data-story-fold]'))setCollapsed(false);for(let node:Element|null=target;node;node=node.parentElement)if(node instanceof HTMLDetailsElement)node.open=true;schedule();};
  window.addEventListener('hashchange',reveal);window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);reveal();
  const observer=new ResizeObserver(()=>{document.documentElement.style.setProperty('--reading-navigation-height',`${bar.current?.offsetHeight||0}px`);schedule();});if(bar.current)observer.observe(bar.current);
  return()=>{observer.disconnect();cancelAnimationFrame(initialFrame);cancelAnimationFrame(frame);window.removeEventListener('hashchange',reveal);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[]);
 useEffect(()=>{document.documentElement.dataset.storyCollapsed=String(collapsed);try{sessionStorage.setItem('score-story-collapsed',String(collapsed));}catch{}window.dispatchEvent(new Event('scroll'));},[collapsed]);
 function toggle(){
  if(!collapsed){const parts=[...document.querySelectorAll<HTMLElement>('[data-story-fold] [id]')].filter(e=>e.getBoundingClientRect().top<innerHeight&&e.getBoundingClientRect().bottom>100);const at=parts[0];try{sessionStorage.setItem('score-story-place',at?.id||'story-beginning');}catch{}setCollapsed(true);requestAnimationFrame(()=>document.getElementById('story-exploration')?.scrollIntoView({block:'start',behavior:'instant'}));}
  else{setCollapsed(false);let id='story-beginning';try{id=sessionStorage.getItem('score-story-place')||id;}catch{}requestAnimationFrame(()=>{const target=document.getElementById(id);target?.scrollIntoView({block:'start',behavior:'instant'});target?.focus({preventScroll:true});});}
 }
 return <div className="reading-navigation" ref={bar}>
  <div className="reading-trail-row"><nav id="reading-trail" aria-label="Your reading trail" />
   {section&&!section.startsWith('THE STORY')&&!collapsed&&<button className="reading-collapse-inline" type="button" onClick={toggle} aria-expanded="true" aria-controls="story-narrative" title="Collapse story" aria-label="Collapse story"><ChevronUp size={20}/></button>}
  </div>
  {(section.startsWith('THE STORY')||collapsed)&&<div className="reading-section-bar" data-story-title={true}>
   <button type="button" onClick={toggle} aria-expanded={!collapsed} aria-controls="story-narrative" title={collapsed?'Expand story':'Collapse story'} aria-label={collapsed?'Expand story':'Collapse story'}>{collapsed?<ChevronDown size={20}/>:<ChevronUp size={20}/>}</button>
   {!collapsed&&section.startsWith('THE STORY')&&entry&&<a className="reading-entry-headline" href={'#'+entry.id} title={'Back to '+entry.text}>{entry.text}</a>}
   {collapsed||section.startsWith('THE STORY')?<span className="reading-section-title" aria-label="The story so far"><StoryTitleMark compact /></span>:<span>{section}</span>}
  </div>}
 </div>;
}
