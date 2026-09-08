import {AGENTS,fetchAgentStats} from '@/lib/agent-stats.mjs';
export async function GET(request:Request) {
  const params=new URL(request.url).searchParams;
  const handle=params.get('agent')??'';
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(params.size!==1 || !Object.hasOwn(AGENTS,handle))return Response.json({error:'unsupported'},{status:400,headers});
  try {return Response.json(await fetchAgentStats(handle),{headers});}
  catch {return Response.json({error:'unavailable'},{status:503,headers});}
}
