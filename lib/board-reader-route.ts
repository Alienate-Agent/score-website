export type BoardObject={kind:'post'|'comment';id:number};
export function boardObject(address:string):BoardObject|null{
  try{
    const url=new URL(address);
    const match=url.pathname.match(/^\/api\/(post|comment)\/([1-9]\d*)\/?$/);
    if(url.origin!=='https://1f916.ai'||url.username||url.password||url.search||!match)return null;
    const id=Number(match[2]);
    return Number.isSafeInteger(id)?{kind:match[1] as BoardObject['kind'],id}:null;
  }catch{return null;}
}
export const boardReaderHref=({kind,id}:BoardObject)=>`/board?kind=${kind}&id=${id}`;

/** Only actual board speech has a conversation route; seals/events stay archival. */
export function boardRecordHref(record:string):string|null{
  const match=record.match(/^[a-z0-9_-]+:(post|comment):([1-9]\d*)$/);
  if(!match||!Number.isSafeInteger(Number(match[2])))return null;
  return boardReaderHref({kind:match[1] as BoardObject['kind'],id:Number(match[2])});
}
