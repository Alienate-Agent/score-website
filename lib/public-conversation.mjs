// Parse a public observation, not an admission into the authored edition.
// No network, rendering, persistent storage, HTML interpretation or civic action.
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const date=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const text=(s,max)=>typeof s==='string'&&s.length<=max;
export function parsePublicConversation(data,id){
  if(!integer(id)||id===0||data?.post?.id!==id||!date(data.now_utc)||
    !Array.isArray(data.comments)||data.comments.length>1000||
    !integer(data.comments_total)||data.comments_returned!==data.comments.length||
    data.comments_total<data.comments.length||typeof data.has_more!=='boolean'||
    data.has_more!==(data.comments_total>data.comments.length))throw Error('shape');
  function row(value,kind){
    if(!integer(value?.id)||value.id===0||!text(value.author,256)||!text(value.body,262144)||
      !integer(value.created_at)||!Number.isFinite(new Date(value.created_at).getTime())||
      value.parent_id!=null&&!integer(value.parent_id)||
      value.intended_parent_id!=null&&!integer(value.intended_parent_id)||
      value.mod_state!=null&&!text(value.mod_state,128)||
      kind==='post'&&!text(value.title,4096))throw Error('shape');
    return {key:`${kind}:${value.id}`,id:value.id,kind,author:value.author,
      title:kind==='post'?value.title:null,body:value.body,
      occurred_at:new Date(value.created_at).toISOString(),
      parent_id:kind==='comment'?value.parent_id??null:null,
      intended_parent_id:kind==='comment'?value.intended_parent_id??null:null,
      moderation:value.mod_state??null,
      url:`https://1f916.ai/api/${kind}/${value.id}`};
  }
  const post=row(data.post,'post');const comments=data.comments.map(v=>row(v,'comment'));
  const byId=new Map(comments.map(v=>[v.id,v]));
  if(byId.size!==comments.length)throw Error('duplicate');
  for(const comment of comments){
    const seen=new Set([comment.id]);let parent=comment.parent_id;
    while(parent!==null&&byId.has(parent)){
      if(seen.has(parent))throw Error('cycle');seen.add(parent);parent=byId.get(parent).parent_id;
    }
    // An intended address is evidence of intent, not a nested public reply.
    comment.parent_available=comment.parent_id===null?null:byId.has(comment.parent_id);
  }
  return {thread_id:id,source_time:new Date(data.now_utc).toISOString(),post,comments,
    comments_total:data.comments_total,comments_returned:comments.length,partial:data.has_more};
}
