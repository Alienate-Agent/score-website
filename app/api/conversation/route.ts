import {env} from 'cloudflare:workers';
import {conversationResponse} from '@/lib/conversation-response.mjs';

export async function GET(request:Request){
  // Optional until separately configured as a server-only secret. Absent means
  // no upstream request and no fresh text, never an unfiltered fallback.
  const policy='CONVERSATION_PRIVACY_POLICY' in env&&typeof env.CONVERSATION_PRIVACY_POLICY==='string'?env.CONVERSATION_PRIVACY_POLICY:undefined;
  return conversationResponse(request,policy);
}
