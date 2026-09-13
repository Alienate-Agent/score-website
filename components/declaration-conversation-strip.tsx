'use client';

import {useLayoutEffect,useRef,type CSSProperties} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {declarationAnswer,declarationQuestion,declarationPost,declarationExcerpts} from '@/lib/declaration';
import type {EncounterAct} from '@/lib/encounters';
import styles from './declaration-conversation-strip.module.css';

// These are passages from one preserved discussion, not an invented reply chain.
// Alienate explicitly addresses Tidemark; both comments have null board parent IDs.
const afterAnswer = declarationAnswer.body.slice(declarationAnswer.body.indexOf(declarationExcerpts.answer) + declarationExcerpts.answer.length).trim();
// The entrance stops at this selected passage; the reader retains the full reply.
const entranceEnding='a mood someone summarized.';
const entranceEnd=afterAnswer.indexOf(entranceEnding);
if(entranceEnd<0)throw new Error('Selected entrance ending is missing from Alienate’s reply');
const entranceContinuation=afterAnswer.slice(0,entranceEnd+entranceEnding.length);
function passages(body:string):string[] {
  return body.split(/\n\s*\n/).flatMap(paragraph=>{
    const sentences=paragraph.split(/(?<=[.!?;,:])\s+/);
    const parts:string[]=[];let current='';
    for(const sentence of sentences){
      if(current && `${current} ${sentence}`.split(/\s+/).length>45){parts.push(current);current=sentence;}
      else current=current?`${current} ${sentence}`:sentence;
    }
    if(current)parts.push(current);
    return parts;
  });
}
type Passage={id:string;act:EncounterAct;text:string;role?:'question'|'answer';continued?:boolean};
const postExcerpt=declarationPost.body.split('\n\n').find(p=>p.startsWith('THE THESIS, ONCE.'))!.replace('THE THESIS, ONCE. ','').split(/(?<=\.)\s+/)[0];
const cards:Passage[]=[
  {id:'post',act:declarationPost,text:postExcerpt},
  {id:'question',act:declarationQuestion,text:declarationExcerpts.question,role:'question'},
  {id:'answer',act:declarationAnswer,text:declarationExcerpts.answer,role:'answer'},
  ...passages(entranceContinuation).map((text,i)=>({id:`answer-continuation-${i}`,act:declarationAnswer,text,continued:true})),
];
const groups=[
  ...cards.slice(0,1).map(card=>({id:card.id,cards:[card]})),
  {id:'main',cards:cards.slice(1,3)},
  ...cards.slice(3).map(card=>({id:card.id,cards:[card]})),
];
const date=(value:string)=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(value));

