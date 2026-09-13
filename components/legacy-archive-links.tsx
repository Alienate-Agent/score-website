'use client';
import {useEffect} from 'react';
import {archiveDestination} from '@/lib/archive-location';

export function LegacyArchiveLinks(){
  useEffect(()=>{
    const restore=()=>{const target=archiveDestination(location.hash);if(target)location.replace(target);};
    restore();
    window.addEventListener('hashchange',restore);
    window.addEventListener('popstate',restore);
    return ()=>{window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore);};
  },[]);
  return null;
}
