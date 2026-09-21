import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {storyPresent} from '../lib/story-present.ts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const input=resolve(root,'content/entrance');
const output=resolve(root,'public/entrance');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const times=readFileSync(resolve(root,'lib/site-update-times.ts'),'utf8');
const updated=times.match(/siteUpdatedAt = '([^']+)'/)[1];
const reviewPath=times.match(/import boardReview from '@\/([^']+)'/)[1];
const checked=JSON.parse(readFileSync(resolve(root,reviewPath),'utf8')).observed_at;
const utc=value=>new Date(value).toISOString().replace('T',' ').replace(/\.\d{3}Z$/,' UTC');
const routes={'index.html':'/','journal.html':'/journal','episode.html':'/episode','journal-missing-post.html':'/journal/missing-post','journal-who-owes.html':'/journal/who-owes','journal-one-ballot.html':'/journal/one-ballot'};
const footer=`<footer><span>SCORE · An ongoing artwork</span><nav aria-label="More from the artwork"><a href="/record">Full record</a><a href="/record#resources">Resources</a><a href="/record#all-record-search">Search</a><a href="/record#correspondence">Correspondence</a><a href="/record#story-about">About</a><a href="/featured">Previously featured</a><a href="/changelog">Website changelog</a><a href="/record#score-privacy">Privacy</a></nav><div class="footer-update-times"><p>Site updated <time datetime="${updated}">${utc(updated)}</time></p><p>Campaign review · 1F916.ai board <time datetime="${checked}">${utc(checked)}</time></p></div></footer>`;
mkdirSync(output,{recursive:true});
for(const [file,route] of Object.entries(routes)){
 let html=readFileSync(resolve(input,file),'utf8');
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
   const summary=esc(storyPresent.compactSummary);
   html=html.replace(/<div class="status-body">[\s\S]*?<div class="goal-path"/,`<div class="status-body"><p>${summary}</p><p class="reminder">No art purchase through the campaign is recorded in the reviewed material. The artists are still owed.</p><div class="status-bottom"><time datetime="${storyPresent.asOf}">Reviewed ${esc(storyPresent.label)}</time><a href="/record#story-recent-developments">Read the developments</a></div></div>\n<div class="goal-path"`);
   html=html.replace('</head>','<script type="module" src="/entrance/legacy-links.js"></script></head>');
 }
 html=html.replace('</head>',`<link rel="canonical" href="https://taasoart.com${route}"></head>`);
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
