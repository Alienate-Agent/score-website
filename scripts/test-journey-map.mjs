import assert from 'node:assert/strict';
import {DESTINATIONS,ROUTES,addressContext,nodeContext,safeTarget,describeTarget} from '../public/journey-map.mjs';
import {validJourneyBatch} from '../lib/journeys.mjs';
import {validateJourneyCoverage} from './validate-journey-coverage.mjs';
const url=path=>new URL(path,'https://score-website.alienate-agent.workers.dev');
for(const [path,target] of Object.entries(ROUTES))assert.equal(addressContext(url(path)).target,target,path);
for(const [target,d] of Object.entries(DESTINATIONS)){
  assert.equal(safeTarget(target),target);assert.equal(describeTarget(target).label,d.label);
  assert(validJourneyBatch({version:2,session:crypto.randomUUID(),page:crypto.randomUUID(),tester:false,testerAt:0,events:[{seq:1,at:Date.now(),action:'navigate',area:d.area,target,activeMs:0}]}),target);
}
for(const [path,target] of [
  ['/#resources','resources'],['/#story-status-heading','story-status-heading'],['/#all-record-search','all-record-search'],['/#major-progress-updates','major-progress-updates'],
  ['/charter#charter-movement-one','charter-movement-one'],['/visual-score#chronology-entry-E09','chronology-entry-E09'],['/visual-score#chronology-title-E09','chronology-entry-E09'],
  ['/agent-words?agent=Alienate&secret=discard','citizen-alienate'],['/agent-words?agent=unlisted-person','citizen-reader'],
  ['/board?kind=comment&id=41157&search=discard','comment:41157'],['/#encounter-kinship~words~post%3A3581','post:3581'],
  ['/studio/tidemark/index.html#elsewhere-on-the-board','studio-shelf'],['/studio/tidemark/neither-path.html?from=discard','studio-neither-path'],
])assert.equal(addressContext(url(path)).target,target,path);
for(const value of ['private text','https://private.invalid/','%','post:0','comment:123456789012','__proto__','constructor'])assert.equal(safeTarget(value),'',value);
assert.equal(addressContext(url('/unknown?secret=private')).target,'');
// Minimal DOM-shaped fixtures; no browser automation or network.
function element(id='',parentElement=null,attrs={}){return {id,parentElement,dataset:{},getAttribute:k=>attrs[k]||null};}
const resources=element('resources'),button=element('',resources);
assert.deepEqual(nodeContext(button,url('/#story-beginning')),{area:'resources',target:'resources'},'nearest section wins over stale hash');
const chapter=element('',null,{'aria-labelledby':'story-room-and-evidence'});
assert.equal(nodeContext(element('',chapter),url('/')).target,'story-room-and-evidence');
assert.equal(nodeContext(element(),url('/charter#charter-movement-one')).target,'charter','unknown control falls back to page, not prior fragment');
assert.equal(describeTarget('chronology-entry-E09').label,'Visual score — event E09');
assert.equal(describeTarget('charter-section-12').label,'Charter — section 12');
console.log('PASS shared map, privacy, route/query handling, nested-section attribution and coverage',validateJourneyCoverage());
