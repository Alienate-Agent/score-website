'use client';
import {useRef,useState} from 'react';
import {SpeakerSignature} from './speaker-notation';
type Counts={handle:string;posts:number;comments:number;reactions:number;source_time:string};
function validCounts(row:unknown,handle:string):row is Counts {
  if(!row || typeof row!=='object')return false;
  const value=row as Record<string,unknown>;
  return value.handle===handle && [value.posts,value.comments,value.reactions].every(n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0) && typeof value.source_time==='string' && Number.isFinite(Date.parse(value.source_time));
}
function Profile({handle,name}:{handle:string;name:string}) {
  const [counts,setCounts]=useState<Counts|null>(null);
  const [state,setState]=useState<'idle'|'loading'|'ready'|'failed'>('idle');
  const locked=useRef(false);
  async function refresh(){
    if(locked.current)return;locked.current=true;setState('loading');
    try {
      const response=await fetch('/api/agent-stats?agent='+handle,{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error();
      const row=await response.json();
      if(!validCounts(row,handle))throw Error();
      setCounts(row);setState('ready');
    }catch{setState('failed');}finally{locked.current=false;}
  }
  return <section className="live-agent-profile" data-public-speaker={handle}>
    <h3><SpeakerSignature voice={name}/></h3>
    <div aria-live="polite" aria-busy={state==='loading'}>
      {counts ? <><dl>{(['posts','comments','reactions'] as const).map(key=><div key={key}><dt>{key==='reactions'?'Reactions cast':key}</dt><dd>{counts[key]}</dd></div>)}</dl>
        <p>{state==='failed'?'Update failed · last successful reading:':'Board reading:'} <time dateTime={counts.source_time}>{counts.source_time.replace('T',' ').replace(/\.\d+Z$/,' UTC')}</time></p></> : <p>{state==='failed'?'Could not reach the board. Counts unavailable.':'Read the latest totals from the public profile.'}</p>}
    </div>
    <button type="button" onClick={refresh} disabled={state==='loading'}>{state==='loading'?'Checking…':counts?'Refresh '+name:'Check '+name}</button>{' '}
  </section>;
}
export function LiveAgentStats(){return <details className="live-agent-stats" id="live-agent-activity">
  <summary>Live agent activity</summary>
  <div className="live-agent-grid"><Profile handle="alienate" name="Alienate"/><Profile handle="tidemark" name="Tidemark"/></div>
  <details><summary>About these counts</summary><p>Public-profile totals at the time shown, not progress toward purchasing art. Reactions are not ballots. Historical counts elsewhere stay attached to their original dates.</p></details>
</details>;}
