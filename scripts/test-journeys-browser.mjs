import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {testDatabase,testJourneyGuards} from './journey-test-db.mjs';
import {ingestJourney,journeyConfig,journeyReport} from '../lib/journeys.mjs';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const db=testDatabase();
const env={JOURNEYS:db,JOURNEY_KEY:randomBytes(32).toString('hex'),JOURNEYS_ENABLED:'1',JOURNEY_EDITION:'abc12345',...testJourneyGuards(db)};
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const host='https://score-website.alienate-agent.workers.dev';
const errors=[],payloads=[];let legacyWrites=0,network='203.0.113.7';
const html=`<!doctype html><html><head><meta charset="utf-8"></head><body>
<section aria-labelledby="story-beginning"><h2 id="story-beginning">Prelude</h2><a href="#story-tidemark">Tidemark</a><details><summary>Details</summary>A source.</details></section>
<section aria-labelledby="story-tidemark"><h2 id="story-tidemark">Tidemark</h2>
<button id="conversation">Open conversation</button><button id="sound">Sound</button></section>
<div id="overlay"></div><div id="margin"></div>
<script>
conversation.onclick=()=>{overlay.innerHTML='<div class="conversation-reader" role="dialog"><article data-conversation-act="post:3581" data-entry="true">Public source</article><button id="close">Close</button></div>';document.getElementById('close').onclick=()=>{overlay.innerHTML='';};};
sound.onclick=()=>{margin.innerHTML='<aside data-mini-panel data-mini-act="tidemark:post:3581" data-state="ready"><button id="play">Play</button></aside>';document.getElementById('play').onclick=()=>{margin.firstChild.dataset.state='playing';};};
</script><script src="/journeys.js" defer></script><script src="/engagement.js" defer></script></body></html>`;
async function context(options={}) {
  const ctx=await browser.newContext(options);
  await ctx.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin!==host){await route.abort();return;}
    if(url.pathname==='/journeys.js'||url.pathname==='/engagement.js'){
      await route.fulfill({contentType:'text/javascript; charset=utf-8',body:readFileSync(new URL('../public'+url.pathname,import.meta.url),'utf8')});return;
    }
    if(url.pathname==='/api/engagement'){legacyWrites++;await route.fulfill({status:204});return;}
    if(url.pathname==='/api/journeys'){
      const request=new Request(req.url(),{method:req.method(),headers:{...req.headers(),'CF-Connecting-IP':network},...(req.method()==='POST'?{body:req.postData()}: {})});
      if(req.method()==='POST')payloads.push(JSON.parse(req.postData()));
      const result=req.method()==='GET'?journeyConfig(request,env):await ingestJourney(request,env);
      await route.fulfill({status:result.status,headers:Object.fromEntries(result.headers),body:await result.text()});return;
    }
    await route.fulfill({contentType:'text/html',body:html});
  });
  ctx.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  return ctx;
}
const rowCount=()=>db.sqlite.prepare('SELECT COUNT(*) n FROM journey_events').get().n;
const totals=()=>journeyReport(db,{from:Date.now()-3600000,to:Date.now()+10000});
async function settle(page){await page.waitForTimeout(5500);}
try {
  const ctx=await context();const page=await ctx.newPage();
  await page.goto(host+'/#story-beginning');await page.waitForSelector('#score-privacy');
  await settle(page);
  assert.equal(db.sqlite.prepare("SELECT area FROM journey_events WHERE action='view'").get().area,'prelude');
  const visitor=db.sqlite.prepare('SELECT visitor_id FROM journey_visitors').get().visitor_id;
  assert((await ctx.cookies()).some(c=>c.name==='__Host-score-visitor'&&c.httpOnly&&c.secure));
  await page.getByRole('link',{name:'Tidemark',exact:true}).click();await settle(page);
  assert(db.sqlite.prepare("SELECT 1 FROM journey_events WHERE action='navigate' AND target='story-tidemark'").get());
  await page.getByRole('button',{name:'Open conversation',exact:true}).click();await settle(page);
  assert(db.sqlite.prepare("SELECT 1 FROM journey_events WHERE action='conversation_open' AND target='post:3581'").get());
  await page.getByRole('button',{name:'Close',exact:true}).click();await settle(page);
  assert(db.sqlite.prepare("SELECT 1 FROM journey_events WHERE action='conversation_close'").get());
  await page.getByRole('button',{name:'Sound',exact:true}).click();await page.waitForTimeout(250);
  await page.getByRole('button',{name:'Play',exact:true}).click();await settle(page);
  assert(db.sqlite.prepare("SELECT 1 FROM journey_events WHERE action='play' AND target='post:3581'").get());
  await page.locator('#score-privacy').evaluate(el=>{el.open=true;});
  await page.getByRole('button',{name:'Mark this browser as a tester',exact:true}).click();await settle(page);
  assert.equal((await totals()).included_sessions,0);assert((await totals()).excluded_sessions>=1);
  await page.reload();await page.waitForSelector('#score-privacy');await settle(page);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM journey_visitors').get().n,1);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('score-analytics-tester')).tester),true);
  await page.locator('#score-privacy').evaluate(el=>{el.open=true;});
  assert.deepEqual(await page.locator('#score-privacy button').allTextContents(),['Turn off reading statistics','Tester browser · include again'],JSON.stringify(errors));
  await page.getByRole('button',{name:'Tester browser · include again',exact:true}).click();await settle(page);
  assert.equal((await totals()).excluded_sessions,0);
  // New visit from another IP, same first-party browser identifier.
  await page.evaluate(()=>localStorage.removeItem('score-journey-session'));
  network='198.51.100.9';await page.reload();await page.waitForSelector('#score-privacy');await settle(page);
  assert.equal((await totals()).included_browsers,1);assert((await totals()).included_sessions>=2);
  assert.equal(db.sqlite.prepare('SELECT visitor_id FROM journey_visitors').get().visitor_id,visitor);
  const ctxB=await context();const second=await ctxB.newPage();await second.goto(host);await second.waitForSelector('#score-privacy');await settle(second);
  assert.equal((await totals()).included_browsers,2);
  assert((await totals()).networks.some(n=>n.browsers===2));
  await ctxB.close();
  await page.locator('#score-privacy').evaluate(el=>{el.open=true;});
  await page.getByRole('button',{name:'Turn off reading statistics',exact:true}).click();await settle(page);
  const before=rowCount();await page.getByRole('link',{name:'Tidemark',exact:true}).click();await settle(page);assert.equal(rowCount(),before);
  await ctx.close();
  const dnt=await context({extraHTTPHeaders:{DNT:'1'}});await dnt.addInitScript(()=>Object.defineProperty(navigator,'doNotTrack',{value:'1'}));
  const privacyPage=await dnt.newPage();await privacyPage.goto(host);await privacyPage.waitForSelector('#score-privacy');await settle(privacyPage);assert.equal(rowCount(),before);await dnt.close();
  assert.equal(legacyWrites,0,'No double-counting in the old aggregate stream');
  assert(payloads.every(p=>!JSON.stringify(p).includes('203.0.113.')&&!JSON.stringify(p).includes('Public source')));
  assert.deepEqual(errors,[]);
  console.log('PASS real browser: signed cookie, deep arrival, navigation, conversation, margin sound, persistent/reversible tester control, repeat visits across IPs, shared-IP browsers, opt-out, DNT and no legacy double-counting. All requests intercepted; no production collection.');
} finally {await browser.close();db.sqlite.close();}
