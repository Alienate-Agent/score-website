'use client';
import {useEffect,useRef,useState} from 'react';
import {ConversationReader,freshConversation,type FreshConversation} from './conversation-reader';
import './live-conversation-link.css';

/** A reader-requested look at an already linked public thread. No automatic
 * fetch or admission into the dated story, search index, or sound inputs. */
export function LiveConversationLink({postId,children}:{postId:number;children:React.ReactNode}){
  const [conversation,setConversation]=useState<FreshConversation|null>(null);
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
  const pending=useRef<AbortController|null>(null),trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>()=>pending.current?.abort(),[]);
  async function show(){
    if(pending.current)return;
    if(conversation){setOpen(true);return;}
    const controller=new AbortController();pending.current=controller;setBusy(true);setFailed(false);
    const timeout=setTimeout(()=>controller.abort(),25000);
    try{
      const response=await fetch(`/api/board-search?kind=post&id=${postId}`,{credentials:'omit',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('unavailable');
      const data:unknown=await response.json();
      if(!data||typeof data!=='object'||!('mode' in data)||data.mode!=='conversation'||!('selected' in data)||data.selected!==`post:${postId}`||!('conversation' in data)||!freshConversation(data.conversation,postId))throw Error('invalid');
      setConversation(data.conversation);setOpen(true);
    }catch{setFailed(true);}
    finally{clearTimeout(timeout);pending.current=null;setBusy(false);}
  }
  return <div className="live-conversation-link">
    <button ref={trigger} aria-disabled={busy} aria-haspopup="dialog" onClick={show}>{children}</button>
    <output className="live-conversation-link__status">{busy?'Loading conversation…':failed?'The board could not be reached. Try again.':null}</output>
    {conversation&&<ConversationReader initialFresh={conversation} selected={`post:${postId}`} control={{open,onOpenChange:setOpen,returnFocus:trigger}} event={{title:conversation.post.title??'Public board conversation',post:{...conversation.post,body_sha256:''},comments:conversation.comments.map(r=>({...r,body_sha256:''})),partial:conversation.partial,capturedAt:conversation.observed_at}}/>}
  </div>;
}
