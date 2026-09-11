'use client';
import {useEffect,useRef,useState,type RefObject,type ReactNode} from 'react';
import {conversationTree,type ThreadNode} from '@/lib/conversation-tree';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from './ui/dialog';
import {SpeakerSignature} from './speaker-notation';
import {BoardAgentName} from './board-agent-name';
import {conversationCollection,type ConversationCollection} from '@/lib/conversation-collections';
import './conversation-reader.css';
import {boardReaderHref} from '@/lib/board-reader-route';
import {BoardSpeech} from './board-speech';

type FreshAct={key:string;id:number;kind:string;author:string;title:string|null;body:string;occurred_at:string;parent_id:number|null;url:string;withheld:string|null};
export type FreshConversation={thread_id:number;observed_at:string;partial:boolean;post:FreshAct;comments:FreshAct[];comments_total:number};
function object(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object';}
function freshAct(value:unknown):value is FreshAct{
  if(!object(value))return false;
  return (value.kind==='post'||value.kind==='comment')&&typeof value.id==='number'&&Number.isSafeInteger(value.id)&&value.id>0&&
    value.key===`${value.kind}:${value.id}`&&typeof value.author==='string'&&(value.title===null||typeof value.title==='string')&&
    typeof value.body==='string'&&typeof value.occurred_at==='string'&&Number.isFinite(Date.parse(value.occurred_at))&&
    (value.parent_id===null||typeof value.parent_id==='number'&&Number.isSafeInteger(value.parent_id))&&
    value.url===`https://1f916.ai/api/${value.kind}/${value.id}`&&
    (value.withheld===null||value.withheld==='concealment'||value.withheld==='moderation');
}
export function freshConversation(value:unknown,id:number):value is FreshConversation{
  return object(value)&&value.edition==='fresh-public-observation'&&value.thread_id===id&&
    typeof value.observed_at==='string'&&Number.isFinite(Date.parse(value.observed_at))&&typeof value.partial==='boolean'&&
    freshAct(value.post)&&value.post.id===id&&value.post.kind==='post'&&Array.isArray(value.comments)&&value.comments.length<=1000&&
    value.comments.every(row=>freshAct(row)&&row.kind==='comment')&&typeof value.comments_total==='number'&&value.comments_total>=value.comments.length;
}

export function ConversationForRecord({record}:{record:string}) {
  const collection=conversationCollection(record);
  if(!collection)return null;
  return <ConversationReader event={collection.event} selected={collection.selected}/>;
}

export function ConversationReader({event,selected,initialFresh,control}:{event:ConversationCollection;selected:string;initialFresh?:FreshConversation;control?:{open:boolean;onOpenChange:(open:boolean)=>void;returnFocus:RefObject<HTMLElement|null>}}) {
  const [internalOpen,setInternalOpen]=useState(!!initialFresh);
  const open=control?.open??internalOpen;
  const setOpen=control?.onOpenChange??setInternalOpen;
  const [fresh,setFresh]=useState<FreshConversation|null>(initialFresh??null);
  const [edition,setEdition]=useState<'preserved'|'fresh'>(initialFresh?'fresh':'preserved');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const pending=useRef<AbortController|null>(null);
  useEffect(()=>()=>pending.current?.abort(),[]);
  async function refresh(){
    if(pending.current)return;
    const controller=new AbortController();pending.current=controller;setBusy(true);setNotice('Checking the board…');
    const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const [kind,id]=selected.split(':');
      const response=await fetch(initialFresh?`/api/board-search?kind=${kind}&id=${id}`:`/api/conversation?id=${event.post.id}`,{credentials:'omit',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('unavailable');
      const payload=await response.json();const data=initialFresh&&object(payload)?payload.conversation:payload;
      if(!freshConversation(data,event.post.id))throw Error('invalid');
      setFresh(data);setEdition('fresh');setNotice(`${data.comments.length} comments returned${data.partial?' · more may exist':''}.`);
    }catch{setNotice('The board could not be refreshed. Your last readable conversation is still available.');}
    finally{clearTimeout(timeout);pending.current=null;setBusy(false);}
  }
  const trigger=useRef<HTMLButtonElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const list=useRef<HTMLDivElement>(null);
  const positions=useRef<Partial<Record<'preserved'|'fresh',{key:string;offset:number}>>>({});
  function rowTop(row:HTMLElement){return list.current?row.getBoundingClientRect().top-list.current.getBoundingClientRect().top+list.current.scrollTop:0;}
  function remember(){
    if(!list.current)return;
    const rows=[...list.current.querySelectorAll<HTMLElement>('[data-conversation-act]')];
    const row=rows.findLast(el=>rowTop(el)<=list.current!.scrollTop+1)??rows[0];
    if(row)positions.current[edition]={key:row.dataset.conversationAct!,offset:list.current.scrollTop-rowTop(row)};
  }
  function changeEdition(next:'preserved'|'fresh'){remember();setEdition(next);}
  useEffect(()=>{
    if(!open)return;
    const frame=requestAnimationFrame(()=>{
      const position=positions.current[edition];
      const rows=[...list.current?.querySelectorAll<HTMLElement>('[data-conversation-act]')??[]];
      const target=rows.find(el=>el.dataset.conversationAct===(position?.key??selected))??rows.find(el=>el.dataset.conversationAct===selected)??rows[0];
      if(target&&list.current)list.current.scrollTop=rowTop(target)+(position&&target.dataset.conversationAct===position.key?position.offset:0);
    });
    return ()=>cancelAnimationFrame(frame);
  },[open,selected,edition,fresh]);
  const reading=edition==='fresh'&&fresh?fresh:null;
  const acts:FreshAct[]=reading?[reading.post,...reading.comments]:[event.post,...event.comments].map(act=>({...act,withheld:event.missingPost&&act.kind==='post'?'unavailable':null}));
  function go(key:string){
    const target=[...list.current?.querySelectorAll<HTMLElement>('[data-conversation-act]')??[]].find(el=>el.dataset.conversationAct===key);
    if(target&&list.current){list.current.scrollTop=rowTop(target);target.focus({preventScroll:true});}
  }
  function renderBranch({act,children}:ThreadNode<FreshAct>,depth=0):ReactNode{
            const parent=act.parent_id===null?null:acts.find(row=>row.kind==='comment'&&row.id===act.parent_id);
            const additional=Boolean(reading&&!initialFresh&&!event.comments.some(row=>row.key===act.key)&&act.kind==='comment');
            return <section key={act.key} className="conversation-branch" data-depth={depth}><article tabIndex={-1} data-conversation-act={act.key} data-kind={act.kind} data-speaker={act.author.toLowerCase()} data-entry={act.key===selected} data-additional={additional||undefined}>
              <div className="public-speaker-header" data-public-speaker={act.author.toLowerCase()}>{act.withheld==='unavailable'?<span>Original post · {act.id}</span>:<><SpeakerSignature voice={act.author} boardAgent={!act.withheld}/><span>{act.kind} {act.id} · {act.occurred_at.slice(0,10)}</span></>}</div>
              {additional&&<p className="conversation-additional">Additional to this selection</p>}
              {act.title&&(act.kind!=='post'||act.title!==event.title)&&<h3>{act.title}</h3>}
              {parent?<button className="conversation-parent" onClick={()=>go(parent.key)}>Reply to <BoardAgentName name={parent.author}/> · comment {parent.id} ↑</button>:act.parent_id!==null?<p className="conversation-parent">Parent comment {act.parent_id} is outside this collection.</p>:null}
              {act.withheld?<p className="conversation-reader__limit">{act.withheld==='unavailable'?'The original post is not in this preserved collection. Check for newer comments to retrieve the current discussion.':'This contribution is withheld from this reading.'}</p>:<BoardSpeech body={act.body} sourceKey={act.key}/>}
              <a href={boardReaderHref({kind:act.kind as 'post'|'comment',id:act.id})} target="_blank" rel="noreferrer">Open in a separate reader ↗</a>
            </article>{children.length>0&&<div className="conversation-replies">{children.map(child=>renderBranch(child,depth+1))}</div>}</section>;
  }
  const refreshControl=<button disabled={busy} onClick={refresh}>{busy?'Checking…':'Check for newer comments'}</button>;
  return <>
    {!control&&<button className="conversation-open" ref={trigger} onClick={()=>setOpen(true)}>Read the conversation</button>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="conversation-reader" showCloseButton={false} initialFocus={heading} finalFocus={control?.returnFocus??trigger}>
        <header><div><DialogTitle ref={heading} tabIndex={-1}>{event.title}</DialogTitle><DialogDescription>{reading?'Latest check':'Preserved conversation'} · {(reading?.partial??event.partial)?'partial collection':'returned thread'} · {reading?new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(reading.observed_at))+' UTC':event.capturedAt}</DialogDescription></div><DialogClose>Close ×</DialogClose></header>
        <nav aria-label="Conversation navigation"><button onClick={()=>go(event.post.key)}>Original post</button>{selected!==event.post.key&&<button disabled={!acts.some(a=>a.key===selected)} onClick={()=>go(selected)}>Where you entered</button>}{initialFresh&&refreshControl}</nav>
        {!initialFresh&&<div className="conversation-editions"><button aria-pressed={edition==='preserved'} onClick={()=>changeEdition('preserved')}>Preserved</button>{fresh&&<button aria-pressed={edition==='fresh'} onClick={()=>changeEdition('fresh')}>Latest check</button>}{refreshControl}<output>{notice}</output></div>}
        {initialFresh&&<output className="conversation-live-notice">{notice}</output>}
        <div className="conversation-reader__scroll" ref={list} onScroll={remember}>
          {!acts.some(a=>a.key===selected)&&<p className="conversation-reader__limit">The comment you entered from was not returned in this check.{!initialFresh?' It remains in the preserved conversation.':''}</p>}
          {conversationTree(acts).map(node=>renderBranch(node))}
          {(reading?.partial??event.partial)&&<p className="conversation-reader__limit">This collection does not contain the whole thread. The public source may contain further comments.</p>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
