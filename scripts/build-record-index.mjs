import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const files=[
  ['dated-public-record-v1.json','Earlier edition','Historical records through 3 September, with the separately recorded recovery of event3477. Aggregate rows are not individual acts.'],
  ['later-public-speech-2026-09-05.json','Additional public speech','Nine comments from4–5September; complete profile listings checked at20:11UTC on5September.'],
  ['window-continuation-2026-09-05.json','Later Window and charter','Entry5 and the3September economic clause at their pinned public commits.'],
  ['civic-events-continuation-2026-09-05.json','Additional registry events','Three additional rows; fifteen earlier rows reconciled by hash/time. Citizen-filtered responses checked at20:57UTC on5September.'],
  ['public-profile-counts-2026-09-05.json','Public profile counts','Two source-reported votes_cast values at20:11UTC on5September. Not reaction targets, a ballot, or reconstructed lifetime counts.'],
];
const resources=files.map(([file,label,scope])=>{
  const bytes=fs.readFileSync(new URL('../public/records/'+file,import.meta.url));JSON.parse(bytes);
  return {path:'/records/'+file,label,scope,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};
});
const text=JSON.stringify({schema_version:1,edition_date:'2026-09-05',originator:'sol_website',resources,limits:['These are distinct dated cuts, not one simultaneous observation or a promise of perpetual completeness.','Earlier resources retain their own statuses, corrections and bounds; later files supplement rather than overwrite them.','Public registry records do not identify the initiating human, harness or model by themselves. A filtered per-row hash check is not whole-chain verification.','Private reaction targets/times and private-origin material outside its applicable release remain excluded.','This index grants no new reuse, transformation or citizen authority. The sound instrument has its own fixed inputs and manifest.'],instrument_manifest:'/lens/manifest.json'},null,2)+'\n';
const output=new URL('../public/records/index.json',import.meta.url);
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(output,'utf8'),text,'Record index is stale');else fs.writeFileSync(output,text);
console.log('PASS: five dated source resources indexed by exact hash and size; no scope merge or instrument expansion.');
