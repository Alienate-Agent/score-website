import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {storyPresent} from '../lib/story-present.ts';
import {homepageEditorial} from '../content/homepage-editorial.mjs';
import {blueskyFollowLink,journalFollowInvitation,blueskyHeaderLink} from '../content/follow-invitations.mjs';
import {formatWalletBalance} from '../lib/society-wallet.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const input=resolve(root,'content/entrance');
const wallet=JSON.parse(readFileSync(resolve(root,'content/society-wallet.json'),'utf8'));
const walletAmount=formatWalletBalance(wallet.balanceCents);
const walletDate=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',timeZone:'America/New_York',timeZoneName:'short'}).format(new Date(wallet.checkedAt));
if(wallet.asset!=='USDC'||wallet.network!=='Base'||wallet.stale||!/^\/records\/society-wallet-[\w.-]+\.json$/.test(wallet.record))throw Error('Invalid saved wallet snapshot');
if(JSON.parse(readFileSync(resolve(root,'public'+wallet.record),'utf8')).checkedAt!==wallet.checkedAt)throw Error('Wallet source record mismatch');
const output=resolve(root,'public/entrance');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const times=readFileSync(resolve(root,'lib/site-update-times.ts'),'utf8');
const updated=times.match(/siteUpdatedAt = '([^']+)'/)[1];
const reviewPath=times.match(/import boardReview from '@\/([^']+)'/)[1];
const checked=JSON.parse(readFileSync(resolve(root,reviewPath),'utf8')).observed_at;
const utc=value=>new Date(value).toISOString().replace('T',' ').replace(/\.\d{3}Z$/,' UTC');
const routes={'index.html':'/','journal.html':'/journal','episode.html':'/episode','journal-missing-post.html':'/journal/missing-post','journal-who-owes.html':'/journal/who-owes','journal-one-ballot.html':'/journal/one-ballot'};
const footer=`<footer><span>SCORE · An ongoing artwork</span><nav aria-label="More from the artwork"><a href="/record">Full record</a><a href="/resources">Resources</a><a href="/search">Search</a><a href="/correspondence">Correspondence</a><a href="/about">About</a><a href="/featured">Previously featured</a><a href="/changelog">Website changelog</a><a href="/privacy">Privacy</a></nav><div class="footer-update-times"><p>Site updated <time datetime="${updated}">${utc(updated)}</time></p><p>Campaign review · 1F916.ai board <time datetime="${checked}">${utc(checked)}</time></p></div></footer>`;
mkdirSync(output,{recursive:true});
for(const [file,route] of Object.entries(routes)){
 let html=readFileSync(resolve(input,file),'utf8');
 html=html.replaceAll('<!-- bluesky-follow -->',blueskyFollowLink);
 if(file.startsWith('journal-'))html=html.replace('</main>',journalFollowInvitation+'</main>');
 html=html.replace('</head>','<link rel="stylesheet" href="/entrance/follow-invitations.css"></head>');
 html=html.replaceAll('assets/neither-path-invitation.svg','assets/neither-path-invitation.webp');
 html=html.replace(/<meta name="robots" content="noindex,nofollow">/g,'').replace(/<div class="study-note">[\s\S]*?<\/div>/g,'');
 html=html.replace(/ · local preview| — local study H/g,'');
 html=html.replace(/<footer>[\s\S]*?<\/footer>/,footer);
 html=html.replace(/\b(href|src)="([^"#]+)(#[^"]*)?"/g,(whole,attr,address,hash='')=>{
   if(routes[address])return `${attr}="${routes[address]}${hash}"`;
   if(address==='./')return `${attr}="/${hash}"`;
   if(address.startsWith('assets/'))return `${attr}="/entrance/${address}${hash}"`;
   if(/^[\w-]+\.(css|js|mjs|json)$/.test(address))return `${attr}="/entrance/${address}${hash}"`;
   if(address==='https://taasoart.com/'&&hash)return `${attr}="/record${hash}"`;
   if(address==='https://taasoart.com/')return `${attr}="/record"`;
   if(address.startsWith('https://taasoart.com/'))return `${attr}="${address.replace('https://taasoart.com','')}${hash}"`;
   return whole;
 });
 // US English applies only to site-authored copy, never frozen input bytes.
 html=html.replace('creative labour behind its training','creative labor behind its training');
 if(file==='index.html'){
   html=html.replace('<!-- wallet-amount -->',esc(walletAmount));
   html=html.replace('<!-- wallet-checked-at -->',esc(wallet.checkedAt));
   html=html.replace('<!-- wallet-controls -->',`<div class="wallet-update"><p data-wallet-status role="status" aria-live="polite">Wallet snapshot · <time datetime="${esc(wallet.checkedAt)}">${esc(walletDate)}</time></p><button type="button" data-wallet-refresh hidden>Refresh from the board <span aria-hidden="true">↻</span></button></div>`);
   html=html.replace('<!-- wallet-source -->',`<p>The saved wallet snapshot is ${esc(walletAmount)} USDC, checked ${esc(walletDate)}. It is refreshed with the daily editorial sweep. Use “Refresh from the board” to check the latest available balance for your visit.</p><p>This figure covers USDC held in the society’s wallet on Base. It does not include other assets and is not an approved art budget. A wallet refresh does not update the campaign’s art-payment record.</p><p><a href="${esc(wallet.record)}">Saved wallet source record</a> · <a href="https://1f916.ai/treasury" target="_blank" rel="noopener noreferrer">Open the board’s public books<span class="sr-only"> (new tab)</span></a></p>`);
   html=html.replace('</head>','<script type="module" src="/entrance/wallet.js"></script></head>');
   html=html.replace('</head>','<link rel="stylesheet" href="/entrance/newcomer.css"></head>');
   if(homepageEditorial.asOf!==storyPresent.asOf)throw new Error('Review the homepage explanation for the newly admitted edition before building.');
   html=html.replace(/<!-- blockers-date:start -->[\s\S]*?<!-- blockers-date:end -->/,`<!-- blockers-date:start -->From the campaign review · <time datetime="${esc(homepageEditorial.asOf)}">${esc(storyPresent.label)}</time> · Invitations by Margin<!-- blockers-date:end -->`);
   const blockerCards=homepageEditorial.blockers.map((blocker,index)=>`<article><p class="blocker-number">0${index+1}</p><h3>${esc(blocker.title)}</h3><p>${esc(blocker.context)}</p><div class="blocker-help"><h4>A way to help</h4><p>${esc(blocker.invitation)}</p></div><a class="text-link" href="${esc(blocker.href)}">${esc(blocker.linkLabel)} <span aria-hidden="true">→</span></a></article>`).join('\n');
   html=html.replace(/<!-- blockers:start -->[\s\S]*?<!-- blockers:end -->/,`<!-- blockers:start -->${blockerCards}<!-- blockers:end -->`);
   html=html.replace(/<h2 id="status-heading">[\s\S]*?<\/h2>/,`<h2 id="status-heading">${esc(homepageEditorial.statusHeading)}</h2>`);
   html=html.replace(/<div class="status-body">[\s\S]*?<div class="goal-path"/,`<div class="status-body"><p>${esc(homepageEditorial.statusSummary)}</p><p class="reminder">${esc(homepageEditorial.statusReminder)}</p><div class="status-bottom"><time datetime="${storyPresent.asOf}">Reviewed ${esc(storyPresent.label)}</time><a href="/journal/${storyPresent.asOf}">Read the latest update</a></div></div>\n<div class="goal-path"`);
   html=html.replace('</head>','<script type="module" src="/entrance/legacy-links.js"></script></head>');
 }
 html=html.replace('</head>',`<link rel="stylesheet" href="/entrance/site-continuity.css"><link rel="stylesheet" href="/entrance/social-link.css"><link rel="canonical" href="https://taasoart.com${route}"></head>`);
 const primary=`<nav aria-label="Main"><a href="/journal"${file.startsWith('journal')||file==='episode.html'?' aria-current="page"':''}>Journal</a><a href="/#agents">Agents</a><a href="/works">Works</a><a href="/charter">Charter</a><a href="/resources">Resources</a>${blueskyHeaderLink}</nav>`;
 html=html.replace(/<header class="masthead">([\s\S]*?)<\/header>/,(_,content)=>{
   const identity=content.match(/<a[^>]*class="identity"[\s\S]*?<\/a>/)?.[0];
   if(!identity)throw new Error(`Missing site identity in ${file}`);
   const local=file==='episode.html'?content.match(/<nav aria-label="Episode navigation">[\s\S]*?<\/nav>/)?.[0]||'':'';
   return `<header class="masthead site-static-header"><div class="site-static-row">${identity}${primary}</div>${local}<nav id="contextual-reading-return" aria-label="Return to your reading"></nav></header>`;
 });
 html=html.replace('href="/archive">Explore the full record','href="/record">Explore the full record');
 html=html.replace('<body','<body data-reading-mode="entrance" data-reading-return-ready="true"');
 // Same-site sources continue in this tab, retaining a return to the episode.
 html=html.replace(/<a\b[^>]*href="\/(?!\/)[^"]*"[^>]*>[\s\S]*?<\/a>/g,anchor=>anchor
   .replace(/ target="_blank"| rel="noopener"/g,'')
   .replace(/<span class="sr-only">\s*\([^<]*new tab\)<\/span>/g,'')
   .replaceAll(' (new tab)',''));
 html=html.replace('</body>','<script src="/journeys.js" defer></script><script src="/engagement.js" defer></script><script src="/reading-return.js" defer></script></body>');
 writeFileSync(resolve(output,file),html);
}
console.log(`Built ${Object.keys(routes).length} approved entrance/journal pages; review cutoff ${checked}.`);
