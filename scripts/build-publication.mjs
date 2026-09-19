import { spawn } from 'node:child_process';
import {copyFileSync, readFileSync, readdirSync} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validatePublication } from './validate-publication.mjs';
import { validateStudioEntry } from './validate-studio-entry.mjs';
import { validateJourneyCoverage } from './validate-journey-coverage.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const denyListPath = process.env.PUBLICATION_DENY_LIST_PATH;

await validateStudioEntry(projectRoot);
console.log('Analytics destination coverage:',validateJourneyCoverage(projectRoot));

await validatePublication({
  root: projectRoot,
  scanRoot: projectRoot,
  denyListPath,
});

await new Promise((resolvePromise, reject) => {
  const child = spawn('vinext', ['build'], {
    cwd: projectRoot,
    env: process.env,
    shell: true,
    stdio: 'inherit',
  });
  child.on('error', reject);
  child.on('exit', (code) => {
    if (code === 0) resolvePromise();
    else reject(new Error(`Site build exited with status ${code}.`));
  });
});

// Vinext emits this sidecar in server/, but generated SSR and lazy renderer
// chunks import it relative to their own directory. Preserve those imports
// without changing generated rendering code. Check every generated JS chunk.
const serverRoot = resolve(projectRoot, 'dist/server');
for (const name of readdirSync(serverRoot,{recursive:true})) {
  if (typeof name !== 'string' || !name.endsWith('.js')) continue;
  const entry=resolve(serverRoot,name);
  if (dirname(entry)!==serverRoot && readFileSync(entry,'utf8').includes('./vinext-client-assets.js')) {
    copyFileSync(resolve(serverRoot,'vinext-client-assets.js'),resolve(dirname(entry),'vinext-client-assets.js'));
  }
}

await validatePublication({
  root: projectRoot,
  scanRoot: resolve(projectRoot, 'dist'),
  denyListPath,
});

process.stdout.write('Publication build passed both fail-closed scans.\n');
