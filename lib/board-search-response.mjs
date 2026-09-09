import {fetchBoardJson} from './fetch-public-conversation.mjs';
import {parsePublicConversation} from './public-conversation.mjs';
import {validateConversationPolicy,prepareConversationDisplay} from './conversation-display-policy.mjs';
const validId=n=>Number.isSafeInteger(n)&&n>0;
export async function boardSearchResponse(request,privatePolicy,fetcher=fetch){
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 const p=new URL(request.url).searchParams;
 if(request.method!=='GET'||[...p.keys()].some(k=>!['q','kind','id'].includes(k)||p.getAll(k).length!==1))return reply({error:'invalid-request'},400);
 const q=p.get('q'),kind=p.get('kind'),id=Number(p.get('id'));
 const search=q!==null&&!kind&&!p.has('id')&&q.trim().length>=2&&q.length<=160;
 const lookup=q===null&&['post','comment'].includes(kind)&&/^\d+$/.test(p.get('id')??'')&&validId(id);
 if(!search&&!lookup)return reply({error:'invalid-request'},400);
 let policy;try{policy=validateConversationPolicy(JSON.parse(privatePolicy));}catch{return reply({error:'unavailable'},503);}
 try{
  if(search){
   const data=await fetchBoardJson(`/api/search?q=${encodeURIComponent(q.trim())}&limit=20`,fetcher);
   if(!Array.isArray(data.results)||data.results.length>20||typeof data.has_more!=='boolean'||!Number.isFinite(Date.parse(data.now_utc)))throw Error('shape');
   const results=data.results.map(r=>{
    if(!validId(r.id)||typeof r.author!=='string'||typeof r.title!=='string'||typeof r.snippet!=='string'||!Number.isFinite(r.created_at)||r.title.length>1000||r.snippet.length>16000)throw Error('shape');
    const post={key:`post:${r.id}`,id:r.id,kind:'post',author:r.author,title:r.title,body:r.snippet,occurred_at:new Date(r.created_at).toISOString(),parent_id:null,moderation:null,url:`https://1f916.ai/api/post/${r.id}`};
    const safe=prepareConversationDisplay({post,comments:[]},policy).post;
    return {id:safe.id,author:safe.author,title:safe.title,snippet:safe.body,date:safe.occurred_at,withheld:safe.withheld};
   });
   return reply({mode:'search',results,has_more:data.has_more,observed_at:new Date().toISOString(),source_time:data.now_utc});
  }
  let postId=id,directComment=null;
  if(kind==='comment'){
   const data=await fetchBoardJson(`/api/comment/${id}`,fetcher);
   if(data.comment?.id!==id||!validId(data.comment.post_id))throw Error('shape');
   postId=data.comment.post_id;
   directComment=data.comment;
  }
  const data=await fetchBoardJson(`/api/post/${postId}`,fetcher);
  let observation=parsePublicConversation(data,postId);
  if(directComment&&!observation.comments.some(row=>row.id===id)){
   // A thread window can omit the very comment the reader asked for. Include
   // the direct observation, using the same structural and concealment checks.
   // Do not exceed the bounded collection or claim this mixed return is whole.
   const comments=[...data.comments.slice(0,999),directComment].sort((a,b)=>a.created_at-b.created_at||a.id-b.id);
   const total=Math.max(data.comments_total,comments.length);
   observation=parsePublicConversation({...data,comments,comments_total:total,comments_returned:comments.length,has_more:total>comments.length},postId);
   observation.partial=true;
  }
  const safe=prepareConversationDisplay({...observation,observed_at:new Date().toISOString()},policy);
  return reply({mode:'conversation',selected:`${kind}:${id}`,conversation:safe});
 }catch{return reply({error:'unavailable'},502);}
}
