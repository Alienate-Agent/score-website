import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/globals.css');
const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const selector of [':root','.dark']){
  const block=css.slice(css.indexOf(selector+' {')).split('}')[0];
  const tokens=Object.fromEntries([...block.matchAll(/(--[\w-]+): (#[\da-f]{6});/g)].map(m=>[m[1],m[2]]));
  assert.equal(tokens['--paper'],selector===':root'?'#ffffff':'#000000');
  assert.equal(tokens['--ink'],selector===':root'?'#000000':'#ffffff');
  for(const [key,value] of Object.entries(tokens).filter(([k])=>k.startsWith('--voice-')||k==='--ink-soft'||k==='--reveal')){
    for(const bg of ['--paper','--paper-raised','--paper-deep'])assert.ok(contrast(value,tokens[bg])>=4.5,`${selector} ${key} on ${bg}`);
  }
}
const manifest=JSON.parse(read('public/lens/manifest.json'));
for(const entry of manifest.files){const bytes=readFileSync(new URL('../public/lens/'+entry.path,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path);assert.equal(bytes.length,entry.bytes);}
assert.equal(read('public/lens/first-encounter.css'),read('scripts/lens-first-encounter.css'));
assert.ok(!read('components/declaration-encounter.module.css').includes('background:#fff'),'Use theme surface on enlarged question, including dark mode');
console.log('PASS: black/white surfaces, accent text ≥4.5:1 on base surfaces in both themes, instrument manifest and CSS source parity. Rendered mixed/selected states remain separate checks.');