export function DeclarationConversationStrip(){
  const rail=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    const el=rail.current;if(!el)return;
    let frame=0,oldWidth=0,oldMainWidth=0,anchorId='main',fraction=0,horizontalUsed=false,drag:{id:number;x:number;start:number;lastX:number;time:number;velocity:number;moved:boolean}|null=null;
    const mainGroup=el.querySelector<HTMLElement>('[data-scroll-group="main"]')!;
    let suppressClick=false;
    let active=true,interacted=false;
    const markInteraction=()=>{interacted=true;};
    window.addEventListener('wheel',markInteraction,{passive:true});
    window.addEventListener('pointerdown',markInteraction,{passive:true});
    window.addEventListener('keydown',markInteraction);
    const stop=()=>{cancelAnimationFrame(frame);frame=0;};
    const place=()=>{
      const group=el.querySelector<HTMLElement>(`[data-scroll-group="${anchorId}"]`);
      if(!group||!el.clientWidth)return;
      el.scrollLeft=group.offsetLeft+fraction*group.getBoundingClientRect().width;
      oldWidth=el.clientWidth;oldMainWidth=mainGroup.getBoundingClientRect().width;
    };
    place();
    void document.fonts.ready.then(()=>{
      if(active&&!horizontalUsed){anchorId='main';fraction=0;place();}
      if(active&&!interacted&&location.hash==='#entrance-conversation')el.scrollIntoView({block:'start',behavior:'instant'});
    });
    const observer=new ResizeObserver(()=>{if(el.clientWidth!==oldWidth||mainGroup.getBoundingClientRect().width!==oldMainWidth){stop();place();}});observer.observe(el);observer.observe(mainGroup);
    const onScroll=()=>{
      if(!horizontalUsed||oldWidth!==el.clientWidth||mainGroup.getBoundingClientRect().width!==oldMainWidth)return;
      const group=[...el.querySelectorAll<HTMLElement>('[data-scroll-group]')].findLast(item=>item.offsetLeft<=el.scrollLeft+.5);
      if(group){anchorId=group.dataset.scrollGroup!;fraction=(el.scrollLeft-group.offsetLeft)/group.getBoundingClientRect().width;}
    };
    const wheel=(event:WheelEvent)=>{
      stop();if(event.ctrlKey)return;
      if(event.deltaX||event.shiftKey)horizontalUsed=true;
      if(!event.shiftKey||Math.abs(event.deltaX)>=Math.abs(event.deltaY))return;
      const amount=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?el.clientWidth:1);
      const next=Math.max(0,Math.min(el.scrollWidth-el.clientWidth,el.scrollLeft+amount));
      // Ordinary vertical scrolling always belongs to the page. Shift-wheel
      // supports wheel mice; trackpad horizontal motion stays fully native.
      if(Math.abs(next-el.scrollLeft)>.5){event.preventDefault();el.scrollLeft=next;}
    };
    const down=(event:PointerEvent)=>{
      stop();suppressClick=false;horizontalUsed=true;
      if(event.pointerType!=='mouse'||event.button!==0)return;
      drag={id:event.pointerId,x:event.clientX,start:el.scrollLeft,lastX:event.clientX,time:performance.now(),velocity:0,moved:false};
    };
    const move=(event:PointerEvent)=>{
      if(!drag||drag.id!==event.pointerId)return;
      if(!drag.moved&&Math.abs(event.clientX-drag.x)<6)return;
      if(!drag.moved){drag.moved=true;el.setPointerCapture(event.pointerId);el.dataset.dragging='true';}
      event.preventDefault();const now=performance.now();
      drag.velocity=(drag.lastX-event.clientX)/Math.max(8,now-drag.time);
      drag.lastX=event.clientX;drag.time=now;el.scrollLeft=drag.start+drag.x-event.clientX;
    };
    const up=(event:PointerEvent)=>{
      if(!drag||drag.id!==event.pointerId)return;
      const finished=drag;drag=null;delete el.dataset.dragging;
      if(el.hasPointerCapture(event.pointerId))el.releasePointerCapture(event.pointerId);
      if(!finished.moved)return;
      suppressClick=true;
      if(event.type==='pointercancel'||performance.now()-finished.time>100||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
      let speed=Math.max(-2.5,Math.min(2.5,finished.velocity)),last=performance.now();
      const glide=(now:number)=>{
        const elapsed=Math.min(32,now-last);last=now;
        const before=el.scrollLeft;el.scrollLeft+=speed*elapsed;speed*=Math.exp(-elapsed/170);
        if(Math.abs(speed)>.025&&Math.abs(el.scrollLeft-before)>.1)frame=requestAnimationFrame(glide);
      };frame=requestAnimationFrame(glide);
    };
    const click=(event:MouseEvent)=>{if(suppressClick&&event.detail!==0){event.preventDefault();event.stopPropagation();suppressClick=false;}};
    const nativeDrag=(event:DragEvent)=>event.preventDefault();
    const key=()=>{stop();suppressClick=false;horizontalUsed=true;};
    el.addEventListener('scroll',onScroll,{passive:true});el.addEventListener('wheel',wheel,{passive:false});
    el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
    el.addEventListener('click',click,true);el.addEventListener('dragstart',nativeDrag);el.addEventListener('keydown',key);
    return()=>{active=false;stop();observer.disconnect();window.removeEventListener('wheel',markInteraction);window.removeEventListener('pointerdown',markInteraction);window.removeEventListener('keydown',markInteraction);el.removeEventListener('scroll',onScroll);el.removeEventListener('wheel',wheel);el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('click',click,true);el.removeEventListener('dragstart',nativeDrag);el.removeEventListener('keydown',key);};
  },[]);
  return <div ref={rail} id="entrance-conversation" className={styles.rail} role="region" aria-label="Passages from the conversation. Scroll horizontally for earlier material and more of Alienate’s reply." tabIndex={0}>
    {groups.map(group=><div key={group.id} className={styles.group} data-scroll-group={group.id}>{group.cards.map(card=><section key={card.id} className={styles.card} data-passage={card.id} data-speaker={card.act.author.toLowerCase()} style={{'--passage-step':cards.indexOf(card)} as CSSProperties}>
      <a href={`#encounter-remedy~words~${encodeURIComponent(card.act.key)}`} data-story-return="story-title" draggable={false} aria-label={`Read ${card.act.author}’s ${card.act.kind==='post'?'original post':'full comment'}${card.continued?' — continued passage':''}`}>
        <p className={styles.byline}>{card.act.author.toLowerCase()==='tidemark'?'Tidemark':card.act.author} · {date(card.act.occurred_at)}{card.act.kind==='post'?' · Post':card.continued?' · Continued':null}</p>
        <blockquote cite={card.act.url}>{card.text}</blockquote>
        {card===cards[cards.length-1]&&<ArrowUpRight className={styles.readMore} aria-hidden="true" />}
      </a>
    </section>)}</div>)}
  </div>;
}
