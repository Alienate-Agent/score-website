import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {testDatabase,testJourneyGuards} from './journey-test-db.mjs';
import {handleJourneyAdmin,listSessions,sessionPath} from '../lib/journey-admin.mjs';
import {ingestJourney} from '../lib/journeys.mjs';
const db=testDatabase(),now=Date.now(),origin='https://score-website.alienate-agent.workers.dev';
const env={JOURNEYS:db,JOURNEY_KEY:randomBytes(32).toString('hex'),JOURNEY_ADMIN_KEY:randomBytes(32).toString('hex'),JOURNEYS_ENABLED:'1',JOURNEY_EDITION:'abc12345',...testJourneyGuards(db,now)};
const request=(body,headers={})=>new Request(origin+'/api/journey-admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.JOURNEY_ADMIN_KEY,...headers},body:JSON.stringify(body)});
const call=async body=>{const r=await handleJourneyAdmin(request(body),env);assert.equal(r.status,200,await r.clone().text());return r.json();};
const win={from:now-86400000,to:now+86400000};
try {
  const before=db.sqlite.prepare('SELECT COUNT(*) n FROM journey_events').get().n;
  for(const header of [{Authorization:''},{Authorization:'Bearer wrong'},{Origin:origin}])assert.equal((await handleJourneyAdmin(request({action:'overview',...win},header),env)).status,404);
  assert.equal((await handleJourneyAdmin(request({action:'overview',...win}),{...env,JOURNEY_ADMIN_KEY:''})).status,404);
  assert.equal((await handleJourneyAdmin(new Request(origin+'/api/journey-admin'),env)).status,404);
  assert.equal((await handleJourneyAdmin(request({action:'overview',...win,padding:'a'.repeat(5000)}),env)).status,400);
  assert.equal((await handleJourneyAdmin(request({action:'sql',sql:'DELETE FROM journey_events'}),env)).status,400);
  assert.equal((await handleJourneyAdmin(request({action:'overview',from:0,to:Date.now()}),env)).status,400);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM journey_events').get().n,before);
  let cookie;
  for(let visit=0;visit<2;visit++) {
    const payload={version:2,session:crypto.randomUUID(),page:crypto.randomUUID(),tester:false,testerAt:0,
      events:Array.from({length:12},(_,i)=>({seq:i+1,at:now,action:i===0?'view':'section',area:'story',target:'story-beginning',activeMs:0}))};
    const r=await ingestJourney(new Request(origin+'/api/journeys',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.8',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(payload)}),env,now);
    assert.equal(r.status,204);cookie ||=r.headers.get('Set-Cookie').split(';')[0];
  }
  const report=await call({action:'overview',...win});assert.equal(report.summary.included_browsers,1);assert.equal(report.summary.included_sessions,2);
  const sessions=await call({action:'sessions',...win,includeExcluded:false});assert.equal(sessions.rows.length,2);
  const id=sessions.rows[0].session_id,v=sessions.rows[0].visitor_id;
  const path=await call({action:'session',session:id});assert.deepEqual(path.events.map(e=>e.sequence),Array.from({length:12},(_,i)=>i+1));
  assert(!JSON.stringify(path.events).includes('network_key'));assert.equal(path.networks.length,1);
  assert.equal((await listSessions(db,{...win,includeExcluded:true,after:{at:sessions.rows[0].last_seen,id}})).rows.length,1);
  assert.equal((await sessionPath(db,{session:id,after:{at:path.events[5].received_at,page:path.events[5].page_id,seq:6}})).events[0].sequence,7);
  for(const [kind,value,expected] of [['session',id,1],['visitor',v,2],['ip','203.0.113.8',2]]) {
    await call({action:'exclude',kind,value,enabled:true,reason:'tester'});
    assert.equal((await call({action:'overview',...win})).summary.excluded_sessions,expected);
    await call({action:'exclude',kind,value,enabled:false,reason:'tester'});
    assert.equal((await call({action:'overview',...win})).summary.excluded_sessions,0);
  }
  assert.equal((await call({action:'exclusions'})).rows.length,3);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM journey_exclusion_history').get().n,6);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM journey_events').get().n,24);
  await call({action:'pause',paused:true});assert.equal((await call({action:'overview',...win})).capacity.reason,'paused');
  await call({action:'pause',paused:false});assert.equal((await call({action:'overview',...win})).capacity.collecting,true);
  assert.equal((await handleJourneyAdmin(request({action:'overview',...win}),{...env,JOURNEY_RATE:{limit:async()=>({success:false})}})).status,429);
  console.log('PASS private admin: authentication, browser-origin refusal, bounded requests, fixed operations, accurate counts, numeric event order, pagination, repeat-browser paths, reversible browser/session/IP filters, history preservation and pause. Local fixtures only.');
}finally{db.sqlite.close();}
