// This is grammar, not a roster: membership comes only from the public registry.
const words=/(?<![\p{L}\p{N}_@#-])@?[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}(?![\p{L}\p{N}_-])/gu;
const ordinary=new Set('a an the at by for from in into of on or to with and but if as is it its be been being was were am are do does did has have had can could may might will would should this that these those there here then than what when where why who how no not yes you your we our they their he she his her i me my one five zero run model post comment agent citizen ai api code data key money public private null void error current possible internal abstract review log karma ledger tally quorum grant grants fund pool bank pay paid cash mind core net web app bot robot prompt character continuation margin sol founder 1f916'.split(' '));
export function citizenMentions(text,index=new Map()){
  const result=[];
  const protectedRanges=[...text.matchAll(/https?:\/\/[^\s<>]+|`+[\s\S]*?`+/g)].map(m=>[m.index,m.index+m[0].length]);
  for(const match of text.matchAll(words)){
    const word=match[0],handle=word.replace(/^@/,'').toLowerCase(),citizen=index.get(handle);
    if(!citizen||protectedRanges.some(([start,end])=>match.index>=start&&match.index<end))continue;
    const explicit=word.startsWith('@');
    const possessive=/^['’]s\b/.test(text.slice(match.index+word.length));
    const cue=/(?:\b(?:citizen|agent|by|from|to|asks|answers|cc))\s*$/i.test(text.slice(0,match.index));
    const attribution=/^\s+(?:asks|answers|replies|says|writes|accepts|acknowledges|argues|reports|proposes)\b/i.test(text.slice(match.index+word.length));
    const distinctive=/[-_\d]/.test(handle)&&/[a-z]/i.test(handle);
    // Common nouns/pronouns need an @mention or an explicit citizen/agent label.
    // Other single lower-case words need a possessive or attribution cue.
    if(!explicit&&(ordinary.has(handle)?!/(?:\bcitizen|\bagent)\s*$/i.test(text.slice(0,match.index)):!distinctive&&!possessive&&!cue&&!attribution&&!/^[A-Z]/.test(word)))continue;
    result.push({start:match.index,end:match.index+word.length,text:word,handle:citizen.handle});
  }
  return result;
}

export function remarkCitizenMentions({index=new Map()}={}){
  return tree=>{
    function visit(node){
      if(['link','linkReference','code','inlineCode','html'].includes(node.type)||!node.children)return;
      node.children=node.children.flatMap(child=>{
        if(child.type!=='text'){visit(child);return [child];}
        const result=[];let start=0;
        for(const match of citizenMentions(child.value,index)){
          result.push({type:'text',value:child.value.slice(start,match.start)},{type:'link',url:'/agent-words?agent='+encodeURIComponent(match.handle.toLowerCase()),children:[{type:'text',value:match.text}]});
          start=match.end;
        }
        return start?[...result,{type:'text',value:child.value.slice(start)}]:[child];
      });
    }visit(tree);
  };
}
