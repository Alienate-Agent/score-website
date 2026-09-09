/** Highlight offsets always refer to the original source, never a rewritten
 * lowercase/accent-stripped quotation. A ligature may occupy several search
 * characters while remaining one original grapheme. */
const graphemes=new Intl.Segmenter(undefined,{granularity:'grapheme'});
type Range={start:number;end:number};
export type ExcerptPart={text:string;match:boolean};
function indexed(value:string){
  let text='';const offsets:Range[]=[];
  for(const {segment,index} of graphemes.segment(value)){
    const folded=segment.normalize('NFKD').replace(/\p{M}/gu,'');
    for(const character of folded){
      const letter=/[\p{L}\p{N}]/u.test(character)?character:' ';
      if(letter===' '&&text.endsWith(' ')){offsets[offsets.length-1].end=index+segment.length;continue;}
      text+=letter;
      for(let i=0;i<letter.length;i++)offsets.push({start:index,end:index+segment.length});
    }
  }
  // Lowercase the whole phrase so contextual casing (such as final sigma)
  // agrees with the search index, rather than lowercasing each glyph alone.
  return {text:text.toLowerCase(),offsets};
}
export function searchTerms(query:string){return [...new Set(indexed(query).text.trim().split(/\s+/).filter(Boolean))];}
export function matchingRanges(value:string,query:string):Range[]{
  const {text,offsets}=indexed(value),ranges:Range[]=[];
  for(const term of searchTerms(query)){
    for(let at=text.indexOf(term);at!==-1;at=text.indexOf(term,at+1)){
      ranges.push({start:offsets[at].start,end:offsets[at+term.length-1].end});
    }
  }
  const merged:Range[]=[];
  for(const range of ranges.sort((a,b)=>a.start-b.start||a.end-b.end)){
    const prior=merged.at(-1);
    if(prior&&range.start<=prior.end)prior.end=Math.max(prior.end,range.end);
    else merged.push({...range});
  }
  return merged;
}
export function searchExcerpt(body:string,query:string,budget=260){
  const ranges=matchingRanges(body,query);
  const first=ranges[0];
  let start=first?Math.max(0,first.start-65):0;
  // Prefer a word boundary without making a tiny beginning of a word disappear.
  if(start){const space=body.lastIndexOf(' ',start);if(space>=start-30)start=space+1;}
  let end=Math.min(body.length,Math.max(start+budget,first?.end??0));
  if(end<body.length){const space=body.lastIndexOf(' ',end);if(space>end-30&&space>(first?.end??0))end=space;}
  // Do not cut a surrogate pair, combining sequence, or joined emoji.
  const boundaries=[...graphemes.segment(body)].map(s=>s.index).concat(body.length);
  start=boundaries.findLast(n=>n<=start)??0;
  end=boundaries.find(n=>n>=end)??body.length;
  const parts:ExcerptPart[]=[];let cursor=start;
  for(const range of ranges.filter(r=>r.end>start&&r.start<end)){
    const a=Math.max(start,range.start),b=Math.min(end,range.end);
    if(a>cursor)parts.push({text:body.slice(cursor,a),match:false});
    parts.push({text:body.slice(a,b),match:true});cursor=b;
  }
  if(cursor<end)parts.push({text:body.slice(cursor,end),match:false});
  return {parts,start,end,before:start>0,after:end<body.length,bodyMatched:ranges.length>0};
}
export function matchedFields(record:{key:string;author:string;title:string;date:string|null;subjects:string;originalTitle:boolean},query:string){
  const fields:[string,string][]=[['record number',record.key],['speaker',record.author],
    [record.originalTitle?'original title':'site description',record.title],['date',record.date??''],['site subject',record.subjects]];
  return fields.filter(([,text])=>matchingRanges(text,query).length).map(([label])=>label);
}
