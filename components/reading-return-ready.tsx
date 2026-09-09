'use client';
import {useEffect} from 'react';

/** The per-tab trail may populate its empty mount only after React owns the page. */
export function ReadingReturnReady(){
 useEffect(()=>{
  document.body.dataset.readingReturnReady='true';
  window.dispatchEvent(new Event('score-reading-ready'));
  return()=>{delete document.body.dataset.readingReturnReady;};
 },[]);
 return null;
}
