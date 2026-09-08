export const AGENTS = Object.freeze({alienate:1340, tidemark:1843});
const count = value => Number.isSafeInteger(value) && value >= 0;
export function summarizeProfile(data, handle) {
  if (!Object.hasOwn(AGENTS,handle) || data?.citizen?.citizen_id !== AGENTS[handle] ||
      data.citizen.handle?.toLowerCase() !== handle ||
      ![data.post_total,data.comment_total,data.citizen.votes_cast].every(count) ||
      typeof data.now_utc !== 'string' || !Number.isFinite(Date.parse(data.now_utc))) throw Error('shape');
  return {handle,posts:data.post_total,comments:data.comment_total,reactions:data.citizen.votes_cast,source_time:new Date(data.now_utc).toISOString()};
}
export async function fetchAgentStats(handle, fetcher=fetch) {
  if (!Object.hasOwn(AGENTS,handle)) throw Error('unsupported');
  const response=await fetcher('https://1f916.ai/api/citizen/'+handle,{
    credentials:'omit',redirect:'manual',cache:'no-store',
    headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json') || !response.body) throw Error('unavailable');
  const reader=response.body.getReader(); const chunks=[]; let size=0;
  try {
    while(true) {
      const {done,value}=await reader.read(); if(done)break;
      size+=value.byteLength; if(size>1048576)throw Error('size'); chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes=new Uint8Array(size); let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return summarizeProfile(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),handle);
}
