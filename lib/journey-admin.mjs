import {createHash, timingSafeEqual} from 'node:crypto';
import {UUID} from './journey-identity.mjs';
import {ready, journeyReport, setExclusion, setIPExclusion} from './journeys.mjs';
import {capacityStatus} from './journey-capacity.mjs';

const HEX=/^[0-9a-f]{64}$/;
const headers={'Cache-Control':'private, no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
const hash=value=>createHash('sha256').update(value).digest();
function windowOf(o) {
  if(!Number.isSafeInteger(o.from)||!Number.isSafeInteger(o.to)||o.from<0||o.to<=o.from||o.to-o.from>366*86400000)throw Error('window');
}
function keys(o,allowed) {if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!allowed.includes(k)))throw Error('fields');}
async function bodyOf(request) {
  const reader=request.body?.getReader();if(!reader)throw Error('body');
  let size=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw Error('size');}chunks.push(value);}
  const all=new Uint8Array(size);let at=0;for(const chunk of chunks){all.set(chunk,at);at+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(all));
}

export async function listSessions(db,o) {
  keys(o,['action','from','to','visitor','includeExcluded','after','area']);windowOf(o);
  const area=o.area||'';
  if(!['','studio'].includes(area))throw Error('area');
  const visitor=o.visitor||'',after=o.after||{at:Number.MAX_SAFE_INTEGER,id:'f'.repeat(64)};
  if((visitor&&!UUID.test(visitor))||typeof o.includeExcluded!=='boolean'||!Number.isSafeInteger(after.at)||!HEX.test(after.id))throw Error('filter');
  const result=await db.prepare(`SELECT s.*, v.self_tester,
    (SELECT COALESCE(SUM(active_ms),0) FROM journey_events e WHERE e.session_id=s.session_id) AS active_ms
    FROM journey_session_classification s JOIN journey_visitors v USING(visitor_id)
    WHERE EXISTS(SELECT 1 FROM journey_events e WHERE e.session_id=s.session_id AND e.received_at>=? AND e.received_at<? AND (?='' OR e.area=?))
    AND (?='' OR s.visitor_id=?) AND (?=1 OR s.excluded=0)
    AND (s.last_seen<? OR (s.last_seen=? AND s.session_id<?))
    ORDER BY s.last_seen DESC,s.session_id DESC LIMIT 51`)
    .bind(o.from,o.to,area,area,visitor,visitor,Number(o.includeExcluded),after.at,after.at,after.id).all();
  const rows=result.results.slice(0,50),last=rows.at(-1);
  return {rows,next:result.results.length>50?{at:last.last_seen,id:last.session_id}:null};
}
export async function sessionPath(db,o) {
  keys(o,['action','session','after']);if(!HEX.test(o.session||''))throw Error('session');
  const after=o.after||{at:0,page:'',seq:0};
  if(!Number.isSafeInteger(after.at)||!(after.page===''||UUID.test(after.page))||!Number.isSafeInteger(after.seq)||after.seq<0||after.seq>400)throw Error('cursor');
  const session=await db.prepare('SELECT s.*,v.self_tester FROM journey_session_classification s JOIN journey_visitors v USING(visitor_id) WHERE session_id=?').bind(o.session).first();
  if(!session)return {session:null,events:[],networks:[],filters:[],next:null};
  const result=await db.prepare(`SELECT event_id,page_id,sequence,received_at,client_at,action,area,target,active_ms,edition
    FROM journey_events WHERE session_id=? AND (received_at>? OR (received_at=? AND page_id>?) OR (received_at=? AND page_id=? AND sequence>?))
    ORDER BY received_at,page_id,sequence LIMIT 251`).bind(o.session,after.at,after.at,after.page,after.at,after.page,after.seq).all();
  const networks=await db.prepare('SELECT DISTINCT network_key FROM journey_events WHERE session_id=? AND network_key IS NOT NULL LIMIT 100').bind(o.session).all();
  const filters=await db.prepare(`SELECT x.* FROM journey_exclusions x WHERE x.enabled=1 AND
    ((x.kind='visitor' AND x.value=?) OR (x.kind='session' AND x.value=?) OR
    (x.kind='network' AND EXISTS(SELECT 1 FROM journey_events e WHERE e.session_id=? AND e.network_key=x.value))) LIMIT 200`)
    .bind(session.visitor_id,o.session,o.session).all();
  const events=result.results.slice(0,250),last=events.at(-1);
  return {session,events,networks:networks.results.map(n=>n.network_key),filters:filters.results,
    next:result.results.length>250?{at:last.received_at,page:last.page_id,seq:last.sequence}:null};
}
export async function handleJourneyAdmin(request,env) {
  // Only the private local operator bridge holds this separate bearer token.
  // No browser CORS, query credentials, public report page or arbitrary SQL.
  const supplied=request.headers.get('Authorization')||'';
  if(request.method!=='POST'||request.headers.has('Origin')||!HEX.test(env.JOURNEY_ADMIN_KEY||'')||supplied.length>100||
    !timingSafeEqual(hash(supplied),hash('Bearer '+env.JOURNEY_ADMIN_KEY)))return reply(404,{error:'Not found'});
  if(!env.JOURNEYS||!env.JOURNEY_RATE)return reply(503,{error:'Storage unavailable'});
  try{if(!(await env.JOURNEY_RATE.limit({key:'private-operator-v1'})).success)return reply(429,{error:'Please wait before refreshing'});}catch{return reply(503,{error:'Service unavailable'});}
  if(request.headers.get('Content-Type')!=='application/json')return reply(415,{error:'JSON required'});
  let o;try{o=await bodyOf(request);keys(o,['action','from','to','visitor','includeExcluded','after','session','kind','value','reason','enabled','paused','area']);}catch{return reply(400,{error:'Invalid request'});}
  try {
    const db=env.JOURNEYS;
    if(o.action==='overview') {
      keys(o,['action','from','to']);windowOf(o);
      const summary=await journeyReport(db,o);
      const actions=await db.prepare(`SELECT e.action,COUNT(*) AS events,COUNT(DISTINCT e.session_id) AS sessions
        FROM journey_events e JOIN journey_session_classification s USING(session_id,visitor_id)
        WHERE e.received_at>=? AND e.received_at<? AND s.excluded=0 GROUP BY e.action ORDER BY events DESC`).bind(o.from,o.to).all();
      const studio=await db.prepare(`SELECT CASE WHEN e.action='town_step' THEN 'studio-town' ELSE e.target END AS target,COUNT(DISTINCT e.session_id) AS sessions,
        SUM(CASE WHEN e.action='view' THEN 1 ELSE 0 END) AS views,
        SUM(CASE WHEN e.action='source_open' THEN 1 ELSE 0 END) AS opens,
        SUM(e.active_ms) AS active_ms
        ,SUM(CASE WHEN e.action='town_step' THEN 1 ELSE 0 END) AS steps
        FROM journey_events e JOIN journey_session_classification s USING(session_id,visitor_id)
        WHERE e.received_at>=? AND e.received_at<? AND s.excluded=0 AND e.area='studio'
        GROUP BY CASE WHEN e.action='town_step' THEN 'studio-town' ELSE e.target END ORDER BY sessions DESC,target LIMIT 20`).bind(o.from,o.to).all();
      return reply(200,{at:Date.now(),configured:ready(env),capacity:await capacityStatus(db),summary,actions:actions.results,studio:studio.results,townInteractionReporting:true});
    }
    if(o.action==='sessions')return reply(200,await listSessions(db,o));
    if(o.action==='session')return reply(200,await sessionPath(db,o));
    if(o.action==='exclusions') {
      keys(o,['action']);const result=await db.prepare('SELECT * FROM journey_exclusions ORDER BY updated_at DESC LIMIT 201').all();
      return reply(200,{rows:result.results.slice(0,200),more:result.results.length>200});
    }
    if(o.action==='exclude') {
      keys(o,['action','kind','value','reason','enabled']);
      if(o.kind==='ip')await setIPExclusion(db,env.JOURNEY_KEY,o.value,{reason:o.reason,enabled:o.enabled});
      else await setExclusion(db,o);
      return reply(200,{ok:true});
    }
    if(o.action==='pause') {
      keys(o,['action','paused']);if(typeof o.paused!=='boolean')throw Error('pause');
      await db.prepare('UPDATE journey_capacity SET paused=? WHERE id=1').bind(Number(o.paused)).run();
      return reply(200,{ok:true,capacity:await capacityStatus(db)});
    }
    return reply(400,{error:'Unknown action'});
  }catch{return reply(400,{error:'Request could not be completed. No data is returned.'});}
}
