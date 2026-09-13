import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../public/site-navigation.js',import.meta.url),'utf8');
const elements=[];
function control(text,attrs={},excluded=false){
 const node={textContent:text,attrs:{...attrs},closest:()=>excluded?{}:null,getAttribute(k){return this.attrs[k]??null;},hasAttribute(k){return k in this.attrs;},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}};
 elements.push(node);return node;
}
const yes=[control('Back to Resources'),control('← Back to the story'),control('Return to the website'),control('↑',{ 'aria-label':'Back to charter heading'}),control('Entrance',{title:'Back to Entrance'}),control('Back')];
const no=[control('Alienate'),control('Read this post'),control('The artists are still owed.',{'aria-label':'The artists are still owed — Back to the entrance'},true),control('Return to the beginning',{},true),control('Back to the quoted claim',{},true)];
let observer;
vm.runInNewContext(source,{document:{body:{},querySelectorAll:()=>elements},requestAnimationFrame:fn=>fn(),MutationObserver:class{constructor(fn){observer=fn;}observe(){}}});
for(const node of yes)assert.ok(node.hasAttribute('data-return-link'),node.textContent);
for(const node of no)assert.ok(!node.hasAttribute('data-return-link'),node.textContent);
const later=control('Back to search results');observer();assert.ok(later.hasAttribute('data-return-link'));
later.textContent='Search';observer();assert.ok(!later.hasAttribute('data-return-link'));
assert.ok(!/\b(fetch|localStorage|sessionStorage)\s*[.(]/.test(source));
const css=fs.readFileSync(new URL('../public/site-navigation.css',import.meta.url),'utf8');
assert.ok(css.includes('color:#b52516!important'));
assert.ok(css.includes(':focus-visible'));
console.log('PASS: return labels, arrow/aria/title controls, dynamic updates, exclusions, red/focus treatment; no storage or network.');
