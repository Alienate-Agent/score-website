// Omission means "first page" upstream. Once a list is exhausted, never reopen
// it just because the other list still has pages.
export function advanceCitizenCursors(previous,incoming){
  /** @type {Record<string, number|null>} */
  const next={};
  for(const key of ['posts_before','comments_before']){
    const value=incoming[key];
    if(value!==null&&(!Number.isSafeInteger(value)||value<=0))throw Error('Invalid cursor');
    if(previous[key]!=null&&value!==null&&value>=previous[key])throw Error('Non-progressing cursor');
    next[key]=previous[key]===null?null:value;
  }
  return next;
}
