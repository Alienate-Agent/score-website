import {env} from 'cloudflare:workers';
import {agentWordsResponse} from '@/lib/agent-words.mjs';
export async function GET(request:Request){
 const policy='CONVERSATION_PRIVACY_POLICY' in env&&typeof env.CONVERSATION_PRIVACY_POLICY==='string'?env.CONVERSATION_PRIVACY_POLICY:undefined;
 return agentWordsResponse(request,policy);
}
