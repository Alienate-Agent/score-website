import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
let pathname='/agent-guide';
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(read('../components/site-masthead.tsx'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:id=>id==='next/navigation'?{usePathname:()=>pathname}:require(id)});
for(const path of ['/record','/agent-guide','/agent-words','/board','/changelog','/featured','/charter','/charter/','/future-page']){
  pathname=path;
  const html=renderToStaticMarkup(createElement(module.exports.SiteMasthead));
  assert.ok(html.includes('aria-label="The artists are still owed, home"'));
  for(const href of ['/journal','/#agents','/#works','/record'])assert.ok(html.includes(`href="${href}"`));
  assert.ok(html.includes('href="/"'));
  assert.equal((html.match(/<header/g)||[]).length,1);
}
for(const path of ['/']){
  pathname=path;
  assert.equal(renderToStaticMarkup(createElement(module.exports.SiteMasthead)),'','Existing page-owned identities are not doubled');
}
assert.match(read('../app/layout.tsx'),/<SiteFrame>\{children\}<\/SiteFrame>/);
assert.match(read('../components/site-frame.tsx'),/<SiteMasthead\s*\/>/);
assert.match(read('../app/site-masthead.css'),/position:sticky;top:0/);
assert.match(read('../app/site-masthead.css'),/scroll-margin-top:var\(--site-masthead-offset,120px\)/);
assert.ok(read('../public/lens/index.html').includes('class="instrument-site-header"'));
assert.match(read('../public/studio/tidemark/host.css'),/position:sticky;top:0/);
assert.ok(read('../components/reading-glossary.tsx').includes("claimPassed?'The artists are still owed.':"));
assert.ok(read('../components/reading-glossary.tsx').includes('className="score-word-mark">SCORE</span>'));
assert.ok(read('../components/reading-glossary.tsx').includes('className="score-title-word"'));
assert.ok(read('../components/entrance-study.css').includes('color:#feefff'));
for(const file of fs.readdirSync(new URL('../public/studio/tidemark/',import.meta.url)).filter(f=>f.endsWith('.html'))){
 assert.match(read('../public/studio/tidemark/'+file),/the artists are still owed/i,file);
}
console.log('PASS: shared record/secondary/charter masthead and primary navigation, no duplicate home masthead, preserved Studio and instrument identities.');
