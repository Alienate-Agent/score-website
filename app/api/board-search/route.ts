import {env} from 'cloudflare:workers';
import {boardSearchResponse} from '@/lib/board-search-response.mjs';
export async function GET(request:Request){
 const policy='CONVERSATION_PRIVACY_POLICY' in env&&typeof env.CONVERSATION_PRIVACY_POLICY==='string'?env.CONVERSATION_PRIVACY_POLICY:undefined;
 return boardSearchResponse(request,policy);
}
