import {createHash} from 'node:crypto';
const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function localPreview(request,env){return env.CORRESPONDENCE_LOCAL==='1'&&['127.0.0.1','localhost'].includes(new URL(request.url).hostname);}
export function correspondenceConfig(request,env){
 const local=localPreview(request,env);
 const enabled=!!env.CORRESPONDENCE&&!!env.CORRESPONDENCE_RATE&&(local||!!env.CORRESPONDENCE_TURNSTILE_SECRET&&!!env.CORRESPONDENCE_SITE_KEY);
 return reply(200,{enabled,local,siteKey:enabled&&!local?env.CORRESPONDENCE_SITE_KEY:null});
}
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('body');
 let bytes=0;const parts=[];
 while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>30000){await reader.cancel();throw Error('size');}parts.push(value);}
 const all=new Uint8Array(bytes);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.byteLength;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(all));
}
export function validCorrespondence(o,noticeVersion){
 if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join(',')!=='allowExcerpt,email,id,message,name,noticeVersion,subject,token,website')return false;
 return UUID.test(o.id)&&o.noticeVersion===noticeVersion&&o.allowExcerpt===true&&
  [['name',80],['email',254],['subject',160],['message',6000],['token',2048],['website',200]].every(([k,n])=>typeof o[k]==='string'&&o[k].length<=n&&!o[k].includes('\u0000'))&&
  !!o.message.trim()&&(!o.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email))&&
  !/[\r\n]/.test(o.name+o.email+o.subject);
}
export async function receiveCorrespondence(request,env,notice,verifyFetch=fetch){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply(403,{error:'Please send from the website form.'});
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply(415,{error:'Please use the website form.'});
 const local=localPreview(request,env);
 if(!env.CORRESPONDENCE||!env.CORRESPONDENCE_RATE||(!local&&(!env.CORRESPONDENCE_TURNSTILE_SECRET||!env.CORRESPONDENCE_SITE_KEY)))return reply(503,{error:'The form is temporarily unavailable. Please try again later.'});
 try {
  // Ephemeral edge key only: not saved in the correspondence or joined to analytics.
  const network=request.headers.get('CF-Connecting-IP')||'local';
  if(!(await env.CORRESPONDENCE_RATE.limit({key:network})).success)return reply(429,{error:'Please wait a minute before trying again.'});
 }catch{return reply(503,{error:'Please try again later.'});}
 let o;try{o=await readBody(request);}catch{return reply(400,{error:'The message could not be read. Please keep it under 6,000 characters.'});}
 if(!validCorrespondence(o,notice.version))return reply(400,{error:'Please check the fields and refresh if the form has changed.'});
 if(o.website)return reply(400,{error:'The message could not be accepted.'});
 const payload=createHash('sha256').update(JSON.stringify([o.name,o.email,o.subject,o.message,o.allowExcerpt,o.noticeVersion])).digest('hex');
 try {
  const prior=await env.CORRESPONDENCE.prepare('SELECT payload_hash FROM correspondence WHERE id=?').bind(o.id).first();
  if(prior)return prior.payload_hash===payload?reply(200,{ok:true,id:o.id,local}):reply(409,{error:'This submission changed after sending. Start a new message.'});
  if(!local){
   if(!o.token)return reply(400,{error:'Please complete the spam check.'});
   const result=await verifyFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'POST',body:new URLSearchParams({secret:env.CORRESPONDENCE_TURNSTILE_SECRET,response:o.token}),signal:AbortSignal.timeout(8000),
   });
   if(!result.ok)throw Error('verification');
   const v=await result.json();
   if(v.success!==true||v.hostname!==new URL(request.url).hostname||v.action!=='correspondence')return reply(400,{error:'The spam check expired or failed. Please try it again.'});
  }
  await env.CORRESPONDENCE.prepare(`INSERT INTO correspondence
   (id,received_at,name,email,subject,message,allow_excerpt,notice_version,notice_text,permission_text,payload_hash,local_preview)
   VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING`)
   .bind(o.id,new Date().toISOString(),o.name,o.email,o.subject,o.message,Number(o.allowExcerpt),notice.version,notice.text,notice.permission,payload,Number(local)).run();
  const saved=await env.CORRESPONDENCE.prepare('SELECT payload_hash FROM correspondence WHERE id=?').bind(o.id).first();
  if(saved?.payload_hash!==payload)return reply(409,{error:'This submission changed after sending. Start a new message.'});
  return reply(201,{ok:true,id:o.id,local});
 }catch{return reply(503,{error:'Your message could not be confirmed. It is still in the form; please retry.'});}
}
