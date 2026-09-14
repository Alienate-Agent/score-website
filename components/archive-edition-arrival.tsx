'use client';
import {useEffect} from 'react';

/** Reveal a cited edition without opening unrelated archive material. */
export function ArchiveEditionArrival(){
  useEffect(()=>{
    const reveal=()=>{
      let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
      const target=document.getElementById(id);
      if(!target?.closest('#earlier-site-editions'))return;
      let ancestor:Element|null=target;
      while(ancestor?.closest('#earlier-site-editions')){
        if(ancestor instanceof HTMLDetailsElement)ancestor.open=true;
        ancestor=ancestor.parentElement;
      }
      requestAnimationFrame(()=>{
        const focus=target instanceof HTMLDetailsElement?target.querySelector('summary'):target;
        (focus as HTMLElement|null)?.focus({preventScroll:true});
        target.scrollIntoView({block:'start',behavior:'instant'});
      });
    };
    reveal();
    window.addEventListener('hashchange',reveal);window.addEventListener('popstate',reveal);
    return()=>{window.removeEventListener('hashchange',reveal);window.removeEventListener('popstate',reveal);};
  },[]);
  return null;
}
