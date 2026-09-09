import {Miniflare} from 'miniflare';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const path=name=>fileURLToPath(new URL('../'+name,import.meta.url));
const mf=new Miniflare({
  // Match the existing site's compatibility date; no production upgrade.
  cf:false, compatibilityDate:'2026-05-15', compatibilityFlags:['nodejs_compat'],
  modules:[
    {type:'ESModule',path:path('journey-test-entry.mjs'),contents:`import {ingestJourney,journeyConfig} from './lib/journeys.mjs';import {handleJourneyAdmin} from './lib/journey-admin.mjs';export default {fetch(request,env){if(new URL(request.url).pathname==='/api/journey-admin')return handleJourneyAdmin(request,env);return request.method==='GET'?journeyConfig(request,env):ingestJourney(request,env);}};`},
    ...['lib/journeys.mjs','lib/journey-identity.mjs','lib/journey-capacity.mjs','lib/journey-admin.mjs'].map(name=>({type:'ESModule',path:path(name),contents:readFileSync(path(name),'utf8')})),
  ],
  d1Databases:{JOURNEYS:'journey-local-test'},
  r2Buckets:{JOURNEY_ARCHIVE:'journey-local-archive'},
  ratelimits:{JOURNEY_RATE:{simple:{limit:120,period:60}},JOURNEY_GLOBAL_RATE:{simple:{limit:1200,period:60}}},
  bindings:{JOURNEY_KEY:randomBytes(32).toString('hex'),JOURNEY_ADMIN_KEY:'a'.repeat(64),JOURNEYS_ENABLED:'1',JOURNEY_EDITION:'abc12345'},
});
try {
  const db=await mf.getD1Database('JOURNEYS');
  for(const file of ['0001_visitor_paths.sql','0002_capacity_guards.sql']) {
    const migration=readFileSync(path('migrations/journeys/'+file),'utf8').replace(/^--.*$/gm,'');
    for(const statement of migration.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
  }
  // Local test fixtures only: production must verify a real remote backup.
  await db.prepare('UPDATE journey_capacity SET archive_verified_at=?,storage_checked_at=? WHERE id=1').bind(Date.now()-1000,Date.now()-1000).run();
  const origin='https://score-website.alienate-agent.workers.dev';
  const config=await mf.dispatchFetch(origin+'/api/journeys');assert.equal((await config.json()).enabled,true);
  const payload={version:2,session:crypto.randomUUID(),page:crypto.randomUUID(),tester:false,testerAt:0,events:[{seq:1,at:Date.now(),action:'view',area:'prelude',target:'story-beginning',activeMs:0}]};
  const headers={Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.7'};
  const first=await mf.dispatchFetch(origin+'/api/journeys',{method:'POST',headers,body:JSON.stringify(payload)});
  assert.equal(first.status,204);assert(first.headers.get('Set-Cookie')?.includes('HttpOnly'));
  const second=await mf.dispatchFetch(origin+'/api/journeys',{method:'POST',headers:{...headers,Cookie:first.headers.get('Set-Cookie').split(';')[0]},body:JSON.stringify(payload)});
  assert.equal(second.status,204);
  const count=await db.prepare('SELECT COUNT(*) AS n FROM journey_events').first();assert.equal(count.n,1);
  const session=await db.prepare('SELECT * FROM journey_session_classification').first();assert.equal(session.events,1);assert.equal(session.excluded,0);
  const admin=await mf.dispatchFetch(origin+'/api/journey-admin',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+'a'.repeat(64)},body:JSON.stringify({action:'overview',from:Date.now()-3600000,to:Date.now()+1000})});
  assert.equal(admin.status,200);assert.equal((await admin.json()).summary.included_sessions,1);
  assert.equal((await mf.dispatchFetch(origin+'/api/journey-admin')).status,404);
  // Real D1 must roll back every statement when the reservation CHECK fails.
  await db.prepare('UPDATE journey_capacity SET event_limit=3 WHERE id=1').run();
  const beyond={...payload,page:crypto.randomUUID(),events:[payload.events[0],{...payload.events[0],seq:2}]};
  const rejected=await mf.dispatchFetch(origin+'/api/journeys',{method:'POST',headers,body:JSON.stringify(beyond)});
  assert.equal(rejected.status,503);assert.equal(rejected.headers.get('Set-Cookie'),null);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM journey_events').first()).n,1);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM journey_visitors').first()).n,1);
  assert.equal((await db.prepare('SELECT reserved_events FROM journey_capacity').first()).reserved_events,2);
  await db.prepare('UPDATE journey_capacity SET archive_verified_at=0 WHERE id=1').run();
  const unverified=await mf.dispatchFetch(origin+'/api/journeys',{method:'POST',headers,body:JSON.stringify(payload)});
  assert.equal(unverified.status,503);
  console.log('PASS local Workers runtime and D1: migrations, real local rate/R2 bindings, Web Crypto, retry deduplication, reporting, atomic capacity rollback and archive-verification gate. No remote resources used.');
} finally {await mf.dispose();}
