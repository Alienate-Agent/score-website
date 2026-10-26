import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {summarizeWallet, fetchSocietyWallet, walletResponse, formatWalletBalance, TREASURY_SOURCE} from '../lib/society-wallet.mjs';
const now=Date.now();
const books=()=>({wallet:{address:'0xa7F7985eB19b8c44F12A0654Df1eF89d1dd527C9',network:'base',asset:'USDC'},onchain_cents:4258438,onchain_checked_at:now-1000,onchain_age_ms:1000,onchain_is_stale:false,booked_cents:-12161,assets:{complete:false,total_cents:null},entries:[{description:'unreviewed upstream prose'}]});
const response=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
test('wallet amount is independent of ledger and missing other assets; upstream prose is excluded',()=>{
 const s=summarizeWallet(books(),now);assert.equal(s.balanceCents,4258438);assert.equal(formatWalletBalance(s.balanceCents),'42,584.38');assert.equal(s.stale,false);assert.equal(s.source,TREASURY_SOURCE);assert(!JSON.stringify(s).includes('unreviewed'));assert(!('entries'in s));
});
test('zero is a valid observed balance; unknown is never zero',()=>{const b=books();b.onchain_cents=0;assert.equal(summarizeWallet(b,now).balanceCents,0);b.onchain_cents=null;assert.throws(()=>summarizeWallet(b,now));});
for(const [field,value] of [['onchain_cents',-1],['onchain_cents','4258438'],['onchain_cents',Number.MAX_SAFE_INTEGER+1],['onchain_checked_at',null],['onchain_checked_at',now+120000],['onchain_age_ms',-1],['onchain_is_stale',undefined]])test(`rejects invalid ${field}: ${String(value)}`,()=>assert.throws(()=>summarizeWallet({...books(),[field]:value},now)));
for(const field of ['address','network','asset'])test(`rejects a different ${field}`,()=>{const b=books();b.wallet[field]='elsewhere';assert.throws(()=>summarizeWallet(b,now));});
test('respects source stale flag and independently detects an old timestamp',()=>{assert(summarizeWallet({...books(),onchain_is_stale:true},now).stale);assert(summarizeWallet({...books(),onchain_checked_at:now-360000},now).stale);});
test('fetch is a fixed public GET, does not forward credentials, and accepts the documented feed',async()=>{
 const s=await fetchSocietyWallet(async(url,options)=>{assert.equal(url,TREASURY_SOURCE);assert.equal(options.method,'GET');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'manual');assert.deepEqual(options.headers,{Accept:'application/json'});return response(books());});assert.equal(s.balanceCents,4258438);
});
for(const [label,make] of [['HTTP failure',()=>new Response('private error',{status:503})],['redirect',()=>new Response(null,{status:302,headers:{location:'https://elsewhere.invalid'}})],['HTML',()=>new Response('<html/>',{headers:{'Content-Type':'text/html'}})],['malformed JSON',()=>new Response('{',{headers:{'Content-Type':'application/json'}})],['declared size',()=>new Response('{}',{headers:{'Content-Type':'application/json','Content-Length':'1048577'}})],['stream size',()=>new Response(' '.repeat(1048577),{headers:{'Content-Type':'application/json'}})]])test(`rejects ${label}`,async()=>assert.rejects(()=>fetchSocietyWallet(async()=>make())));
test('rejects selectors and non-GET methods without contacting the board',async()=>{
 let count=0;const f=async()=>{count++;return response(books())};
 assert.equal((await walletResponse(new Request('https://site.test/api/society-wallet?address=other'),f)).status,400);
 assert.equal((await walletResponse(new Request('https://site.test/api/society-wallet',{method:'POST'}),f)).status,405);assert.equal(count,0);
});
test('concurrent refreshes share one read; failures are sanitized and a later click can recover',async()=>{
 let release,calls=0;const req=()=>new Request('https://site.test/api/society-wallet');
 const f=async()=>{calls++;await new Promise(r=>release=r);throw Error('secret upstream text')};
 const a=walletResponse(req(),f),b=walletResponse(req(),f);release();const failed=await Promise.all([a,b]);assert.equal(calls,1);for(const r of failed){assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'unavailable'});}
 const r=await walletResponse(req(),async()=>response(books()));assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');
});
const uiSource=await readFile(new URL('../public/entrance/wallet.js',import.meta.url),'utf8');
function ui(fetcher){let click;const button={hidden:true,disabled:false,addEventListener:(_,fn)=>click=fn},amount={textContent:'42,584.38',dataset:{checkedAt:new Date(now-5000).toISOString()}},status={textContent:'Saved snapshot'},checkedDate={textContent:'Saved date',dateTime:amount.dataset.checkedAt};
 vm.runInNewContext(uiSource,{document:{querySelector:s=>({'[data-wallet-refresh]':button,'[data-wallet-value]':amount,'[data-wallet-status]':status,'[data-wallet-date]':checkedDate}[s])},fetch:fetcher,Intl,Date,Number,AbortSignal});return{button,amount,status,checkedDate,click:()=>click()};}
test('reader refresh is opt-in and updates only the wallet after success',async()=>{let calls=0;const u=ui(async()=>{calls++;return response(summarizeWallet({...books(),onchain_cents:12345},now))});assert.equal(calls,0);assert.equal(u.button.hidden,false);await u.click();assert.equal(calls,1);assert.equal(u.amount.textContent,'123.45');assert.match(u.status.textContent,/Wallet refreshed/);assert.equal(u.checkedDate.dateTime,u.amount.dataset.checkedAt);assert.notEqual(u.checkedDate.textContent,'Saved date');assert.equal(u.button.disabled,false);});
for(const kind of ['network','stale','invalid'])test(`reader retains displayed balance after ${kind}`,async()=>{const u=ui(async()=>{if(kind==='network')throw Error('offline');return response(kind==='invalid'?{}:summarizeWallet({...books(),onchain_is_stale:true},now))});await u.click();assert.equal(u.amount.textContent,'42,584.38');assert.match(u.status.textContent,/unchanged|still shown/);assert.equal(u.checkedDate.textContent,'Saved date');assert.equal(u.button.disabled,false);});
test('reader prevents repeated clicks while a request is pending',async()=>{let release,calls=0;const u=ui(async()=>{calls++;await new Promise(r=>release=r);return response(summarizeWallet(books(),now))});const a=u.click();await u.click();assert.equal(calls,1);release();await a;assert.equal(u.button.disabled,false);});

test('reader does not replace a newer observation with an older cache result',async()=>{const u=ui(async()=>response(summarizeWallet({...books(),onchain_cents:111,onchain_checked_at:now-10000},now)));await u.click();assert.equal(u.amount.textContent,'42,584.38');assert.match(u.status.textContent,/older data/);});
