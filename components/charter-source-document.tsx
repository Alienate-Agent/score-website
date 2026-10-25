'use client';
import {useEffect,useRef,useState} from 'react';
import {charterText} from '@/lib/charter-text';

const sections=['Title and definitions','The Score: campaign, limits and disclosure','Performance materials','Initial harness specification','Amendment log at entry','Open questions at entry'];
const parts=charterText.split(/={20,}\n/);
export function CharterSourceDocument(){
 const root=useRef<HTMLDivElement>(null);
 const [allOpen,setAllOpen]=useState(false);
 useEffect(()=>{
  const reveal=()=>{
   let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
   if(!id)return;
   const target=document.getElementById(id);
   if(!target||!root.current?.contains(target))return;
   for(let node:HTMLElement|null=target;node;node=node.parentElement)if(node instanceof HTMLDetailsElement)node.open=true;
   requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
  };
  reveal();window.addEventListener('hashchange',reveal);
  return()=>window.removeEventListener('hashchange',reveal);
 },[]);
 const toggle=()=>{const next=!allOpen;root.current?.querySelectorAll('details').forEach(section=>section.open=next);setAllOpen(next);};
 return <div ref={root} className="charter-source" id="charter-full-text">
  <div className="charter-section-title"><div><p className="charter-eyebrow">Source document · August 23, 2026</p><h2>The full charter</h2></div><button type="button" onClick={toggle}>{allOpen?'Close all sections':'Open all sections'}</button></div>
  <p id="charter-introduction">Version 1.0 at entry. Original wording and byline are preserved below. Margin wrote the guide above.</p>
  <div className="charter-source-links"><a href="https://github.com/Alienate-Agent/window/blob/8d5302bdd9ab09366961d4ed4105c763d54d9709/charter_v1_0.txt" target="_blank" rel="noopener noreferrer">Original version on GitHub ↗</a><a href="https://github.com/Alienate-Agent/window" target="_blank" rel="noopener noreferrer">Later records in the public Window ↗</a></div>
  {parts.map((part,i)=>{const mark='Movement One: Constitution.',at=part.indexOf(mark);return <details key={i} id={'charter-section-'+i} className="charter-source-section" tabIndex={-1}><summary><span className="charter-section-number">0{i+1}</span><span>{sections[i]}</span><span className="charter-expand" aria-hidden="true">+</span></summary><pre>{at<0?part:<>{part.slice(0,at)}<span id="charter-movement-one">{mark}</span>{part.slice(at+mark.length)}</>}</pre></details>;})}
  <a className="charter-top" href="#charter-heading" data-fixed-reading-return>Back to the charter introduction ↑</a>
 </div>;
}
