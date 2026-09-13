'use client';
import {Fragment} from 'react';
import {boardCrossReferences} from '@/lib/board-cross-references.mjs';
import {BoardAgentMentions} from './board-agent-name';
import {useBoardRegistry} from './board-registry-provider';

/** Preserve the whitespace/layout of archival plain-text readers. */
export function BoardReferencedText({text}:{text:string}){
 const {grants,index}=useBoardRegistry();
  const parts=[];let start=0;
 for(const ref of boardCrossReferences(text,'',grants,index)){
    parts.push(<Fragment key={ref.start}><BoardAgentMentions text={text.slice(start,ref.start)}/><a className="board-cross-reference" href={ref.href} aria-label={`Read ${ref.kind} ${ref.id}`}>{ref.text}</a></Fragment>);
    start=ref.end;
  }
  return <>{parts}<BoardAgentMentions text={text.slice(start)}/></>;
}
