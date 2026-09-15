import {matchingRanges} from '@/lib/search-excerpt';

/** Preserve the supplied source text; highlight using the site search matcher. */
export function SearchHighlight({text,query}:{text:string;query:string}){
 const parts=[];let cursor=0;
 for(const {start,end} of matchingRanges(text,query)){
  if(start>cursor)parts.push(<span key={`plain-${cursor}`}>{text.slice(cursor,start)}</span>);
  parts.push(<mark key={`match-${start}`}>{text.slice(start,end)}</mark>);cursor=end;
 }
 if(cursor<text.length)parts.push(<span key={`plain-${cursor}`}>{text.slice(cursor)}</span>);
 return <>{parts}</>;
}
