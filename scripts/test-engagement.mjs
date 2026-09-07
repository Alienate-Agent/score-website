import assert from 'node:assert/strict';
import {validBatch, ingest} from '../lib/engagement.mjs';
const good = [{event:'view', area:'entrance', surface:'test'}];
const request = (body, headers={}) => new Request('https://example.org/api/engagement', {
  method:'POST', headers:{Origin:'https://example.org','Content-Type':'application/json',...headers}, body:JSON.stringify(body)
});
const writes=[]; const dataset={writeDataPoint:p=>writes.push(p)};
assert(validBatch(good));
for (const bad of [[],Array(13).fill(good[0]),[{...good[0],url:'private'}],[{...good[0],event:'typed text'}],[{...good[0],area:'private'}],null]) assert(!validBatch(bad));
assert.equal((await ingest(request(good),dataset)).status,204);
assert.deepEqual(writes,[{blobs:['v1','test','view','entrance'],doubles:[1]}]);
assert.equal((await ingest(request(good,{Origin:'https://evil.invalid'}),dataset)).status,403);
assert.equal((await ingest(request(good,{'Sec-GPC':'1'}),dataset)).status,204);
assert.equal((await ingest(request(good,{DNT:'1'}),dataset)).status,204);
assert.equal(writes.length,1);
assert.equal((await ingest(request(good),undefined)).status,503);
assert.equal((await ingest(request('x'.repeat(3000)),dataset)).status,413);
assert.equal((await ingest(request([{...good[0],text:'secret'}]),dataset)).status,400);
console.log('Engagement schema, bounds, origin, privacy signals and exact stored fields pass.');
