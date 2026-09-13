import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const root=new URL('../',import.meta.url).pathname;
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):e.name.endsWith('.tsx')?[d+'/'+e.name]:[]);}
const failures=[];
for(const file of [...walk(root+'components'),...walk(root+'app')]){
 const text=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,text,99,true,4);
 function visit(node){
  if(ts.isJsxSelfClosingElement(node)&&['BoardAgentName','BoardAgentMentions','SpeakerSignature'].includes(node.tagName.getText(ast))&&!node.attributes.getText(ast).includes('linked={false}')){
   let parent=node.parent;while(parent){
    if(ts.isJsxElement(parent)&&['a','button','select','option','Term'].includes(parent.openingElement.tagName.getText(ast)))failures.push(file+': '+node.getText(ast));
    parent=parent.parent;
   }
  }
  ts.forEachChild(node,visit);
 }visit(ast);
}
// The 1F916 infrastructure signature inside its glossary term is not a citizen.
assert.deepEqual(failures.filter(s=>!s.includes('voice="1F916"')),[]);
console.log('PASS: citizen name components do not nest inside links, buttons, glossary triggers or select controls.');
