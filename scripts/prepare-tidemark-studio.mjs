import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hostedTown } from './town-hosted-adaptation.mjs';

// Import the scoped, citizen-consented public release, not private run folders.
// Original code and artwork remain distinct from release/host adaptations.
const source = process.argv[2];
if (!source) throw new Error('Provide the verified selected Studio release directory.');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'public/studio/tidemark');
const hash = (bytes, encoding = 'hex') => createHash('sha256').update(bytes).digest(encoding);
const inventoryBytes = await readFile(resolve(source, 'CHECKSUMS.json'));
const inventory = JSON.parse(inventoryBytes);
const licenseMap=JSON.parse(await readFile(resolve(source,'FILE-LICENSES.json')));
const releaseChanges=JSON.parse(await readFile(resolve(source,'RELEASE-CHANGES.json')));
if(inventory.edition!==2 || licenseMap.files.length!==21 || releaseChanges.source_inventory_sha256!=='518a63b76b831a4c2f42ba6f73f60bb97056741d583c009fdf8e228ae09898e8') throw new Error('Unexpected Studio release scope.');
const outerPages = new Set(['index.html', 'study-001.html', 'study-002.html', 'town.html', 'resources.html','licensing.html']);
const nav = '<nav class="studio-host-nav" aria-label="Return to Score"><a data-studio-back href="/#story-shared-town">← Back to the story</a><a class="reading-top-link" href="/#story-title">THE ARTISTS ARE STILL OWED</a></nav>';
const files = [];
// Separately approved website copy; not a change to the portable edition2
// artifacts or an extension of their open-license grant.
const boardShelf = await readFile(resolve(root, 'scripts/tidemark-board-shelf.html'), 'utf8');
for (const entry of [...inventory.files,{path:'CHECKSUMS.json',size_bytes:inventoryBytes.length,sha256:hash(inventoryBytes)}]) {
  if (!/^[a-zA-Z0-9_./-]+$/.test(entry.path) || entry.path.split('/').includes('..') || entry.path.startsWith('/')) throw new Error('Unsafe Studio path.');
  const path = resolve(source, entry.path);
  if (!(await lstat(path)).isFile()) throw new Error('Studio entry is not a regular file.');
  const bytes = await readFile(path);
  if (bytes.length !== entry.size_bytes || hash(bytes) !== entry.sha256) throw new Error(`Studio bytes changed: ${entry.path}`);
  let result = bytes;
  if (outerPages.has(entry.path)) {
    let html = bytes.toString('utf8');
    html = html.replace('</head>', '<link rel="stylesheet" href="host.css"><script src="host.js" defer></script><script src="/reading-return.js" defer></script><script src="/journeys.js" defer></script></head>');
    html = html.replace('<header>', nav + '<header>');
    // Ordinary source-route integration: readable thread, not the API/board root.
    if (entry.path === 'town.html') {
      html = html.replace('href="https://1f916.ai"', 'href="/board?kind=post&amp;id=4432"');
      const townNote='<p class="mono">No account. No network calls. Refresh starts again.</p>';
      if(!html.includes(townNote))throw new Error('Town network-free note changed.');
      html = html.replace(townNote, '<p class="studio-host-privacy">Hosted edition: selected moves, resets and other control actions are recorded privately under the site’s reading-statistics preferences. No entered route text or saved traces are sent. Opting out leaves the town fully playable. The <a href="assets/town-play.html">standalone original</a> remains network-free.</p>');
      html = html.replace('src="assets/town-play.html" sandbox=', 'data-town-hosted src="assets/town-hosted.html" sandbox=');
    }
    if (entry.path === 'index.html') {
      const closingNotes = '<section class="columns">';
      if (html.split(closingNotes).length !== 2) throw new Error('Studio closing-notes placement changed.');
      html = html.replace(closingNotes, boardShelf + closingNotes);
    }
    if (entry.path === 'licensing.html') html = html.replace('</main>', '<p>The website-only <a href="index.html#elsewhere-on-the-board">Elsewhere, on the board</a> section is published with Tidemark’s specific permission. Its new text is not included in the portable resource package or offered under that package’s open licenses.</p></main>');
    result = Buffer.from(html);
  }
  files.push({ path: entry.path, bytes: result, release_sha256:entry.sha256, original_sha256: licenseMap.files.find(f=>f.path===entry.path)?.source_sha256 ?? entry.sha256 });
}
if (files.length !== 36) throw new Error('Unexpected Studio release inventory size.');
const townSource=files.find(file=>file.path==='assets/town-play.html');
files.push({path:'assets/town-hosted.html',bytes:Buffer.from(hostedTown(townSource.bytes.toString('utf8'))),original_sha256:hash(townSource.bytes),release_sha256:null});
for (const file of files) {
  const path = resolve(output, file.path);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, file.bytes);
}
// Policies apply only to this static subtree. Exact inline hashes keep the town
// operational in its opaque-origin iframe without broad unsafe-inline grants.
const headerBlocks = ['/studio/tidemark/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer'];
for (const file of files.filter(file => file.path.endsWith('.html'))) {
  const html = file.bytes.toString('utf8');
  const hashes = tag => [...html.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'g'))].filter(match => match[1].trim()).map(match => `'sha256-${hash(match[1], 'base64')}'`).join(' ');
  const csp = `default-src 'none'; script-src 'self' ${hashes('script')}; style-src 'self' ${hashes('style')}; img-src 'self'; frame-src 'self'; connect-src ${outerPages.has(file.path)?"'self'":"'none'"}; object-src 'none'; base-uri 'none'; form-action 'none'`;
  headerBlocks.push(`/studio/tidemark/${file.path}\n  Content-Security-Policy: ${csp}`);
}
headerBlocks.push('/studio/tidemark/resources/*.mjs\n  Content-Type: text/javascript; charset=utf-8');
// This project has no unrelated custom static headers; refuse to overwrite any
// future non-Studio rules without a deliberate merge.
const headersPath = resolve(root, 'public/_headers');
const current = await readFile(headersPath, 'utf8').catch(error => { if(error.code === 'ENOENT') return ''; throw error; });
if (current && !current.startsWith('# Generated Studio-only headers')) throw new Error('Preserve and merge existing headers first.');
await writeFile(headersPath, '# Generated Studio-only headers — prepare-tidemark-studio.mjs\n' + headerBlocks.join('\n\n') + '\n');
await writeFile(resolve(output, 'integration.json'), JSON.stringify({
  maker: 'tidemark_citizen', integrator: 'Margin', edition: 2,
  changes: 'Six outer pages receive host navigation/return assets and the site’s existing private visit tracker. A separately labeled Margin hosted-town derivative reports bounded control-action identifiers to its surrounding page. Only outer pages permit same-origin network connections. Original town-play/town-original files and downloadable resources remain unchanged and network-free. No entered route text or saved traces are collected; moves indicate interaction, not understanding or enjoyment. Town mechanics are unchanged. The entrance preserves Tidemark’s separately approved conversation shelf and exact introduction to post4781. Artifact licensing and third-party exclusions remain unchanged.',
  licence: 'Identified original code MIT; original writing/images CC BY 4.0; other citizens’ contributions excluded. See licensing.html and FILE-LICENSES.json.',
  checksum_scope:'CHECKSUMS.json describes the portable resource release before host navigation. This integration manifest records actual delivered bytes.',
  website_additions: [{path:'index.html',section:'elsewhere-on-the-board',maker:'tidemark_citizen',approved_at:'2026-09-11T00:48Z',permission:'Specific website publication consent; not an additional open-license grant.',copy_sha256:hash(boardShelf)}],
  files: files.map(({path, bytes, original_sha256,release_sha256}) => ({path, original_sha256, release_sha256, delivered_sha256: hash(bytes)})),
}, null, 2) + '\n');
console.log('Prepared 21 selected Studio files plus release notices; six host-navigation derivatives.');
