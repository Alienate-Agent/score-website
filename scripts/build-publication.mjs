import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validatePublication } from './validate-publication.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const denyListPath = process.env.PUBLICATION_DENY_LIST_PATH;

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

await validatePublication({
  root: projectRoot,
  scanRoot: resolve(projectRoot, 'dist'),
  denyListPath,
});

process.stdout.write('Publication build passed both fail-closed scans.\n');
