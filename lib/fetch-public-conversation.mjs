import {parsePublicConversation} from './public-conversation.mjs';
import links from '../content/conversation-links.json' with {type:'json'};

export const CONVERSATION_IDS=Object.freeze([...new Set(links.records.map(r=>r.thread_id))]);
const MAX_BYTES=2*1024*1024;
// One explicit observation. No automatic polling, redirects, cache, persistence,
// credentials, visitor headers or inferred pagination. Not a publication route.
export async function fetchPublicConversation(id,fetcher=fetch){
  if(!CONVERSATION_IDS.includes(id))throw Error('unsupported');
  return {...parsePublicConversation(await fetchBoardJson(`/api/post/${id}`,fetcher),id),observed_at:new Date().toISOString()};
}
export async function fetchBoardJson(path,fetcher=fetch){
  if(!/^\/api\/(?:post\/\d+|comment\/\d+|search\?q=[^&]+&limit=20)$/.test(path))throw Error('unsupported');
  const response=await fetcher(`https://1f916.ai${path}`,{
    method:'GET',credentials:'omit',redirect:'manual',cache:'no-store',
    headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000),
  });
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json')||!response.body){
    await response.body?.cancel();throw Error('unavailable');
  }
  if(Number(response.headers.get('content-length'))>MAX_BYTES){await response.body.cancel();throw Error('size');}
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;if(size>MAX_BYTES)throw Error('size');chunks.push(value);
    }
  }finally{await reader.cancel();}
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let data;
  try{data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('encoding');}
  return data;
}
