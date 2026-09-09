import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {testDatabase,testJourneyGuards} from './journey-test-db.mjs';
import {canonicalIP,networkId,requestNetworkId,visitorIdentity,VISITOR_COOKIE} from '../lib/journey-identity.mjs';
import {ingestJourney,journeyConfig,validJourneyBatch,setExclusion,setIPExclusion,journeyReport,journeyPage} from '../lib/journeys.mjs';

const now=Date.now(), secret=randomBytes(32).toString('hex'), db=testDatabase();
const env={JOURNEYS:db,JOURNEY_KEY:secret,JOURNEYS_ENABLED:'1',JOURNEY_EDITION:'abc12345',...testJourneyGuards(db,now)};
const origin='https://score-website.alienate-agent.workers.dev';
const request=(body,headers={})=>new Request(`${origin}/api/journeys`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.7',...headers},body:JSON.stringify(body)});
const batch=(extra={})=>({version:2,session:crypto.randomUUID(),page:crypto.randomUUID(),tester:false,testerAt:0,
  events:[{seq:1,at:now,action:'view',area:'entrance',target:'',activeMs:0}],...extra});
const report=()=>journeyReport(db,{from:now-1,to:now+100000});
const rows=()=>db.sqlite.prepare('SELECT * FROM journey_events').all();
const cookie=r=>r.headers.get('Set-Cookie')?.split(';')[0];

assert.equal(canonicalIP('2001:0DB8:0000:0000:0000:0000:0000:0001'),'2001:db8::1');
assert.equal(canonicalIP('::ffff:203.0.113.7'),'203.0.113.7');
for(const ip of ['',null,'203.0.113.7, 203.0.113.8','127.1','999.0.0.1','fe80::1%eth0'])assert.equal(canonicalIP(ip),null);
assert.equal(await networkId(secret,'2001:db8::1'),await networkId(secret,'2001:0db8:0:0:0:0:0:1'));
assert.notEqual(await networkId(secret,'203.0.113.7'),await networkId(secret,'203.0.113.8'));
assert.notEqual(await networkId(secret,'203.0.113.7'),await networkId(secret+'different','203.0.113.7'));
assert.equal(await requestNetworkId(request(batch(),{'CF-Connecting-IP':'2a06:98c0:3600::103'}),secret),null);
assert.equal(await requestNetworkId(request(batch(),{'X-Forwarded-For':'192.0.2.99'}),secret),await networkId(secret,'203.0.113.7'));
assert.equal(await requestNetworkId(request(batch(),{'CF-Connecting-IPv6':'2001:db8::99'}),secret),await networkId(secret,'203.0.113.7'));
assert.equal(await requestNetworkId(request(batch(),{'CF-Connecting-IP':'240.16.0.1','CF-Connecting-IPv6':'2001:db8::99'}),secret),await networkId(secret,'2001:db8::99'));

const first=batch();assert(validJourneyBatch(first,now));
for(const bad of [null,{}, {...first,ip:'private'}, {...first,testerAt:-1}, {...first,session:'person'}, {...first,events:[]},
  {...first,events:Array(13).fill(first.events[0])}, {...first,events:[first.events[0],first.events[0]]},
  ...[{target:'private text'},{url:'https://private.invalid'},{action:'typed search'},{seq:401},{activeMs:1},{at:now+600000}].map(e=>({...first,events:[{...first.events[0],...e}]}))])assert(!validJourneyBatch(bad,now));
assert.equal((await ingestJourney(request(first,{Origin:'https://elsewhere.invalid'}),env,now)).status,403);
assert.equal((await ingestJourney(request(first),{},now)).status,503);
assert.equal((await ingestJourney(request(first,{'Content-Type':'text/plain'}),env,now)).status,415);
assert.equal((await ingestJourney(request('x'.repeat(9000)),env,now)).status,413);
for(const headers of [{DNT:'1'},{'Sec-GPC':'1'}]){
  const r=await ingestJourney(request(first,headers),env,now);assert.equal(r.status,204);assert(r.headers.get('Set-Cookie').includes('Max-Age=0'));
}
assert.equal(rows().length,0);
assert.equal((await (journeyConfig(request(first),{})).json()).enabled,false);
assert.equal((await (journeyConfig(request(first),env)).json()).enabled,true);

const r1=await ingestJourney(request(first),env,now);assert.equal(r1.status,204);
const cookieA=cookie(r1);assert(cookieA.startsWith(VISITOR_COOKIE+'='));assert(r1.headers.get('Set-Cookie').includes('HttpOnly'));
const visitorA=rows()[0].visitor_id;
assert.equal((await visitorIdentity(request(first,{Cookie:cookieA}),secret,now+1)).id,visitorA);
assert.notEqual((await visitorIdentity(request(first,{Cookie:cookieA.slice(0,-1)+(cookieA.endsWith('0')?'1':'0')}),secret,now)).id,visitorA);
assert.notEqual((await visitorIdentity(request(first,{Cookie:cookieA}),secret,now+366*86400000)).id,visitorA);

// Idempotent delivery; reopening in a new session remains the same browser.
await ingestJourney(request(first,{Cookie:cookieA}),env,now+1);assert.equal(rows().length,1);
await ingestJourney(request(batch(),{Cookie:cookieA}),env,now+2);
const r2=await ingestJourney(request(batch()),env,now+3);const cookieB=cookie(r2);
const visitorB=rows().at(-1).visitor_id;assert.notEqual(visitorA,visitorB);
await ingestJourney(request(batch(),{Cookie:cookieA,'CF-Connecting-IP':'198.51.100.8'}),env,now+4);
let totals=await report();assert.equal(totals.included_browsers,2);assert.equal(totals.included_sessions,4);
assert.equal(totals.networks.length,2);assert.equal(totals.networks[0].browsers,2);

await setIPExclusion(db,secret,'203.0.113.7',{reason:'operator'});
totals=await report();assert.equal(totals.excluded_sessions,3);assert.equal(totals.included_sessions,1);
await setIPExclusion(db,secret,'203.0.113.7',{enabled:false});
assert.equal((await report()).included_sessions,4);assert.equal(rows().length,4);
await setExclusion(db,{kind:'visitor',value:visitorB,reason:'tester'});
assert.equal((await report()).included_sessions,3);
await setExclusion(db,{kind:'visitor',value:visitorB,enabled:false});

// A later self-tester preference applies retrospectively; late old packets
// cannot undo it. Changing it back is reversible and keeps the event history.
const preference=batch({tester:true,testerAt:now+5});
await ingestJourney(request(preference,{Cookie:cookieA}),env,now+5);
await ingestJourney(request(first,{Cookie:cookieA}),env,now+6);
assert.equal((await report()).included_sessions,1);
await ingestJourney(request(batch({tester:false,testerAt:now+7}),{Cookie:cookieA}),env,now+7);
assert.equal((await report()).excluded_sessions,0);
assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM journey_exclusion_history').get().n,4);
assert(!JSON.stringify(rows()).includes('203.0.113.7'));

let exported=[], cursor='';
do{const page=await journeyPage(db,{from:now-1,to:now+10000,limit:2,after:cursor});exported.push(...page.events);cursor=page.next;}while(cursor);
assert.equal(exported.length,rows().length);assert(exported.every(e=>!('network_key' in e)));
assert.equal(new Set(exported.map(e=>e.event_id)).size,exported.length);
await assert.rejects(()=>setIPExclusion(db,secret,'invalid'));
await assert.rejects(()=>setExclusion(db,{kind:'visitor',value:"' OR 1=1 --"}));
await assert.rejects(()=>journeyReport(db,{from:0,to:Date.now()}));
const broken={...env,JOURNEYS:{prepare:()=>{throw Error('private');}}};
const fail=await ingestJourney(request(batch()),broken,now);assert.equal(fail.status,503);assert.equal(await fail.text(),'');
assert.equal(fail.headers.get('Set-Cookie'),null);
console.log('Journey tests pass: signed browser identity, same-IP/different-browser counts, changed IP, IPv6, private IP matching, retry deduplication, retroactive reversible exclusions, export pagination, privacy signals, bounded payloads, disabled configuration and generic failures.');
