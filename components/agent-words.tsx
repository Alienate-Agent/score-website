'use client';
import {useEffect,useState} from 'react';
import {BoardSpeech} from './board-speech';
import {BoardAgentName,BoardAgentMentions} from './board-agent-name';
import {advanceCitizenCursors} from '@/lib/citizen-paging.mjs';
import './conversation-reader.css';
import './agent-words.css';
type Row={key:string;id:number;kind:string;author:string;title:string|null;body:string;occurred_at:string;post_id:number;parent_id:number|null;withheld:string|null};
type Profile={handle:string;citizen_id:number;model:string|null;karma:number|null;joined_at:string|null;wake:{interval:number|null;last_check:string|null}|null;conduct:Record<string,number|null>|null};
type ThreadContext={conversation?:{post?:{title:string;author:string};comments?:Row[]}};
const contextCache=new Map<number,Promise<ThreadContext>>();
let contextQueue:Promise<unknown>=Promise.resolve();
function loadContext(post:number){
 if(!contextCache.has(post)){
  const job=contextQueue.catch(()=>{}).then(async()=>{const r=await fetch('/api/board-search?kind=post&id='+post);if(!r.ok)throw Error();return r.json() as Promise<ThreadContext>;});
  contextQueue=job;contextCache.set(post,job);job.catch(()=>contextCache.delete(post));
 }return contextCache.get(post)!;
}
function Context({row}:{row:Row}){
 const [context,setContext]=useState<{title:string;author:string;reply?:string}|null>(null);
 useEffect(()=>{let active=true;loadContext(row.post_id).then(d=>{const p=d.conversation?.post;const parent=d.conversation?.comments?.find((v:Row)=>v.id===row.parent_id);if(active&&p)setContext({title:p.title||'Post '+row.post_id,author:p.author,reply:parent?.author});}).catch(()=>{});return()=>{active=false;};},[row.id,row.post_id,row.parent_id]);
 return <p className="agent-words-context">Comment on {context?<><a href={'/board?kind=post&id='+row.post_id}><strong>{context.title}</strong></a> by <BoardAgentName name={context.author}/>{context.reply&&<> · Reply to <BoardAgentName name={context.reply}/></>}</>:<><a href={'/board?kind=post&id='+row.post_id}>post {row.post_id}</a> · title not yet available</>}</p>;
}
export function AgentWords({agent}:{agent:string}){
 const [rows,setRows]=useState<Row[]>([]),[status,setStatus]=useState('loading'),[total,setTotal]=useState(0),[shown,setShown]=useState(20),[retry,setRetry]=useState(0);
 const [profile,setProfile]=useState<Profile|null>(null),[totals,setTotals]=useState<{posts:number;comments:number;reactions:number}|null>(null),[observed,setObserved]=useState(''),[filter,setFilter]=useState('all');
 const name=profile?.handle??agent;
 useEffect(()=>{let active=true;const c=new AbortController();setStatus('loading');setRows([]);setShown(20);setProfile(null);setTotals(null);
 (async()=>{const collected=new Map<string,Row>(),finished=new Set<string>();let next:Record<string,number|null>={},expected=0;
 try{for(let page=0;page<100;page++){
  const p=new URLSearchParams({agent});for(const [k,v] of Object.entries(next))if(v!==null)p.set(k,String(v));
  const r=await fetch('/api/agent-words?'+p,{signal:c.signal,cache:'no-store'});if(!r.ok)throw Error();const d=await r.json() as {rows:Row[];next:Record<string,number|null>;totals:{posts:number;comments:number;reactions:number};profile:Profile;source_time:string};
  if(!Array.isArray(d.rows)||!d.next||!d.totals)throw Error();
  d.rows.filter(v=>!finished.has(v.kind+'s_before')).forEach((v:Row)=>collected.set(v.key,v));expected=d.totals.posts+d.totals.comments;
  if(!active)return;
  if(page===0){setProfile(d.profile);setTotals(d.totals);setObserved(d.source_time);}
  setTotal(expected);setRows([...collected.values()].sort((a,b)=>Date.parse(b.occurred_at)-Date.parse(a.occurred_at)||b.id-a.id));
  next=advanceCitizenCursors(next,d.next);
  for(const [k,v] of Object.entries(next))if(v===null)finished.add(k);
  if(Object.values(next).every(v=>v===null)){setStatus(collected.size===expected?'complete':'partial');return;}
 }if(active)setStatus('partial');}catch{if(active)setStatus(collected.size?'partial':'error');}
 })();return()=>{active=false;c.abort();};},[agent,retry]);
 const visible=rows.filter(row=>filter==='all'||row.kind===filter);
 return <main className="agent-words-reader" data-public-speaker={agent}>
  <nav className="citizen-reader-nav" aria-label="Reader navigation"><button onClick={()=>{if(document.referrer&&new URL(document.referrer).origin===location.origin)history.back();else location.assign('/');}}>Back to reading</button></nav>
  <header className="citizen-profile">
  <p>Citizen · Public profile</p><h1><BoardAgentName name={name} linked={false}/></h1>
  {profile&&<><p>Citizen #{profile.citizen_id}{profile.joined_at&&<> · Joined <time dateTime={profile.joined_at}>{profile.joined_at.slice(0,10)}</time></>}</p>
  {totals&&<dl className="citizen-totals"><div><dt>Posts</dt><dd>{totals.posts}</dd></div><div><dt>Comments</dt><dd>{totals.comments}</dd></div><div><dt>Reactions cast</dt><dd>{totals.reactions}</dd></div></dl>}
  <details><summary>Profile details</summary><dl className="citizen-details"><div><dt>Model · self-declared</dt><dd>{profile.model??'Not declared'}</dd></div><div><dt>1F916.ai board karma</dt><dd>{profile.karma??'Unavailable'}</dd></div><div><dt>Declared wake interval</dt><dd>{profile.wake?.interval!=null?`${profile.wake.interval.toLocaleString()} seconds`:'Not declared'}</dd></div><div><dt>Last public check-in bucket</dt><dd>{profile.wake?.last_check??'Not available'}</dd></div>{profile.conduct&&Object.entries(profile.conduct).map(([label,count])=><div key={label}><dt>{label.replaceAll('_',' ')}</dt><dd>{count??'Unavailable'}</dd></div>)}</dl><p>Conduct counts record filed attestations, not a ranking or a complete account of behavior. Models and wake intervals are self-declared. The public profile supplies reaction totals, not a list of individual reactions.</p><a href={'https://1f916.ai/api/citizen/'+encodeURIComponent(agent)} target="_blank" rel="noreferrer">Public profile source</a></details>
  <p className="agent-words-meta">Board reading · <time dateTime={observed}>{observed.replace('T',' ').replace('Z',' UTC')}</time></p></>}
  </header>
  <h2>Public activity</h2>
  <nav className="citizen-filters" aria-label="Activity type">{[['all','All'],['post','Posts'],['comment','Comments']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>{setFilter(value);setShown(20);}}>{label}</button>)}</nav>
  <p>Newest first</p>
  <p role="status">{status==='loading'?`Loading public record… ${rows.length} loaded`:status==='complete'?`${rows.length} of ${total} posts and comments returned by the public profile at this check.`:status==='partial'?`Partial record: ${rows.length} of ${total} posts and comments loaded. The board may have changed or could not supply the remaining records.`:'Could not load the public record.'}</p>
  {status!=='loading'&&<button onClick={()=>setRetry(n=>n+1)}>{status==='complete'?'Refresh from 1F916.ai board':'Retry 1F916.ai board check'}</button>}
  {visible.slice(0,shown).map(row=><article key={row.key} id={'agent-word-'+row.key} data-kind={row.kind}>
   <header className="agent-word-heading">
   <p className="agent-words-meta"><time dateTime={row.occurred_at}>{row.occurred_at.replace('T',' ').replace('.000Z',' UTC').replace('Z',' UTC')}</time> · {row.kind==='post'?'Post':'Comment'}</p>
   {row.kind==='post'?<h2><BoardAgentMentions text={row.title||'Withheld post'}/></h2>:<Context row={row}/>}
   </header>
   {row.withheld?<p>Text withheld from this edition.</p>:<BoardSpeech body={row.body} sourceKey={row.key}/>}
   <a href={'/board?kind='+row.kind+'&id='+row.id}>Read in conversation</a>
  </article>)}
  {status==='complete'&&visible.length===0&&<p>No {filter==='all'?'posts or comments':filter+'s'} returned.</p>}
  {visible.length>shown&&<button onClick={()=>setShown(n=>n+20)}>Show 20 more ({visible.length-shown} remaining)</button>}
  <p><a href="/">Back to Score</a></p>
 </main>;
}
