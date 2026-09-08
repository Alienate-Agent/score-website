import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

// Isolated, muted Chromium. Never attaches to the operator's browser profile.
const [url, output] = process.argv.slice(2);
if (!url || !output || !['localhost','127.0.0.1'].includes(new URL(url).hostname)) throw Error('Supply an exact localhost instrument URL and private output directory');
const profile = await fs.mkdtemp(path.join(os.tmpdir(),'score-lens-browser-'));
await fs.mkdir(output,{recursive:true});
const browser = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--disable-background-networking','--disable-sync','--mute-audio',
  '--remote-debugging-pipe',`--user-data-dir=${profile}`,'about:blank'
],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let seq=0,buffer='',sessionId,attachedTarget;const pending=new Map(),errors=[],checks=[];
const appendCheck=checks.push.bind(checks);checks.push=(message)=>{console.log('PASS: '+message);return appendCheck(message);};
browser.stderr.on('data',()=>{});
browser.on('error',error=>{for(const p of pending.values())p.reject(error);});
browser.stdio[4].on('data',chunk=>{buffer+=chunk;let end;while((end=buffer.indexOf('\0'))>=0){const msg=JSON.parse(buffer.slice(0,end));buffer=buffer.slice(end+1);if(msg.id){const p=pending.get(msg.id);if(p){clearTimeout(p.timeout);pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}}else if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails);}});
function send(method,params={},target=sessionId){return new Promise((resolve,reject)=>{const id=++seq;const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timed out: '+method));},15000);pending.set(id,{resolve,reject,timeout});browser.stdio[3].write(JSON.stringify({id,method,params,...(target?{sessionId:target}:{})})+'\0');});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function waitFor(condition){const start=Date.now();while(Date.now()-start<10000){try{if(await evaluate(`Boolean(${condition})`))return;}catch(error){if(!/navigated or closed|context was destroyed|Cannot find context/.test(error.message))throw error;await send('Target.getTargetInfo',{targetId:attachedTarget},null);}await new Promise(resolve=>setTimeout(resolve,40));}throw Error('Condition timed out: '+condition);}
async function key(selector,key,code=key){await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key,code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code});}
async function click(selector){const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});}
async function screenshot(name){const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(path.join(output,name),Buffer.from(data,'base64'));}
try{
  const {targetId}=await send('Target.createTarget',{url:'about:blank'},null);
  attachedTarget=targetId;
  ({sessionId}=await send('Target.attachToTarget',{targetId,flatten:true},null));
  await send('Page.enable');await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__testAudio=[];const OriginalAudioContext=window.AudioContext;window.AudioContext=new Proxy(OriginalAudioContext,{construct(Target,args){const ctx=new Target(...args);window.__testAudio.push(ctx);return ctx;}});`});
  await send('Page.navigate',{url});
  await waitFor(`window.E14 && document.querySelector('.knob') && E14.scoreDocument().inputs_ready`);
  assert.equal(await evaluate('__testAudio.length'),0);checks.push('Full browser page initializes, both fixed files load, no autoplay');
  const initial=await evaluate(`({pitch:E14.OPT.pitch,bass:E14.OPT.bass,level:document.getElementById('listen-level').value,selected:document.getElementById('inspect-record').value,source:document.getElementById('inspect-source').getAttribute('href')})`);
  assert.equal(initial.pitch,'safe');assert.equal(initial.bass,'hour');assert.equal(initial.level,'0.08');assert.equal(initial.selected,'tidemark:comment:32752');assert.equal(initial.source,'/#public-record-tidemark%3Acomment%3A32752');checks.push('Conservative defaults; deep-linked source inspection without playback');
  await screenshot('instrument-wide.png');
  await key('.knob[data-k="pitch"]','ArrowRight');
  assert.equal(await evaluate('E14.OPT.pitch'),'none');
  assert.equal(await evaluate('document.activeElement.dataset.k'),'pitch');checks.push('Pitch knob keyboard change and focus retention');
  await key('.sw[data-w="perc"]','Enter');assert.equal(await evaluate('E14.OPT.perc'),'beats');
  checks.push('Percussion switch keyboard activation');
  const switchFocus=await evaluate('document.activeElement.dataset.w || null');
  assert.equal(switchFocus,'perc');assert.equal(await evaluate('document.activeElement.getAttribute("aria-label")'),'Percussion');checks.push('Named switch retains keyboard focus after re-render');
  await key('.knob[data-k="time"]','ArrowRight');assert.equal(await evaluate('E14.OPT.time'),'fold');
  assert.equal(await evaluate('E14.selectedStart'),await evaluate('E14.REC().find(rc=>rc.r.key===document.getElementById("inspect-record").value).at'));checks.push('Selected-act playback start follows changed time mapping');
  await key('#facestrip','ArrowRight');
  await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
  assert.equal(await evaluate('document.getElementById("facehead").style.left'),'5%');
  assert.equal(await evaluate('__testAudio.length'),0);checks.push('Keyboard seek preview persists through animation frames without starting audio');
  await key('#seat-tide','ArrowLeft');await key('#seat-tide','Enter');
  assert.equal(await evaluate('E14.OPT.reg'),'role');assert.ok(Number.isFinite(await evaluate('E14.PANOVR.Tidemark')));checks.push('Seat keyboard movement applies register and pan');
  await click('#fplay');await waitFor(`__testAudio.length===1 && __testAudio[0].state==='running'`);
  await key('#fstop','Escape');await waitFor(`__testAudio[0].state==='closed'`);checks.push('Deliberate Play creates real running AudioContext; Escape closes it (browser muted)');
  await click('#fplay');await waitFor(`__testAudio.length===2 && __testAudio[1].state==='running'`);await click('#fstop');await waitFor(`__testAudio[1].state==='closed'`);checks.push('Visible Stop closes a second playback context');
  const exportResult=await evaluate(`(()=>{const s=E14.scoreDocument();return {generator:s.generator,notes:s.rendered_notes.length,comments:s.calculated_events.filter(e=>e.kind==='board_comment').length,finite:s.rendered_notes.every(n=>Number.isFinite(n.output_hz)&&n.output_hz>=60&&n.output_hz<4000)};})()`);
  assert.ok(exportResult.notes>0&&exportResult.comments>0&&exportResult.finite);checks.push('Real-browser calculated export includes comments and bounded rendered frequencies');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate('window.scrollTo(0,0)');await screenshot('instrument-narrow.png');
  const layout=await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,viewportWidth:document.documentElement.clientWidth})`);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".lens-intro h1")).whiteSpace'),'normal');
  assert.equal(await evaluate('!!document.getElementById("stage").closest(".transport")'),false);checks.push('Wrapping heading; stage scrolls independently rather than enlarging sticky playback controls');
  // A previous performance's delayed end must not close a new performance.
  await evaluate('E14.play(E14.TOTAL()+1)');
  await waitFor(`document.getElementById('state').textContent.includes('ended')`);
  await click('#fplay');
  await evaluate('new Promise(resolve=>setTimeout(resolve,3300))');
  assert.equal(await evaluate('__testAudio.at(-1).state'),'running');
  await click('#fstop');checks.push('Old end timer cannot close newly started playback');
  await click('#inspect-source');await waitFor(`location.hash==='#public-record-tidemark%3Acomment%3A32752' && document.querySelector('[data-public-record-key="tidemark:comment:32752"]')`);checks.push('Source return opens the exact public record in the story site');
  await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*board-comments.json*']});
  await send('Page.navigate',{url});
  await waitFor(`document.getElementById('load-status')?.textContent.includes('did not load')`);
  assert.equal(await evaluate('document.getElementById("fplay").disabled'),true);
  assert.equal(await evaluate('document.getElementById("dl").disabled'),true);
  await click('#fplay');assert.equal(await evaluate('__testAudio.length'),0);
  checks.push('Missing fixed input blocks Play and export with explicit infrastructure-failure text, not citizen silence');
  const report={checks,initial,switchFocus,layout,exportResult,browserExceptions:errors,limits:'Headless browser muted. Not an acoustic, screen-reader, all-device or artistic-success certification.'};
  await fs.writeFile(path.join(output,'browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  assert.equal(errors.length,0,'No uncaught browser exceptions');
}finally{
  try{await send('Browser.close',{},null);}catch{}browser.kill();
  for(const p of pending.values())clearTimeout(p.timeout);
  await fs.rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
