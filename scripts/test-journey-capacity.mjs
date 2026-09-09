import assert from 'node:assert/strict';
import {testDatabase,testJourneyGuards} from './journey-test-db.mjs';
import {ingestJourney,ready} from '../lib/journeys.mjs';
import {capacityStatus,CHECK_MAX_AGE,STORAGE_STOP_BYTES} from '../lib/journey-capacity.mjs';

const now=Date.now(), db=testDatabase(), origin='https://score-website.alienate-agent.workers.dev';
const env={JOURNEYS:db,JOURNEY_KEY:crypto.randomUUID(),JOURNEYS_ENABLED:'1',JOURNEY_EDITION:'abc12345',...testJourneyGuards(db,now)};
const batch=n=>({version:2,session:crypto.randomUUID(),page:crypto.randomUUID(),tester:false,testerAt:0,
  events:Array.from({length:n},(_,i)=>({seq:i+1,at:now,action:'view',area:'entrance',target:'',activeMs:0}))});
const req=(body,cookie)=>new Request(origin+'/api/journeys',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.7',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
const counts=()=>[...['journey_visitors','journey_events'].map(t=>db.sqlite.prepare('SELECT COUNT(*) n FROM '+t).get().n),db.sqlite.prepare('SELECT reserved_events FROM journey_capacity').get().reserved_events];
for(const binding of ['JOURNEY_RATE','JOURNEY_GLOBAL_RATE','JOURNEY_ARCHIVE'])assert.equal(ready({...env,[binding]:undefined}),false);
for(const field of ['archive_verified_at','storage_checked_at']){
  db.sqlite.prepare('UPDATE journey_capacity SET '+field+'=?').run(now-CHECK_MAX_AGE-1);
  assert.equal((await ingestJourney(req(batch(1)),env,now)).status,503);
  assert.deepEqual(counts(),[0,0,0]);
  db.sqlite.prepare('UPDATE journey_capacity SET '+field+'=?').run(now);
}
db.sqlite.prepare('UPDATE journey_capacity SET storage_bytes=?').run(STORAGE_STOP_BYTES);
assert.equal((await capacityStatus(db,now)).reason,'storage_capacity');
assert.equal((await ingestJourney(req(batch(1)),env,now)).status,503);
db.sqlite.prepare('UPDATE journey_capacity SET storage_bytes=0, paused=1').run();
assert.equal((await capacityStatus(db,now)).reason,'paused');
db.sqlite.prepare('UPDATE journey_capacity SET paused=0, daily_event_limit=3').run();
// A network/edge denial does not touch the database or issue a browser cookie.
for(const name of ['JOURNEY_RATE','JOURNEY_GLOBAL_RATE']){
  const response=await ingestJourney(req(batch(1)),{...env,[name]:{async limit(){return {success:false};}}},now);
  assert.equal(response.status,429);assert.equal(response.headers.get('Set-Cookie'),null);assert.deepEqual(counts(),[0,0,0]);
}
const first=batch(2), accepted=await ingestJourney(req(first),env,now);
assert.equal(accepted.status,204);assert.deepEqual(counts(),[1,2,2]);
// Crossing the daily budget rolls back the lifetime reservation and visitor.
assert.equal((await ingestJourney(req(batch(2)),env,now)).status,503);
assert.deepEqual(counts(),[1,2,2]);
assert.equal(db.sqlite.prepare('SELECT reserved_events FROM journey_daily_usage').get().reserved_events,2);
assert.equal((await ingestJourney(req(batch(1)),env,now)).status,204);
assert.equal((await capacityStatus(db,now)).reason,'daily_capacity');
const nextDay=(Math.floor(now/86400000)+1)*86400000;
assert.equal((await ingestJourney(req(batch(1)),env,nextDay)).status,204);
assert.deepEqual(counts(),[3,4,4]);
db.sqlite.prepare('UPDATE journey_capacity SET event_limit=5').run();
assert.equal((await capacityStatus(db,nextDay)).warning,true);
assert.equal((await ingestJourney(req(batch(2)),env,nextDay)).status,503);
assert.deepEqual(counts(),[3,4,4]);
assert.equal((await ingestJourney(req(batch(1)),env,nextDay)).status,204);
assert.equal((await capacityStatus(db,nextDay)).reason,'event_capacity');
// Budgets never delete already-collected records.
assert.deepEqual(counts(),[4,5,5]);
const replayDB=testDatabase();const replayEnv={...env,JOURNEYS:replayDB,...testJourneyGuards(replayDB,now)};
const a=await ingestJourney(req(first),replayEnv,now);
await ingestJourney(req(first,a.headers.get('Set-Cookie').split(';')[0]),replayEnv,now);
assert.equal(replayDB.sqlite.prepare('SELECT COUNT(*) n FROM journey_events').get().n,2);
assert.equal(replayDB.sqlite.prepare('SELECT reserved_events FROM journey_capacity').get().reserved_events,4);
db.sqlite.close();replayDB.sqlite.close();
console.log('PASS capacity: required bindings, stale verification, pause, byte threshold, edge refusal, atomic daily/lifetime budgets, UTC rollover, warnings, retry reservations and no deletion.');
