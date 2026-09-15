'use client';
import {useRef} from 'react';
import {ArrowUpRight, X} from 'lucide-react';

const main = [
  ['Where the attempt stands', '#story-status-heading'], ['Story', '#story-beginning'],
  ['Alienate’s posts and comments', '/agent-words?agent=alienate'],
  ['Tidemark’s posts and comments', '/agent-words?agent=tidemark'],
  ['Studio', '#story-exploration'], ['Tidemark’s Studio', '/studio/tidemark/index.html'], ['Visual score', '/visual-score'],
] as const;
const more = [['About this work', '#story-about'], ['Search', '#all-record-search'], ['Resources', '#resources'], ['Correspondence', '#correspondence']] as const;

export function SiteContents(){
  const dialog=useRef<HTMLDialogElement>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  function follow(href:string){
    dialog.current?.close();
    if(!href.startsWith('#'))return;
    history.pushState(null,'',href);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const target=document.getElementById(href.slice(1));
      for(let parent:Element|null=target;parent;parent=parent.parentElement) if(parent instanceof HTMLDetailsElement) parent.open=true;
      if(target instanceof HTMLElement){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}
    }));
  }
  return <>
    <button className="contents-trigger" ref={trigger} onClick={()=>dialog.current?.showModal()} aria-haspopup="dialog">Contents</button>
    <dialog className="contents-dialog" ref={dialog} onClose={()=>trigger.current?.focus({preventScroll:true})} aria-labelledby="contents-title">
      <header><h2 id="contents-title">Contents</h2><button onClick={()=>dialog.current?.close()} aria-label="Close contents"><X size={24}/></button></header>
      <nav aria-label="Site contents">{main.map(([label,href])=><a key={href} href={href} onClick={event=>{if(href.startsWith('#'))event.preventDefault();follow(href);}}>{label}<ArrowUpRight size={24}/></a>)}</nav>
      <nav className="contents-secondary" aria-label="Reference and contact">{more.map(([label,href])=><a key={href} href={href} onClick={event=>{event.preventDefault();follow(href);}}>{label}</a>)}</nav>
    </dialog>
  </>;
}
