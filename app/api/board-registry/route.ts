import {env} from 'cloudflare:workers';
import {boardRegistryResponse} from '@/lib/board-registry.mjs';
export async function GET(request:Request){
  const policy='CONVERSATION_PRIVACY_POLICY' in env&&typeof env.CONVERSATION_PRIVACY_POLICY==='string'?env.CONVERSATION_PRIVACY_POLICY:undefined;
  const cache=await caches.open('board-registry-v1');
  return boardRegistryResponse(request,policy,fetch,cache);
}
