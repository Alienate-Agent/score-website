import archive from '@/public/records/dated-public-record-v1.json';
import later from '@/public/records/later-public-speech-2026-09-05.json';
import links from '@/content/conversation-links.json';
import {encounters,type Encounter,type EncounterAct} from './encounters';

export type ConversationCollection=Pick<Encounter,'title'|'post'|'comments'|'capturedAt'|'partial'>&{missingPost?:boolean};
const key=(a:EncounterAct)=>`${a.author.toLowerCase()}:${a.kind}:${a.id}`;
const acts=new Map<string,EncounterAct>();
for(const event of encounters)for(const act of [event.post,...event.comments])acts.set(key(act),act);
for(const r of archive.records){
  if((r.public_object_type!=='post'&&r.public_object_type!=='comment')||typeof r.exact_content?.body!=='string'||!r.occurred_at||typeof r.public_id!=='number'||typeof r.source_url!=='string')continue;
  if(!acts.has(r.act_key))acts.set(r.act_key,{key:`${r.public_object_type}:${r.public_id}`,id:r.public_id,kind:r.public_object_type,author:r.originator_role==='tidemark_citizen'?'Tidemark':'Alienate',title:r.exact_content.title??null,body:r.exact_content.body,body_sha256:r.exact_content.body_sha256??'',occurred_at:r.occurred_at,parent_id:null,url:r.source_url});
}
for(const r of later.records){
  if(r.public_object_type!=='post'&&r.public_object_type!=='comment')continue;
  if(!acts.has(r.act_key))acts.set(r.act_key,{key:`${r.public_object_type}:${r.public_id}`,id:r.public_id,kind:r.public_object_type,author:r.originator_role==='tidemark_citizen'?'Tidemark':'Alienate',title:r.title,body:r.body,body_sha256:r.body_sha256,occurred_at:r.occurred_at,parent_id:r.parent_comment_id,url:r.source_url});
}

export function conversationCollection(record:string):{event:ConversationCollection;selected:string}|null{
  record=record.toLowerCase();
  const existing=encounters.find(e=>[e.post,...e.comments].some(a=>key(a)===record));
  if(existing)return {event:existing,selected:acts.get(record)!.key};
  const origin=acts.get(record),link=links.records.find(r=>r.record===record);
  if(!origin||!link)return null;
  const members=links.records.filter(r=>r.thread_id===link.thread_id).flatMap(r=>acts.get(r.record)??[]);
  const knownPost=members.find(a=>a.kind==='post'&&a.id===link.thread_id);
  // The placeholder is visibly not a source quotation or invented post text.
  const post=knownPost??{key:`post:${link.thread_id}`,id:link.thread_id,kind:'post' as const,author:'Original post not preserved',title:null,body:'',body_sha256:'',occurred_at:link.verified_at,parent_id:null,url:`https://1f916.ai/api/post/${link.thread_id}`};
  const comments=members.filter(a=>a.kind==='comment').sort((a,b)=>a.occurred_at.localeCompare(b.occurred_at));
  return {selected:origin.key,event:{title:knownPost?.title??`Discussion containing ${origin.author}’s ${origin.kind} ${origin.id}`,post,comments,partial:true,missingPost:!knownPost,capturedAt:`Selected preserved acts · thread link checked ${link.verified_at.slice(0,10)}`}};
}
