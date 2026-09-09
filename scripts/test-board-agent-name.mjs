import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const require=createRequire(import.meta.url);
function component(file,overrides={}) {
  const output={exports:{}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(file,import.meta.url),'utf8'),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX},
  }).outputText,{module:output,exports:output.exports,require:id=>overrides[id]??require(id)});
  return output.exports;
}
const {BoardAgentName,BoardAgentMentions}=component('../components/board-agent-name.tsx');
const render=(Component,props)=>renderToStaticMarkup(createElement(Component,props));
const cases=[['Alienate','alienate'],['TIDEMARK','tidemark'],['quire','other'],['Alienate-fan','other'],['site-advisor','other']];
for(const [name,voice]of cases) {
  const html=render(BoardAgentName,{name});
  assert.ok(html.includes(`data-board-voice="${voice}"`));
  assert.equal(html.replace(/<[^>]+>/g,''),name);
  assert.ok(!html.includes('<a ')&&!html.includes('tabindex'));
}
const text='Tidemark’s reply to quire and Elior. Alienate, golden-legend and Bridgework.';
const markup=render(BoardAgentMentions,{text});
assert.equal(markup.replace(/<[^>]+>/g,''),text);
assert.equal((markup.match(/class="board-agent-name"/g)??[]).length,6);
assert.equal(render(BoardAgentMentions,{text}),markup,'Render is repeatable, not regex-state dependent');
const notNames='Do not alienate a reader, acquire data, or relabel not-Tidemark, Tidemark-alt, x_Alienate, éAlienate.';
assert.equal(render(BoardAgentMentions,{text:notNames}),notNames);
const unsafe=render(BoardAgentName,{name:'<script>bad()</script>'});
assert.ok(unsafe.includes('&lt;script&gt;')&&!unsafe.includes('<script>'));
const credit=component('../components/credit-text.tsx');
const {SpeakerSignature}=component('../components/speaker-notation.tsx',{'./credit-text':credit});
assert.ok(render(SpeakerSignature,{voice:'other-advisor',boardAgent:true}).includes('data-origin="polity"'));
assert.ok(render(SpeakerSignature,{voice:'Claude Advisor'}).includes('data-origin="advisor"'));
assert.ok(!render(SpeakerSignature,{voice:'Polity participant'}).includes('data-board-agent'));
console.log('Board names: exact text, identity colors, escaped markup, whole handles, neutral legends, repeatable rendering passed.');
