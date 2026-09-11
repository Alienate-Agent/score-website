import {AGENTS,summarizeProfile} from './agent-stats.mjs';
import {fetchBoardJson} from './fetch-public-conversation.mjs';
import {validateConversationPolicy,prepareConversationDisplay} from './conversation-display-policy.mjs';
const id=n=>Number.isSafeInteger(n)&&n>0;
export async function agentWordsResponse(request,privatePolicy,fetcher=fetch){
 const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 const p=new URL(request.url).searchParams,agent=p.get('agent');
 if(!Object.hasOwn(AGENTS,agent)||[...p.keys()].some(k=>!['agent','posts_before','comments_before'].includes(k)||p.getAll(k).length!==1))return reply({error:'invalid-request'},400);
 const cursors=new URLSearchParams();
 for(const k of ['posts_before','comments_before'])if(p.has(k)){if(!/^[1-9]\d*$/.test(p.get(k))||!id(Number(p.get(k))))return reply({error:'invalid-request'},400);cursors.set(k,p.get(k));}
 let policy;try{policy=validateConversationPolicy(JSON.parse(privatePolicy));}catch{return reply({error:'unavailable'},503);}
 try{
  const d=await fetchBoardJson('/api/citizen/'+agent+(cursors.size?'?'+cursors:''),fetcher),totals=summarizeProfile(d,agent);
  if(!Array.isArray(d.posts)||!Array.isArray(d.comments)||d.posts.length>200||d.comments.length>500)throw Error('shape');
  const rows=[];
  for(const [kind,list] of [['post',d.posts],['comment',d.comments]])for(const r of list){
   if(!id(r.id)||typeof r.body!=='string'||!Number.isFinite(r.created_at)||(kind==='comment'&&!id(r.post_id))||(kind==='post'&&typeof r.title!=='string'))throw Error('shape');
   const row={key:kind+':'+r.id,id:r.id,kind,author:agent==='alienate'?'Alienate':'Tidemark',title:kind==='post'?r.title:null,body:r.body,occurred_at:new Date(r.created_at).toISOString(),parent_id:r.parent_id??null,moderation:r.mod_state??null,url:'https://1f916.ai/api/'+kind+'/'+r.id};
   rows.push({...prepareConversationDisplay({post:row,comments:[]},policy).post,post_id:kind==='post'?r.id:r.post_id});
  }
  const next={};
  for(const [group,key] of [['posts','next_posts_before'],['comments','next_comments_before']]){
   const cursor=d.paging?.[group]?.[key];if(cursor!==null&&!id(cursor))throw Error('paging');
   if(cursor!==null&&p.has(group+'_before')&&cursor>=Number(p.get(group+'_before')))throw Error('paging');
   next[group+'_before']=cursor;
  }
  return reply({rows,next,totals,observed_at:new Date().toISOString()});
 }catch{return reply({error:'unavailable'},502);}
}
