import { spawn } from 'node:child_process';
import {copyFileSync, existsSync, readFileSync} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validatePublication } from './validate-publication.mjs';
import { validateStudioEntry } from './validate-studio-entry.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const denyListPath = process.env.PUBLICATION_DENY_LIST_PATH;

await validateStudioEntry(projectRoot);

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

// Vinext emits this sidecar in server/, while the Cloudflare SSR child
// imports it beside ssr/index.js. Keep clean exports deployable as well.
const ssrEntry = resolve(projectRoot, 'dist/server/ssr/index.js');
if (existsSync(ssrEntry) && readFileSync(ssrEntry, 'utf8').includes('./vinext-client-assets.js')) {
  copyFileSync(resolve(projectRoot, 'dist/server/vinext-client-assets.js'), resolve(projectRoot, 'dist/server/ssr/vinext-client-assets.js'));
}

await validatePublication({
  root: projectRoot,
  scanRoot: resolve(projectRoot, 'dist'),
  denyListPath,
});

process.stdout.write('Publication build passed both fail-closed scans.\n');
