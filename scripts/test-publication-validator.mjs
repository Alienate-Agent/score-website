import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
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

  const contact='alienate-agent'+'@'+'proton.me';
  await writeFile(resolve(root,'app/contact.txt'),contact);
  await validatePublication({root,scanRoot:root,denyListPath}).then(()=>{throw Error('Project mail must remain unpublished');},e=>{if(!e.message.includes('[email-address]'))throw e;});
  await writeFile(resolve(root,'app/contact.txt'),'someone'+'@'+'example.com');
  await validatePublication({root,scanRoot:root,denyListPath}).then(()=>{throw Error('Other mail must fail');},e=>{if(!e.message.includes('[email-address]'))throw e;});
  await writeFile(resolve(root,'app/contact.txt'),contact);
  const contactDeny=resolve(privateRoot,'contact-deny.json');
  await writeFile(contactDeny,JSON.stringify({schema_version:1,rules:[{id:'contact-private-test',values:[contact]}]}));
  await validatePublication({root,scanRoot:root,denyListPath:contactDeny}).then(()=>{throw Error('Private rules still apply to approved contact');},e=>{if(!e.message.includes('[contact-private-test]'))throw e;});
  await writeFile(resolve(root,'app/contact.txt'),'Correspondence form');

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

  const vendor=await readFile(new URL('./patch-assets/p5.min.js',import.meta.url),'utf8');
  await mkdir(resolve(root,'public/lens'),{recursive:true});
  const vendorPath=resolve(root,'public/lens/p5.min.js');
  await writeFile(vendorPath,vendor);
  await validatePublication({root,scanRoot:root,denyListPath});
  // A single added path invalidates the pinned exception; unknown copies are
  // not allow-listed by filename or vendor name.
  await writeFile(vendorPath,vendor+'\n'+windowsSeparator.repeat(2)+'server'+windowsSeparator+'private-share');
  await validatePublication({root,scanRoot:root,denyListPath}).then(
    ()=>{throw Error('Changed vendor must not inherit the reviewed regexp exception.');},
    error=>{if(!error.message.includes('[absolute-windows-unc-path]'))throw error;});
  await writeFile(vendorPath,vendor);
  const vendorDenyPath=resolve(privateRoot,'vendor-deny.json');
  await writeFile(vendorDenyPath,JSON.stringify({schema_version:1,rules:[{id:'synthetic-vendor-deny',values:[vendor.slice(0,20)]}]}));
  await validatePublication({root,scanRoot:root,denyListPath:vendorDenyPath}).then(
    ()=>{throw Error('Private terms inside an exact reviewed vendor must still fail.');},
    error=>{if(!error.message.includes('[synthetic-vendor-deny]'))throw error;});
  process.stdout.write('Publication validator tests passed, including pinned vendor regexp false positives, changed-vendor rejection and private-rule enforcement.\n');
} finally {
  await rm(root, { recursive: true, force: true });
  await rm(privateRoot, { recursive: true, force: true });
}
