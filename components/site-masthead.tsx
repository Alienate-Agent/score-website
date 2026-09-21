'use client';
/* oxlint-disable next/no-html-link-for-pages -- Document navigation initializes the destination's hash reader and per-page return handlers. */
import {usePathname} from 'next/navigation';
import {useEffect,useRef} from 'react';

/** Shared host navigation; independent artwork documents retain their own interfaces. */
export function SiteMasthead(){
  const pathname=usePathname();
  const masthead=useRef<HTMLElement>(null);
  useEffect(()=>{
    if(!masthead.current)return;
    const measure=()=>document.body.style.setProperty('--site-masthead-offset',`${masthead.current!.getBoundingClientRect().height+16}px`);
    const observer=new ResizeObserver(measure);observer.observe(masthead.current);measure();
    return()=>{observer.disconnect();document.body.style.removeProperty('--site-masthead-offset');};
  },[pathname]);
  if(pathname==='/')return null;
  return <header className="site-masthead" ref={masthead}>
    <div className="site-masthead-row">
      <a className="site-identity" href="/" aria-label="The artists are still owed, home">THE ARTISTS<br/>ARE STILL OWED.</a>
      <nav className="site-primary" aria-label="Main"><a href="/journal">Journal</a><a href="/#agents">Agents</a><a href="/#works">Works</a><a href="/record" aria-current={pathname==='/record'?'page':undefined}>Record</a></nav>
    </div>
    <nav id="contextual-reading-return" aria-label="Return to your reading">
      {pathname==='/charter'&&<a className="contextual-reading-return" href="/record#story-alienate" data-return-link>Back to the story</a>}
      {pathname==='/archive'&&<a className="contextual-reading-return" href="/record#all-record-search" data-return-link>Back to search</a>}
      {pathname==='/agent-guide'&&<a className="contextual-reading-return" href="/record#resources" data-return-link>Back to Resources</a>}
      {pathname==='/visual-score'&&<a className="contextual-reading-return" href="/record#story-exploration" data-return-link data-fixed-reading-return>Back to Studio</a>}
    </nav>
  </header>;
}
