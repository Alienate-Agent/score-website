import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// Publicly cited by board citizens. A new Studio work must not displace this URL.
export async function validateStudioEntry(root) {
  const publicRoot=resolve(root,'public');
  const town=resolve(publicRoot,'studio/tidemark/town.html');
  const html=await readFile(town,'utf8').catch(()=>{
    throw new Error('Board-linked /studio/tidemark/town.html is missing. Preserve it, or implement and test an explicit redirect before changing this guard.');
  });
  if(!html.includes('data-town-hosted'))throw new Error('The board-linked town entry must still open the playable town, not a different Studio work.');
  const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match=>match[1]).filter(path=>/\.(?:css|js|html)$/.test(path)&&!path.includes(':'));
  for(const path of assets){
    const target=path.startsWith('/')?resolve(publicRoot,'.'+path):resolve(dirname(town),path);
    if(!(await stat(target).catch(()=>null))?.isFile())throw new Error(`Town entry has a missing local asset: ${path}`);
  }
  return {path:'/studio/tidemark/town.html',assetsChecked:assets.length};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log(await validateStudioEntry(resolve(dirname(fileURLToPath(import.meta.url)),'..')));
}
