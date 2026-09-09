import assert from 'node:assert/strict';
import {testDatabase,testJourneyGuards} from './journey-test-db.mjs';
import {ingestJourney,setExclusion} from '../lib/journeys.mjs';
import {journeyCSV,verifyRestoredJourneys} from './journey-csv.mjs';
const now=Date.now(),db=testDatabase();
const env={JOURNEYS:db,JOURNEY_KEY:crypto.randomUUID(),JOURNEYS_ENABLED:'1',JOURNEY_EDITION:'abc12345',...testJourneyGuards(db,now)};
const origin='https://score-website.alienate-agent.workers.dev';
for(let i=0;i<2;i++){
  const body={version:2,session:crypto.randomUUID(),page:crypto.randomUUID(),tester:false,testerAt:0,events:[{seq:1,at:now,action:'view',area:'story',target:'story-beginning',activeMs:0}]};
  const response=await ingestJourney(new Request(origin+'/api/journeys',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'203.0.113.7'},body:JSON.stringify(body)}),env,now);
  assert.equal(response.status,204);
}
assert.equal(verifyRestoredJourneys(db.sqlite).counts.journey_events,2);
const options={from:now-1,to:now+1};
let csv=[...journeyCSV(db.sqlite,options)];assert.equal(csv.length,3);
assert(!csv.join('').includes('network_key'));assert(!csv.join('').includes('203.0.113.7'));
const value=db.sqlite.prepare('SELECT visitor_id FROM journey_visitors LIMIT 1').get().visitor_id;
await setExclusion(db,{kind:'visitor',value});
assert.equal([...journeyCSV(db.sqlite,options)].length,2);
assert.equal([...journeyCSV(db.sqlite,{...options,includeExcluded:true})].length,3);
await setExclusion(db,{kind:'visitor',value,enabled:false});
assert.equal([...journeyCSV(db.sqlite,options)].length,3);
assert.throws(()=>[...journeyCSV(db.sqlite,{from:0,to:0})]);
db.sqlite.exec('DROP TABLE journey_exclusion_history');
assert.throws(()=>verifyRestoredJourneys(db.sqlite));db.sqlite.close();
console.log('PASS private offline CSV: integrity and classification checks, bounded window, ordered rows, reversible exclusions, optional excluded records, no network keys, incomplete backup refusal.');
