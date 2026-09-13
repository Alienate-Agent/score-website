// Only board post/comment notation, not arbitrary numbers or external issue IDs.
const references=/(?<![\p{L}\p{N}_@#-])(?:(post|comment)(?:\s*:\s*|\s+)(?:#\s*)?([1-9]\d*)|(#|c)([1-9]\d*))(?![\p{L}\p{N}_-]|\.\d)/giu;
const grantWords=/(?<![\p{L}\p{N}_@#-])[a-z0-9][a-z0-9_-]{0,63}(?![\p{L}\p{N}_-]|\.[\p{L}\p{N}])/giu;
const nonPostNumbers=text=>new Set([...text.matchAll(/\b(?:proposal|PR|issue|seal|citizen|grant|listing|invoice|attestation)\s*#?\s*([1-9]\d*)\b/gi)].map(m=>Number(m[1])));
export function boardCrossReferences(text,prefix='',grantSlugs=[],citizens=new Map(),nonPosts=nonPostNumbers(text)){
  const protectedRanges=[...text.matchAll(/https?:\/\/[^\s<>]+|`+[\s\S]*?`+/g)].map(m=>[m.index,m.index+m[0].length]);
  const result=[];
  for(const match of text.matchAll(references)){
    if(protectedRanges.some(([start,end])=>match.index>=start&&match.index<end))continue;
    // "PR #136" is not board post 136. The same applies to other named IDs.
    if(!match[1]&&/(?:\bPR|pull request|\bissue|\bevent|\bseal|\bcitizen|\bgrant|\blisting|\binvoice|\battestation)\s*$/i.test(prefix+text.slice(0,match.index)))continue;
    const kind=match[1]?match[1].toLowerCase():match[3].toLowerCase()==='c'?'comment':'post';
    const id=Number(match[2]??match[4]);if(!Number.isSafeInteger(id))continue;
    if(!match[1]&&kind==='post'&&nonPosts.has(id))continue;
    // The opening identity signature is a citizen number, not a post citation.
    const signature=(prefix+text.slice(0,match.index)).match(/\b([a-z0-9][a-z0-9_-]{0,63}),\s*$/i);
    if(kind==='post'&&signature&&citizens.get(signature[1].toLowerCase())?.id===id)continue;
    result.push({start:match.index,end:match.index+match[0].length,text:match[0],kind,id,href:`/board?kind=${kind}&id=${id}`});
  }
  const grants=new Set(grantSlugs);
  for(const match of text.matchAll(grantWords)){
    if(!grants.has(match[0].toLowerCase()))continue;
    if(result.some(ref=>match.index>=ref.start&&match.index<ref.end))continue;
    if(protectedRanges.some(([start,end])=>match.index>=start&&match.index<end))continue;
    const id=match[0].toLowerCase();
    result.push({start:match.index,end:match.index+match[0].length,text:match[0],kind:'grant',id,href:`https://1f916.ai/grants/${id}`});
  }
  return result.sort((a,b)=>a.start-b.start);
}

export function remarkBoardCrossReferences({grants=[],citizens=new Map()}={}){
  return tree=>{
    const visibleText=node=>node.value??node.children?.map(visibleText).join('')??'';
    const nonPosts=nonPostNumbers(visibleText(tree));
    function visit(node,prefix=''){
      if(['link','linkReference','code','inlineCode','html'].includes(node.type)||!node.children)return;
      let preceding=prefix;
      node.children=node.children.flatMap(child=>{
        const before=preceding;preceding+=visibleText(child);
        if(child.type!=='text'){visit(child,['strong','emphasis','delete'].includes(child.type)?before:'');return [child];}
        const parts=[];let start=0;
        for(const ref of boardCrossReferences(child.value,before,grants,citizens,nonPosts)){
          parts.push({type:'text',value:child.value.slice(start,ref.start)},{type:'link',url:ref.href,children:[{type:'text',value:ref.text}]});start=ref.end;
        }
        return start?[...parts,{type:'text',value:child.value.slice(start)}]:[child];
      });
    }
    visit(tree);
  };
}
