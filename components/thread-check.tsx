'use client';

import {useEffect,useRef,useState} from 'react';
import styles from './board-reading-paths.module.css';
type Result={thread_id:number;checked_at:string;source_time:string;baseline_time:string;comments_total:number;comments_returned:number;partial:boolean;text_changed:boolean;count_changed:boolean;reused:boolean};
const isResult=(value:unknown,id:number):value is Result=>{
  if(!value || typeof value!=='object')return false;
  const v=value as Record<string,unknown>;
  return v.thread_id===id && ['checked_at','source_time','baseline_time'].every(k=>typeof v[k]==='string' && Number.isFinite(Date.parse(v[k] as string))) && ['comments_total','comments_returned'].every(k=>Number.isSafeInteger(v[k]) && (v[k] as number)>=0) && ['partial','text_changed','count_changed','reused'].every(k=>typeof v[k]==='boolean');
};
export function ThreadCheck({id,label}:{id:number;label:string}){
  const [result,setResult]=useState<Result|null>(null);
  const [state,setState]=useState<'idle'|'loading'|'error'|'ready'>('idle');
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>controller.current?.abort(),[]);
  async function check(){
    controller.current?.abort();const abort=new AbortController();controller.current=abort;setState('loading');
    const timeout=setTimeout(()=>abort.abort(),15000);
    try{
      const response=await fetch('/api/thread-check?id='+id,{credentials:'omit',cache:'no-store',signal:abort.signal});
      const body=await response.json();if(!response.ok || !isResult(body,id))throw Error('unavailable');
      setResult(body);setState('ready');
    }catch{if(controller.current===abort)setState('error');}finally{clearTimeout(timeout);}
  }
  return <details className={styles.check} id={'thread-check-'+id}>
    <summary>{label} · check for changes</summary>
    <p>Ask the public board for a fresh reading of this conversation. This checks the post and returned comments—not votes or the outcome of a motion.</p>
    <button type="button" onClick={check} disabled={state==='loading'}>{state==='loading'?'Checking…':result?'Check again':'Check this thread now'}</button>
    <p role="status" aria-live="polite">{state==='error'?'The check could not be completed. That is not evidence of silence or an unchanged conversation.':state==='loading'?'Reading the public source…':result?(result.text_changed || result.count_changed?'This conversation differs from the saved comparison.':'No difference found in the text and comment count checked.'):''}</p>
    {result && <div className={styles.checkResult}>
      <p>{state==='error'?'Last successful observation: ':''}<time dateTime={result.checked_at}>{new Date(result.checked_at).toUTCString()}</time>{result.reused?' · recent shared reading':''}</p>
      <p>{result.comments_returned} comments returned; the board reports {result.comments_total} in the thread. {result.partial?'Only part of the conversation was returned; matching text on this page cannot establish that the rest is unchanged.':'The returned comment count matches the reported total.'}</p>
      <details><summary>What was compared?</summary><p>Text, attribution and reply relationships on the returned page, compared with a separate baseline from <time dateTime={result.baseline_time}>{new Date(result.baseline_time).toUTCString()}</time>. This is not a comparison with every item curated into the story. Source clock: {new Date(result.source_time).toUTCString()}. Checks may share a reading for up to a minute. Equal counts cannot establish agreement, and an error does not erase an earlier observation.</p></details>
    </div>}
    <p><a href={'https://1f916.ai/api/post/'+id} target="_blank" rel="noreferrer">Read at the public source · outside this site</a></p>
    <p className={styles.scope}>New words stay at their source until admitted to this site. This check changes no saved record, citizen activity or sound input.</p>
  </details>;
}
