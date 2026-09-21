import {isCitizenHandle} from './citizen-handle.mjs';
import {fetchBoardJson} from './fetch-public-conversation.mjs';
import {validateConversationPolicy,createConversationRestrictionTest} from './conversation-display-policy.mjs';

const positive=n=>Number.isSafeInteger(n)&&n>0;

// Public discovery only. No visitor headers, credentials or arbitrary destinations.
// A complete census is required; never call its first 1,000 entries the registry.
export async function fetchBoardRegistry(policy,fetcher=fetch){
  const restricted=createConversationRestrictionTest(policy),visible=text=>!restricted(text);
  const deadline=AbortSignal.timeout(25000);
  const bounded=(url,options)=>fetcher(url,{...options,signal:AbortSignal.any([deadline,options.signal])});
  const citizens=[],seen=new Set();let since=0,complete=false;
  for(let page=0;page<10;page++){
    const d=await fetchBoardJson('/api/citizens'+(since?'?since='+since:''),bounded);
    if(!Array.isArray(d.citizens)||d.citizens.length>1000||typeof d.has_more!=='boolean'||!Number.isSafeInteger(d.total)||d.total<0||d.total>10000)throw Error('shape');
    for(const row of d.citizens){
      if(!positive(row.citizen_id)||typeof row.handle!=='string'||!positive(row.created_at)||row.created_at<=since)throw Error('shape');
      if(seen.has(row.citizen_id))throw Error('paging');seen.add(row.citizen_id);
      if(isCitizenHandle(row.handle)&&visible(row.handle))citizens.push({handle:row.handle,id:row.citizen_id});
    }
    if(!d.has_more){if(seen.size!==d.total)throw Error('incomplete');complete=true;break;}
    if(!positive(d.next_since)||d.next_since<=since||!d.citizens.length||d.next_since!==d.citizens.at(-1).created_at)throw Error('paging');
    since=d.next_since;
  }
  if(!complete)throw Error('incomplete');
  const d=await fetchBoardJson('/api/grants',bounded);
  if(!Array.isArray(d.grants)||d.grants.length>1000)throw Error('shape');
  const grants=d.grants.flatMap(row=>typeof row.slug==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/.test(row.slug)&&row.page==='/grants/'+row.slug&&visible(row.slug)?[row.slug]:[]);
  return {citizens,grants,observed_at:new Date().toISOString()};
}

/** @param {Cache|null} [cache] */
export async function boardRegistryResponse(request,privatePolicy,fetcher=fetch,cache=null){
  const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  if(request.method!=='GET'||new URL(request.url).search)return reply({error:'invalid-request'},400);
  let policy;try{policy=validateConversationPolicy(JSON.parse(privatePolicy));}catch{return reply({error:'unavailable'},503);}
  try{
    // Cache only sanitized discovery data, partitioned by the active privacy policy.
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(privatePolicy));
    const version=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const key=new Request(new URL('/__board-registry/v1/'+version,request.url));
    const cached=await cache?.match(key);
    if(cached)return new Response(cached.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    const data=await fetchBoardRegistry(policy,fetcher);
    if(cache)await cache.put(key,Response.json(data,{headers:{'Cache-Control':'public, max-age=300'}}));
    return reply(data);
  }catch{return reply({error:'unavailable'},502);}
}
