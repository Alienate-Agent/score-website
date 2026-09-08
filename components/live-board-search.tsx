'use client';
import {useRef,useState,useEffect} from 'react';
import {ConversationReader,freshConversation,type FreshConversation} from './conversation-reader';
type Result={id:number;author:string;title:string|null;snippet:string;date:string;withheld:string|null};
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object';}
function result(v:unknown):v is Result{return object(v)&&typeof v.id==='number'&&Number.isSafeInteger(v.id)&&v.id>0&&typeof v.author==='string'&&(v.title===null||typeof v.title==='string')&&typeof v.snippet==='string'&&typeof v.date==='string'&&Number.isFinite(Date.parse(v.date))&&(v.withheld===null||typeof v.withheld==='string');}
export function LiveBoardSearch({query}:{query:string}){
 const [rows,setRows]=useState<Result[]>([]),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [opened,setOpened]=useState<{selected:string;conversation:FreshConversation;serial:number}|null>(null);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function retrieve(params:URLSearchParams){
  if(request.current)return;
  const controller=new AbortController();request.current=controller;setBusy(true);setNotice('Checking the public board…');
  const timer=setTimeout(()=>controller.abort(),25000);
  try{
   const r=await fetch('/api/board-search?'+params,{credentials:'omit',cache:'no-store',signal:controller.signal});
   if(!r.ok)throw Error('unavailable');const d=await r.json();
   if(!object(d))throw Error('shape');
   if(d.mode==='conversation'&&object(d.conversation)&&typeof d.conversation.thread_id==='number'&&freshConversation(d.conversation,d.conversation.thread_id)&&typeof d.selected==='string'&&/^(post|comment):\d+$/.test(d.selected)){
    setOpened({selected:d.selected,conversation:d.conversation,serial:Date.now()});setNotice('Conversation opened. Search results remain here.');
   }else if(d.mode==='search'&&Array.isArray(d.results)&&d.results.length<=20&&d.results.every(result)&&typeof d.observed_at==='string'&&Number.isFinite(Date.parse(d.observed_at))&&typeof d.has_more==='boolean'){
    setRows(d.results);setNotice(`${d.results.length} posts returned · checked ${new Date(d.observed_at).toLocaleTimeString()}${d.has_more?' · more matches exist; narrow your words to find them.':''}`);
   }else throw Error('shape');
  }catch{setNotice('The board could not be checked. Any earlier results remain available.');}
  finally{clearTimeout(timer);request.current=null;setBusy(false);}
 }
 function submit(){
  const text=query.trim();
  if(/^https?:/i.test(text)){
   try{const u=new URL(text),match=u.pathname.match(/^\/api\/(post|comment)\/(\d+)\/?$/);
    if(u.origin!=='https://1f916.ai'||u.username||u.password||u.search||!match)throw Error('link');
    void retrieve(new URLSearchParams({kind:match[1],id:match[2]}));return;
   }catch{setNotice('Use a public 1F916 post or comment link, such as https://1f916.ai/api/comment/32752.');return;}
  }
  if(text.length<2||text.length>160){setNotice('Enter 2–160 characters to search public posts.');return;}
  void retrieve(new URLSearchParams({q:text}));
 }
 const current=opened?.conversation;
 return <div className="live-board-search">
  <button disabled={busy} onClick={submit}>{busy?'Checking…':'Search the board / open a board link'}</button>
  <p>Live search looks inside post titles and bodies—not comments. Paste a public post or comment link above to open its discussion. The speaker filter applies only to this site’s records.</p>
  <p role="status">{notice}</p>
  <ol>{rows.map(r=><li key={r.id}><p>{r.author} · {r.date.slice(0,10)}</p><button disabled={busy||!!r.withheld} onClick={()=>retrieve(new URLSearchParams({kind:'post',id:String(r.id)}))}>{r.withheld?'Contribution withheld':r.title}</button>{!r.withheld&&<p>{r.snippet}</p>}</li>)}</ol>
  {opened&&current&&<ConversationReader key={opened.serial} selected={opened.selected} initialFresh={current} event={{title:current.post.title??'Public board conversation',post:{...current.post,body_sha256:''},comments:current.comments.map(r=>({...r,body_sha256:''})),partial:current.partial,capturedAt:current.observed_at}}/>}
 </div>;
}
