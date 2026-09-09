'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {ConversationReader,freshConversation,type FreshConversation} from './conversation-reader';
import {conversationByObject,type ConversationCollection} from '@/lib/conversation-collections';
import {boardObject,boardReaderHref,type BoardObject} from '@/lib/board-reader-route';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from './ui/dialog';

type Reading={event:ConversationCollection;selected:string;fresh?:FreshConversation};
/** Upgrade source links from every reader, including content revealed after arrival.
 * The rewritten href also works in a new tab. No board request runs before a click. */
export function BoardReaderLayer(){
  const [source,setSource]=useState<BoardObject|null>(null),[reading,setReading]=useState<Reading|null>(null);
  const [busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
  const origin=useRef<HTMLElement|null>(null),heading=useRef<HTMLHeadingElement|null>(null);
  const pending=useRef<AbortController|null>(null),sequence=useRef(0);
  const close=useCallback(()=>{sequence.current++;pending.current?.abort();pending.current=null;setSource(null);setReading(null);setBusy(false);},[]);
  const open=useCallback(async(object:BoardObject,from:HTMLElement|null)=>{
    const serial=++sequence.current;pending.current?.abort();origin.current=from;
    setSource(object);setFailed(false);
    const preserved=conversationByObject(object.kind,object.id);
    if(preserved){setReading(preserved);setBusy(false);return;}
    setReading(null);setBusy(true);
    const controller=new AbortController();pending.current=controller;
    const timer=setTimeout(()=>controller.abort(),25000);
    try{
      const response=await fetch('/api/board-search?'+new URLSearchParams({kind:object.kind,id:String(object.id)}),{credentials:'omit',cache:'no-store',signal:controller.signal});
      if(!response.ok)throw Error('unavailable');
      const payload=await response.json() as {selected?:unknown;conversation?:unknown};
      const data=payload?.conversation;
      if(payload?.selected!==`${object.kind}:${object.id}`||!data||typeof data!=='object'||!('thread_id' in data)||typeof data.thread_id!=='number'||!freshConversation(data,data.thread_id))throw Error('invalid');
      if(object.kind==='post'&&data.thread_id!==object.id)throw Error('wrong thread');
      if(serial!==sequence.current)return;
      setReading({selected:payload.selected,fresh:data,event:{title:data.post.title??'Board conversation',post:{...data.post,body_sha256:''},comments:data.comments.map(act=>({...act,body_sha256:''})),partial:data.partial,capturedAt:data.observed_at}});
    }catch{if(serial===sequence.current)setFailed(true);}
    finally{clearTimeout(timer);if(serial===sequence.current){pending.current=null;setBusy(false);}}
  },[]);
  useEffect(()=>{
    function rewrite(root:Document|HTMLElement){
      const anchors=[...(root instanceof HTMLAnchorElement?[root]:[]),...root.querySelectorAll<HTMLAnchorElement>('a[href]')];
      for(const anchor of anchors){
        const object=boardObject(anchor.href);
        if(object){anchor.href=boardReaderHref(object);anchor.removeAttribute('target');anchor.removeAttribute('download');}
        else if(/^https:\/\/1f916\.ai\/api\/citizen\/(alienate|tidemark)\/?$/i.test(anchor.href)){anchor.href='/#live-agent-activity';anchor.removeAttribute('target');}
      }
    }
    rewrite(document);
    const observer=new MutationObserver(changes=>{for(const change of changes){if(change.type==='attributes'&&change.target instanceof HTMLElement)rewrite(change.target);else for(const node of change.addedNodes)if(node instanceof HTMLElement)rewrite(node);}});
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});
    function follow(event:MouseEvent){
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const anchor=(event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement|null;
      if(!anchor||anchor.target==='_blank')return;
      const url=new URL(anchor.href);
      const object=url.origin===location.origin&&url.pathname==='/board'?boardObject(`https://1f916.ai/api/${url.searchParams.get('kind')}/${url.searchParams.get('id')}`):boardObject(anchor.href);
      if(!object)return;
      event.preventDefault();void open(object,anchor);
    }
    document.addEventListener('click',follow,true);
    const url=new URL(location.href);
    if(url.pathname==='/board'){
      const object=boardObject(`https://1f916.ai/api/${url.searchParams.get('kind')}/${url.searchParams.get('id')}`);
      if(object)void open(object,document.getElementById('board-reopen'));
    }
    return()=>{observer.disconnect();document.removeEventListener('click',follow,true);sequence.current++;pending.current?.abort();};
  },[open]);
  return <>
    {source&&reading&&<ConversationReader key={`${source.kind}:${source.id}`} event={reading.event} selected={reading.selected} initialFresh={reading.fresh} control={{open:true,onOpenChange:next=>{if(!next)close();},returnFocus:origin}}/>}
    <Dialog open={!!source&&!reading} onOpenChange={next=>{if(!next)close();}}>
      <DialogContent className="board-reader-wait" initialFocus={heading} finalFocus={reading?false:origin} showCloseButton={false}>
        <DialogTitle ref={heading} tabIndex={-1}>Board conversation</DialogTitle>
        <DialogDescription>{busy?'Opening the post and its replies…':failed?'The board could not be reached. Your place on this page is unchanged.':'Opening…'}</DialogDescription>
        {failed&&source&&<button onClick={()=>void open(source,origin.current)}>Try again</button>}
        <DialogClose>{busy?'Cancel':'Back to reading'}</DialogClose>
      </DialogContent>
    </Dialog>
  </>;
}
