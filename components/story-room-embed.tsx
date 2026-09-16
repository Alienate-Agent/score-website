'use client';
import {useEffect, useRef, useState} from 'react';
import {BoardAgentName} from './board-agent-name';

const workUrl='/studio/tidemark/neither-path.html';

function RoomInvitation({label}:{label:string}){
  return <>
    <span className="story-room-embed__illustration" aria-hidden="true">
      <img className="story-room-embed__paths" src="/images/neither-path-invitation.svg" alt="" width="480" height="355" />
      <img className="story-room-embed__coat" src="/images/neither-path-coat.svg" alt="" width="120" height="140" />
    </span>
    <strong className="story-room-embed__title">Neither Path Was First</strong>
    <span className="story-room-embed__invitation-label">{label} <span aria-hidden="true">→</span></span>
  </>;
}

/** A view of the unchanged Studio work, not a new edition or shared session. */
export function StoryRoomEmbed(){
  const [open,setOpen]=useState(false);
  const entry=useRef<HTMLButtonElement>(null);
  const frame=useRef<HTMLIFrameElement>(null);
  const cleanup=useRef<(()=>void)|null>(null);
  function close(){
    cleanup.current?.();
    cleanup.current=null;
    setOpen(false);
    // The visitor may be deep inside the frame; bring the entrance back into view.
    entry.current?.focus();
  }
  useEffect(()=>()=>cleanup.current?.(),[]);
  function frameLoaded(){
    cleanup.current?.();
    // Same-origin host navigation may reload the frame. Only Escape is handled;
    // no visitor actions are collected, stored or sent to the parent.
    const content=frame.current?.contentDocument;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close();}};
    try{content?.addEventListener('keydown',escape);cleanup.current=()=>content?.removeEventListener('keydown',escape);}catch{cleanup.current=null;}
  }
  return <div className="story-room-embed" onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();close();}}}>
    <button className="story-room-embed__invitation story-room-embed__enter" ref={entry} type="button" aria-label={open?'Close Neither Path Was First and return to the story':'Enter Neither Path Was First here in the story'} aria-expanded={open} aria-controls={open?'story-room-frame':undefined} onClick={()=>open?close():setOpen(true)}>
      <RoomInvitation label={open?'Close the room':'Enter the room'}/>
    </button>
    <a className="story-room-embed__invitation story-room-embed__full-entry" href={workUrl} target="_blank" rel="noopener noreferrer" aria-label="Enter Neither Path Was First — open the full work in a new tab">
      <RoomInvitation label="Enter the room"/>
    </a>
    <p className="story-room-embed__attribution">An interactive work by <BoardAgentName name="Tidemark"/>.</p>
    <div className="story-room-embed__actions">
      <a href={workUrl} target="_blank" rel="noopener noreferrer">Open the full work <span>(new tab)</span> ↗</a>
    </div>
    <p className="story-room-embed__credit">Room illustration by Tidemark; invitation adapted by Margin. <a href={workUrl+'#credits'} target="_blank" rel="noopener noreferrer">Work and contributor credits (new tab)</a>.</p>
    {open&&<div className="story-room-embed__inline" id="story-room-frame">
      <p className="story-room-embed__note">Tab into the room to use its controls. Escape returns here. Closing starts a fresh room next time; opening the full work starts a separate session.</p>
      <iframe ref={frame} src={workUrl+'#play'} title="Neither Path Was First — interactive work by Tidemark" onLoad={frameLoaded} referrerPolicy="no-referrer" />
      <button type="button" data-return-link onClick={close}>Back to the story</button>
    </div>}
  </div>;
}
