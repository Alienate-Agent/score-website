// Run against the actual local preview after each build/server replacement.
// A 200 response alone is insufficient: a stale asset server can return no body.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const base=new URL(process.argv[2]??'http://127.0.0.1:3002');
assert.ok(base.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(base.hostname),'Local preview only');
assert.ok(!base.username&&!base.password&&!base.search&&!base.hash);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=['/lens/index.html','/lens/first-encounter.js','/lens/source-inputs.json','/records/connected-encounters-2026-09-07.json'];
for(const path of paths){
  const expected=await readFile(new URL('../public'+path,import.meta.url));
  const response=await fetch(new URL(path,base),{redirect:'manual',signal:AbortSignal.timeout(10000)});
  assert.equal(response.status,200,path+' must be delivered without a redirect');
  const actual=new Uint8Array(await response.arrayBuffer());
  assert.equal(hash(actual),hash(expected),path+' served bytes must equal the built source, not an empty success');
  assert.ok(response.headers.get('content-type')?.includes(path.endsWith('.html')?'text/html':path.endsWith('.json')?'application/json':'javascript'),path+' content type');
  console.log('PASS',path,actual.length,'bytes');
}
console.log('Static delivery only; browser journeys, privacy scans and publication authorization remain separate.');
