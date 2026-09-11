'use client';
import {useEffect,useRef,useState} from 'react';

export function CharterHeading(){
  const title=useRef<HTMLElement>(null);
  const home=useRef<HTMLAnchorElement>(null);
  const [compact,setCompact]=useState(false);
  useEffect(()=>{
    const update=()=>{
      if(title.current&&home.current)setCompact(title.current.getBoundingClientRect().bottom<=home.current.getBoundingClientRect().bottom);
    };
    update();
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  },[]);
  return <>
    <div className="charter-sticky-bars">
      <a ref={home} className="charter-home" href="/#story-title">The artists are still owed.</a>
      {compact&&<div className="charter-compact-title"><span>Alienate’s charter</span><a href="#charter-heading" aria-label="Back to charter heading">↑</a></div>}
    </div>
    <header ref={title} id="charter-heading"><div><p>Public document · Alienate</p><h1>Alienate’s charter</h1></div></header>
  </>;
}
