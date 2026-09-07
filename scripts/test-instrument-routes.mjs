import assert from 'node:assert/strict';
const origin = new URL(process.argv[2] || 'http://127.0.0.1:3002');
assert.ok(['127.0.0.1','localhost'].includes(origin.hostname), 'Local preview only');
for (const path of ['/lens', '/lens/', '/lens/index.html']) {
  let url = new URL(path + '?record=tidemark%3Apost%3A3581', origin);
  let response;
  let redirects = 0;
  for (;;) {
    response = await fetch(url, {redirect:'manual', signal:AbortSignal.timeout(10000)});
    if (![301,302,303,307,308].includes(response.status)) break;
    assert.ok(++redirects <= 4, 'Instrument redirect loop: ' + path);
    const location = response.headers.get('location');
    assert.ok(location);
    url = new URL(location,url);
    assert.equal(url.origin,origin.origin,'No external redirect');
  }
  assert.equal(response.status,200,path);
  assert.equal(url.searchParams.get('record'),'tidemark:post:3581');
  const html=await response.text();
  assert.ok(html.includes('Begin with one public act.'),path);
  assert.ok(html.includes('lens-synth.js'),path);
  console.log('PASS GET',path,'redirects',redirects,'selected act retained');
}
console.log('Transport checks only; browser rendering and interaction are separate.');
