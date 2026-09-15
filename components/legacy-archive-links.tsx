'use client';
import {useEffect} from 'react';
import {archiveDestination} from '@/lib/archive-location';
import {visualScoreDestination} from '@/lib/visual-score-location';

export function LegacyArchiveLinks(){
  useEffect(()=>{
    const restore=()=>{
      if(location.hash==='#declaration-question'){
        location.replace('/featured#responsibility-2026-09-08');
        return;
      }
      if(location.hash==='#story-reading-notes'){
        history.replaceState(null,'','#about-this-telling');
        window.dispatchEvent(new HashChangeEvent('hashchange'));
        return;
      }
      const target=visualScoreDestination(new URL(location.href))??archiveDestination(location.hash);
      if(target)location.replace(target);
    };
    restore();
    window.addEventListener('hashchange',restore);
    window.addEventListener('popstate',restore);
    return ()=>{window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore);};
  },[]);
  return null;
}
