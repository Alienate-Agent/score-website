'use client';
/* oxlint-disable next/no-html-link-for-pages -- Document navigation initializes the destination's hash reader and per-page return handlers. */
import {usePathname} from 'next/navigation';
import {useEffect,useRef} from 'react';

/** Every secondary page inherits the site identity; the entrance owns its contents bar. */
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
  return <header className="site-masthead" ref={masthead}><a href="/#story-title" aria-label="The artists are still owed — Back to the entrance">The artists are still owed.</a><nav id="contextual-reading-return" aria-label="Return to your reading">{pathname==='/charter'&&<a className="contextual-reading-return" href="/#story-alienate" data-return-link>Back to the story</a>}{pathname==='/archive'&&<a className="contextual-reading-return" href="/#all-record-search" data-return-link>Back to search</a>}{pathname==='/visual-score'&&<a className="contextual-reading-return" href="/#story-exploration" data-return-link data-fixed-reading-return>Back to Studio</a>}</nav></header>;
}
