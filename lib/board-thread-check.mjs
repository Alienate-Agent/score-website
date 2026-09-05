// Public, fixed-destination, metadata-only observation. Never forward upstream text.
export const THREAD_IDS = [3734, 3581];
const MAX_BYTES = 524288;
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))).map(b=>b.toString(16).padStart(2,'0')).join('');
const date = value => typeof value==='string' && Number.isFinite(Date.parse(value));
const integer = value => Number.isSafeInteger(value) && value>=0;
export async function summarizeThread(data,id){
  if(!THREAD_IDS.includes(id) || !data || data.post?.id!==id || !Array.isArray(data.comments) || !integer(data.comments_total) || data.comments_returned!==data.comments.length || data.comments_total<data.comments.length || typeof data.has_more!=='boolean' || data.has_more!==(data.comments_total>data.comments.length) || !date(data.now_utc))throw Error('shape');
  const content = row => {
    if(!integer(row?.id) || typeof row.title!=='undefined' && typeof row.title!=='string' || typeof row.body!=='string' || typeof row.author!=='string' || !integer(row.created_at) || !Number.isFinite(new Date(row.created_at).getTime()) || row.parent_id!=null && !integer(row.parent_id))throw Error('shape');
    return {id:row.id,title:row.title??null,body:row.body,author:row.author,created_at:row.created_at,parent_id:row.parent_id??null};
  };
  if(new Set(data.comments.map(row=>row.id)).size!==data.comments.length)throw Error('duplicate');
  const comments=data.comments.map(content).sort((a,b)=>a.id-b.id);
  return {thread_id:id,source_time:new Date(data.now_utc).toISOString(),comments_total:data.comments_total,comments_returned:comments.length,partial:data.has_more,text_fingerprint:await hash({post:content(data.post),comments})};
}
export async function fetchThreadSummary(id,fetcher=fetch){
  if(!THREAD_IDS.includes(id))throw Error('unsupported');
  const response=await fetcher('https://1f916.ai/api/post/'+id,{method:'GET',credentials:'omit',redirect:'manual',cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!response.ok || !response.headers.get('content-type')?.includes('application/json'))throw Error('unavailable');
  if(Number(response.headers.get('content-length'))>MAX_BYTES || !response.body)throw Error('size');
  const reader=response.body.getReader();const chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw Error('size');chunks.push(value);}}finally{await reader.cancel();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return summarizeThread(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),id);
}
export function compareThread(current,baseline){
  return {thread_id:current.thread_id,source_time:current.source_time,comments_total:current.comments_total,comments_returned:current.comments_returned,partial:current.partial,baseline_time:baseline.source_time,text_changed:current.text_fingerprint!==baseline.text_fingerprint,count_changed:current.comments_total!==baseline.comments_total};
}
