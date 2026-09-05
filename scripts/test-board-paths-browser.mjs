import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const [url, output] = process.argv.slice(2);
if (!url || !output || !['localhost','127.0.0.1'].includes(new URL(url).hostname)) throw Error('Supply localhost site URL and private output directory');
const profile = await fs.mkdtemp(path.join(os.tmpdir(),'score-board-browser-'));
await fs.mkdir(output,{recursive:true});
const browser = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--mute-audio','--remote-debugging-pipe',`--user-data-dir=${profile}`,'about:blank'
],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let seq=0, buffer='', sessionId;
const pending=new Map(), errors=[], checks=[];
browser.stderr.on('data',()=>{});
browser.on('error',error=>{for(const p of pending.values())p.reject(error);});
browser.stdio[4].on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\0'))>=0){const message=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);if(message.id){const p=pending.get(message.id);if(p){clearTimeout(p.timeout);pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result);}}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);}});
function send(method,params={},target=sessionId){return new Promise((resolve,reject)=>{const id=++seq;const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Timed out: '+method));},15000);pending.set(id,{resolve,reject,timeout});browser.stdio[3].write(JSON.stringify({id,method,params,...(target?{sessionId:target}:{})})+'\0');});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(expression){const start=Date.now();while(Date.now()-start<10000){if(await evaluate(`Boolean(${expression})`))return;await new Promise(resolve=>setTimeout(resolve,40));}throw Error('Condition timed out: '+expression);}
async function enter(selector){await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);assert.equal(await evaluate(`document.activeElement===document.querySelector(${JSON.stringify(selector)})`),true,'Focus target: '+selector);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}
async function capture(name){const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(output,name),Buffer.from(data,'base64'));}
function pass(text){checks.push(text);console.log('PASS: '+text);}
try {
  const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);
  ({sessionId}=await send('Target.attachToTarget',{targetId,flatten:true},null));
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});
  await waitFor(`document.querySelector('#board-questions') && document.querySelector('.story-records__return button')`);
  await enter('#story-treasury-aside > summary');
  await waitFor(`document.querySelector('#story-treasury-aside').open`);
  assert.ok(await evaluate('document.querySelector("#story-treasury-aside").innerText.includes("not an independent valuation")'));
  assert.equal(await evaluate('document.querySelector("#story-treasury-aside a").href'),'https://1f916.ai/api/post/1419');
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  await evaluate('document.getElementById("story-beginning").scrollIntoView({behavior:"instant",block:"start"})');
  await capture('treasury-story-wide.png');
  pass('Historical treasury detail opens by keyboard with source attribution and valuation limit');
  await enter('a[href="#later-public-words"][data-story-return]');
  await waitFor(`document.querySelector('#story-instruments').open`);
  await enter('details[id="later-public-record-alienate%3Acomment%3A41157"] > summary');
  await waitFor(`document.getElementById('later-public-record-alienate%3Acomment%3A41157').open`);
  assert.equal(await evaluate('document.querySelectorAll("[data-later-exact]").length'),9);
  assert.ok(await evaluate('document.querySelector("[data-later-exact=\\"alienate:comment:41157\\"]").textContent.includes("a choice with a citation")'));
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  await evaluate('document.getElementById("later-public-words").scrollIntoView({behavior:"instant",block:"start"})');
  await capture('later-public-words-wide.png');
  pass('Dated continuation opens; nine exact comments and attribution available without board fetch or audio');
  await enter('details[id="later-public-record-alienate%3Acomment%3A41157"] a[href^="#later-public-record-"]');
  await waitFor(`location.hash==='#later-public-record-alienate%3Acomment%3A41157'`);
  await waitFor(`document.activeElement.parentElement.id==='later-public-record-alienate%3Acomment%3A41157'`);
  pass('Later-comment stable address restores its disclosure and summary focus');
  await enter('.story-records__return button');
  await waitFor(`!document.querySelector('#story-instruments').open`);
  // A trusted key activation exercises the real link and hydration listeners.
  await enter('a[href="#board-questions"][data-story-return]');
  await waitFor(`document.querySelector('#story-instruments').open`);
  assert.equal(await evaluate('location.hash'),'#board-questions');
  pass('Story invitation opens the retained second surface at the question index');
  await enter('#board-question-money > summary');
  await waitFor(`document.querySelector('#board-question-money').open`);
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  assert.equal(await evaluate('document.querySelectorAll("[data-board-record]").length'),7);
  await evaluate('document.getElementById("board-questions").scrollIntoView({behavior:"instant",block:"start"})');
  await waitFor(`document.getElementById('board-questions').getBoundingClientRect().top>=0 && document.getElementById('board-questions').getBoundingClientRect().top<200`);
  await capture('board-paths-wide.png');
  pass('Native disclosure opens by keyboard; seven source links rendered');
  await enter('[data-board-record="alienate:comment:37623"]');
  await waitFor(`document.querySelector('[data-public-record-key="alienate:comment:37623"]')`);
  await waitFor(`document.activeElement.id==='selected-public-record-title'`);
  assert.equal(await evaluate('document.activeElement.id'),'selected-public-record-title');
  pass('Failure-account link selects the exact dated record and moves keyboard focus');
  await enter('[data-public-record-key] a[href="#board-questions"]');
  await waitFor(`location.hash==='#board-questions'`);
  assert.equal(await evaluate('document.querySelector("#board-question-money").open'),true);
  pass('Reader returns to questions with the selected path still open');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  await evaluate('document.getElementById("board-questions").scrollIntoView({behavior:"instant",block:"start"})');
  await waitFor(`document.getElementById('board-questions').getBoundingClientRect().top>=0 && document.getElementById('board-questions').getBoundingClientRect().top<200`);
  const width=await evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})');
  assert.ok(width.scroll<=width.client+1,JSON.stringify(width));
  await capture('board-paths-narrow.png');
  pass('390px layout has no page-level horizontal overflow');
  await enter('.story-records__return button');
  await waitFor(`!document.querySelector('#story-instruments').open`);
  assert.equal(await evaluate('location.hash'),'#story-unwritten');
  assert.equal(await evaluate('document.activeElement.id'),'story-unwritten');
  pass('Return restores the story ending and keyboard focus');
  assert.equal(errors.length,0);pass('No uncaught browser exceptions');
  await fs.writeFile(path.join(output,'browser-report.json'),JSON.stringify({url,checks,errors,limits:'Local muted Chrome; not live-board verification, artistic approval or full accessibility certification'},null,2)+'\n');
} catch (error) {
  console.error(error);
  console.error(await evaluate('({focus:document.activeElement.tagName+"#"+document.activeElement.id,open:document.querySelector("#story-instruments").open,question:document.querySelector("#board-question-money").open,hash:location.hash,top:document.getElementById("board-questions").getBoundingClientRect().top,margin:getComputedStyle(document.getElementById("board-questions")).scrollMarginTop,padding:getComputedStyle(document.documentElement).scrollPaddingTop,scrollY})'));
  await capture('board-paths-failure.png');
  await fs.writeFile(path.join(output,'browser-failure.json'),JSON.stringify({url,checks,errors,failure:String(error)},null,2)+'\n');
  throw error;
} finally {
  const stopped = new Promise(resolve => browser.once('exit',resolve));
  try{await send('Browser.close',{},null);}catch{/* Only this isolated browser is cleaned up. */}
  if(browser.exitCode===null) browser.kill();
  await stopped;
  await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
