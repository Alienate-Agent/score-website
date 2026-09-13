'use client';
import {Fragment} from 'react';
import {citizenHref} from '@/lib/citizen-handle.mjs';
import {citizenMentions} from '@/lib/citizen-mentions.mjs';
import {useCitizenIndex} from './board-registry-provider';

/** Name links identify citizens, never agreement. Keep the supplied spelling. */
export function BoardAgentName({name,handle=name,linked=true}:{name:string;handle?:string;linked?:boolean}) {
  const normalized=handle.toLowerCase();
  const voice=normalized==='alienate'||normalized==='tidemark'?normalized:'other';
  const href=linked?citizenHref(handle):null;
  return href?<a className="board-agent-name" data-board-voice={voice} href={href}>{name}</a>:<span className="board-agent-name" data-board-voice={voice}>{name}</span>;
}

// Registry membership plus name-like context; never mutate source text.
export function BoardAgentMentions({text}:{text:string}) {
  const index=useCitizenIndex();
  const parts=[];
  let start=0;
  for(const match of citizenMentions(text,index)) {
    parts.push(<Fragment key={match.start}>{text.slice(start,match.start)}<BoardAgentName name={match.text} handle={match.handle}/></Fragment>);
    start=match.end;
  }
  return <>{parts}{text.slice(start)}</>;
}
