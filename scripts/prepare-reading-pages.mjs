import {copyFileSync,mkdirSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {runPrerender} from '../node_modules/vinext/dist/build/run-prerender.js';
import {PREPARED_PAGES} from '../lib/prepared-pages.mjs';

// Pinned vinext beta build API. Invoked only after the asset-sidecar repair.
// The prerenderer skips API handlers; all reading pages have no server fetches.
export async function prepareReadingPages(root){
 const discovered=readdirSync(resolve(root,'app'),{recursive:true}).filter(f=>/(^|\/)page\.tsx$/.test(f)).map(f=>'/'+f.replace(/(^|\/)page\.tsx$/,''));
 if(discovered.some(route=>route!=='/'&&!PREPARED_PAGES.includes(route)))throw Error('New page needs prepared-page routing');
 const result=await runPrerender({root,concurrency:1});
 for(const route of [...PREPARED_PAGES,'/404']){
  const record=result?.routes.find(r=>r.route===route);
  if(record?.status!=='rendered')throw Error(`Release page was not prerendered: ${route} (${record?.status})`);
  for(const file of record.outputFiles){
   const from=resolve(root,'dist/server/prerendered-routes',file),to=resolve(root,'dist/client/_pages',file);
   if(file.endsWith('.html')){const html=readFileSync(from,'utf8');if(!html.includes('<html')||!html.includes('</html>'))throw Error('Incomplete prepared document: '+route);}
   mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);
  }
 }
 console.log(`Prepared ${PREPARED_PAGES.length} reading pages plus a 404 without production rendering.`);
}
