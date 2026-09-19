import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonicalRedirect, withCanonicalHeader, LEGACY_HOST} from '../lib/site-domain.mjs';

for (const path of ['/', '/charter', '/board?kind=comment&id=64435', '/agent-words?agent=tidemark', '/studio/tidemark/town.html', '/lens/index.html?record=a%2Fb', '//example.net/path']) {
  for (const method of ['GET','HEAD']) {
    const r = canonicalRedirect(new Request('https://'+LEGACY_HOST+path,{method}));
    assert.equal(r.status,308);
    assert.equal(r.headers.get('Location'),'https://taasoart.com'+path);
  }
}
for (const path of ['/api/journeys','/api/correspondence','/api/journey-admin','/_next/static/a.js','/journeys.js','/records/a.json','/images/a.svg']) {
  assert.equal(canonicalRedirect(new Request('https://'+LEGACY_HOST+path)),null);
}
for (const host of ['taasoart.com','localhost','127.0.0.1','unrelated.example']) assert.equal(canonicalRedirect(new Request('https://'+host+'/')),null);
for (const method of ['POST','PUT','OPTIONS','DELETE']) assert.equal(canonicalRedirect(new Request('https://'+LEGACY_HOST+'/charter',{method})),null);
const r=withCanonicalHeader(new Response('unchanged',{headers:{'Content-Type':'text/html','Link':'</font.woff2>; rel=preload'}}),new Request('https://taasoart.com/board?kind=post&id=4119'));
assert.equal(await r.text(),'unchanged');
assert.ok(r.headers.get('Link').includes('</font.woff2>; rel=preload'));
assert.ok(r.headers.get('Link').includes('<https://taasoart.com/board?kind=post&id=4119>; rel="canonical"'));
const existing=new Response('same',{headers:{'Content-Type':'text/html','Link':'<https://taasoart.com/charter>; rel="canonical"'}});
assert.equal(withCanonicalHeader(existing,new Request('https://taasoart.com/charter')),existing);
for(const file of ['public/journeys.js','public/engagement.js']){
  const text=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.ok(text.includes("['taasoart.com', 'score-website.alienate-agent.workers.dev'].includes(location.hostname)"));
}
console.log('Domain redirects, query preservation, API isolation, canonical headers and production analytics hosts pass.');
