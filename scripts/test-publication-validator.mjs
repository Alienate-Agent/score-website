import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { validatePublication } from './validate-publication.mjs';

const root = await mkdtemp(resolve(tmpdir(), 'chronology-publication-test-'));
const privateRoot = await mkdtemp(
  resolve(tmpdir(), 'chronology-private-test-'),
);
const denyListPath = resolve(privateRoot, 'deny-list.json');
const syntheticProtectedValue = 'IDENTITY_TOKEN_DO_NOT_PUBLISH';
const windowsSeparator = String.fromCharCode(92);

await writeFile(
  denyListPath,
  JSON.stringify({
    schema_version: 1,
    rules: [
      {
        id: 'synthetic-identity',
        case_sensitive: false,
        values: [syntheticProtectedValue],
      },
    ],
  }),
);

try {
  await mkdir(resolve(root, 'app'));
  await writeFile(resolve(root, 'app/clean.txt'), 'Artist Operator\n');
  await validatePublication({ root, scanRoot: root, denyListPath });

  await writeFile(resolve(root, 'app/private.txt'), syntheticProtectedValue);
  await validatePublication({ root, scanRoot: root, denyListPath }).then(
    () => {
      throw new Error('Expected the private deny-list match to fail closed.');
    },
    (error) => {
      if (!error.message.includes('[synthetic-identity]')) throw error;
      if (error.message.includes(syntheticProtectedValue)) {
        throw new Error('Failure output disclosed the protected value.');
      }
    },
  );

  await writeFile(resolve(root, 'app/private.txt'), '/' + 'Users' + '/private');
  await validatePublication({ root, scanRoot: root, denyListPath }).then(
    () => {
      throw new Error('Expected the absolute-path rule to fail closed.');
    },
    (error) => {
      if (!error.message.includes('[absolute-macos-home-path]')) throw error;
    },
  );

  await writeFile(resolve(root, 'app/private.txt'), '/' + 'home' + '/private');
  await validatePublication({ root, scanRoot: root, denyListPath }).then(
    () => {
      throw new Error('Expected the Linux absolute-path rule to fail closed.');
    },
    (error) => {
      if (!error.message.includes('[absolute-linux-home-path]')) throw error;
    },
  );

  await writeFile(
    resolve(root, 'app/private.txt'),
    'C:' + windowsSeparator + 'Users' + windowsSeparator + 'private',
  );
  await validatePublication({ root, scanRoot: root, denyListPath }).then(
    () => {
      throw new Error(
        'Expected the Windows drive absolute-path rule to fail closed.',
      );
    },
    (error) => {
      if (!error.message.includes('[absolute-windows-drive-path]')) throw error;
    },
  );

  await writeFile(
    resolve(root, 'app/private.txt'),
    windowsSeparator.repeat(2) + 'server' + windowsSeparator + 'private-share',
  );
  await validatePublication({ root, scanRoot: root, denyListPath }).then(
    () => {
      throw new Error('Expected the Windows UNC-path rule to fail closed.');
    },
    (error) => {
      if (!error.message.includes('[absolute-windows-unc-path]')) throw error;
    },
  );

  await writeFile(
    resolve(root, 'app/private.txt'),
    windowsSeparator.repeat(4) +
      'encoded-server' +
      windowsSeparator.repeat(2) +
      'encoded-share',
  );
  await validatePublication({ root, scanRoot: root, denyListPath });

  await validatePublication({ root, scanRoot: root }).then(
    () => {
      throw new Error('Expected a missing private deny list to fail closed.');
    },
    (error) => {
      if (!error.message.includes('PUBLICATION_DENY_LIST_PATH')) throw error;
    },
  );

  process.stdout.write('Publication validator tests passed.\n');
} finally {
  await rm(root, { recursive: true, force: true });
  await rm(privateRoot, { recursive: true, force: true });
}
