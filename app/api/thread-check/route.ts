import {fetchThreadSummary,compareThread,THREAD_IDS} from '@/lib/board-thread-check.mjs';
import baseline from '@/content/thread-check-baseline.json';

type Result = ReturnType<typeof compareThread> & {checked_at:string};
const recent = new Map<number,{expires:number,value:Result}>();
const pending = new Map<number,Promise<Result>>();
const reply = (body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){
  const params=new URL(request.url).searchParams;
  const id=Number(params.get('id'));
  if(params.size!==1 || !THREAD_IDS.includes(id) || params.get('id')!==String(id))return reply({error:'unsupported'},400);
  const prior=baseline.threads.find(thread=>thread.thread_id===id);
  if(!prior)return reply({error:'unsupported'},400);
  const cached=recent.get(id);
  if(cached && cached.expires>Date.now())return reply({...cached.value,reused:true});
  try{
    let job=pending.get(id);
    const reused=Boolean(job);
    if(!job){
      job=(async()=>{
        const current=await fetchThreadSummary(id);
        const value={...compareThread(current,prior),checked_at:new Date().toISOString()};
        recent.set(id,{expires:Date.now()+60000,value});
        return value;
      })();
      pending.set(id,job);
      void job.finally(()=>pending.delete(id)).catch(()=>{});
    }
    return reply({...await job,reused});
  }catch(error){
    // Fixed diagnostic categories only: no upstream body, URL, header or exception text.
    const e=error as {message?:string;cause?:{code?:string}};
    const category=['shape','unavailable','size','duplicate'].includes(e.message??'')?e.message:
      e.cause?.code==='ENOTFOUND'?'dns':e.cause?.code==='UNABLE_TO_VERIFY_LEAF_SIGNATURE'?'tls':
      e.message==='Illegal invocation'?'binding':'transport_or_runtime';
    return reply({error:'unavailable',category},503);
  }
}
