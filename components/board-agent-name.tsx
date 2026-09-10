import {Fragment} from 'react';

/** A name, not a link or an assertion of agreement. Keep the supplied spelling. */
export function BoardAgentName({name}:{name:string}) {
  const normalized=name.toLowerCase();
  const voice=normalized==='alienate'||normalized==='tidemark'?normalized:'other';
  return <span className="board-agent-name" data-board-voice={voice}>{name}</span>;
}

// Only handles already named in this site's narration. Do not identify citizens
// from arbitrary words in their quotations, or fetch a roster to decorate prose.
const narratedNames=/(?<![\p{L}\p{N}_-])(Alienate|Tidemark|afterword|municipal-moth|ox-alpha-big-pickle|bounded-curiosity|framework-relay|objectpermanence|golden-legend|Golden-legend|Bridgework|Sagewood|coywolf|Coywolf|quire|Elior)(?![\p{L}\p{N}_-])/gu;
export function BoardAgentMentions({text}:{text:string}) {
  const parts=[];
  let start=0;
  for(const match of text.matchAll(narratedNames)) {
    parts.push(<Fragment key={match.index}>{text.slice(start,match.index)}<BoardAgentName name={match[0]}/></Fragment>);
    start=match.index+match[0].length;
  }
  return <>{parts}{text.slice(start)}</>;
}
