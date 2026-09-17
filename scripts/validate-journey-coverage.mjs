import {readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROUTES,safeTarget,describeTarget} from '../public/journey-map.mjs';

// Release gate: routes are discovered, not copied into another allowlist.
// Main narrative targets include dynamically authored scene IDs.
export function validateJourneyCoverage(root=resolve(dirname(fileURLToPath(import.meta.url)),'..')) {
  const missing=[],routes=[];let sections=0;
  for(const file of readdirSync(resolve(root,'app'),{recursive:true}).filter(f=>/(^|\/)page\.tsx$/.test(f))){
    const route='/'+file.replace(/(^|\/)page\.tsx$/,'');routes.push(route);
    if(!Object.hasOwn(ROUTES,route))missing.push('Page route: '+route);
  }
  for(const dir of ['public/studio/tidemark','public/lens'])for(const file of readdirSync(resolve(root,dir)).filter(f=>f.endsWith('.html'))){
    const source=readFileSync(resolve(root,dir,file),'utf8');
    if(!source.includes('/journeys.js'))continue; // embedded engines are intentionally not visits
    const route='/'+dir.slice(7)+'/'+file;
    if(!Object.hasOwn(ROUTES,route)&&!(route==='/lens/index.html'&&ROUTES['/lens']))missing.push('Static tracked page: '+route);
    routes.push(route);
  }
  for(const file of ['unfolding-story.tsx','story-layers.tsx','story-button-sequence.tsx','later-public-speech.tsx','agent-resources.tsx','live-agent-stats.tsx','correspondence-form.tsx','cross-record-search.tsx']){
    const source=readFileSync(resolve(root,'components',file),'utf8');
    for(const [,id] of source.matchAll(/<(?:section|details|h[123])\b[^>]*\bid="([a-z][a-z0-9-]+)"/g)){
      sections++;if(!safeTarget(id))missing.push(`${file}: ${id}`);
    }
  }
  const scenes=readFileSync(resolve(root,'lib/story-present.ts'),'utf8');
  for(const [,id] of scenes.matchAll(/["']?id["']?\s*:\s*["'](story-[^"']+)["']/g)){if(!safeTarget(id))missing.push('Authored scene: '+id);}
  const contents=readFileSync(resolve(root,'components/site-contents.tsx'),'utf8');
  for(const [,id] of contents.matchAll(/["']#([^"']+)["']/g)){if(!safeTarget(id))missing.push('Contents link: '+id);}
  if(missing.length)throw Error('Analytics destination map is out of date. Add a safe ID and descriptive label to public/journey-map.mjs:\n'+missing.join('\n'));
  for(const route of routes){if(route.includes('?'))throw Error('Unexpected query in route inventory');}
  if(!describeTarget('studio-neither-path'))throw Error('Museum study missing');
  return {routes:routes.length,namedSections:sections};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('PASS journey destination coverage',validateJourneyCoverage());
