import {CONVERSATION_IDS,fetchPublicConversation} from './fetch-public-conversation.mjs';
import {validateConversationPolicy,prepareConversationDisplay} from './conversation-display-policy.mjs';

export async function conversationResponse(request,privatePolicy,fetcher=fetch){
  const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  const url=new URL(request.url),raw=url.searchParams.get('id');
  if(request.method!=='GET'||[...url.searchParams.keys()].some(k=>k!=='id')||url.searchParams.getAll('id').length!==1||!raw||!/^\d+$/.test(raw)||!CONVERSATION_IDS.includes(Number(raw)))return reply({error:'unsupported'},400);
  let policy;
  try{policy=validateConversationPolicy(JSON.parse(privatePolicy));}
  catch{return reply({error:'refresh-unavailable'},503);}
  try{return reply(prepareConversationDisplay(await fetchPublicConversation(Number(raw),fetcher),policy));}
  catch{return reply({error:'refresh-unavailable'},502);}
}
