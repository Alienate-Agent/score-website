import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {svg,seed,contours} from './tidemark-drawing-model.mjs';
const root=dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(await readFile(resolve(root,'tidemark-drawing-inputs.json'),'utf8'));
for(const [index,passage]of data.passages.entries()){
  const output=svg(data,index);
  const path=resolve(root,`screen-masters/tidemark-${passage.id}.svg`);
  await writeFile(path,output);
  console.log(JSON.stringify({file:`screen-masters/tidemark-${passage.id}.svg`,seed:seed(data.source,passage),contours:contours(data,index).length,sha256:createHash('sha256').update(output).digest('hex')}));
}
