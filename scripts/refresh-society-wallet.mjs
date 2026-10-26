import {writeFile, mkdir, rename, unlink} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchSocietyWallet} from '../lib/society-wallet.mjs';

// Run in each editorial sweep, even if there is no new Journal entry.
// Failed or stale reads leave the last successful dated snapshot untouched.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = await fetchSocietyWallet();
if (snapshot.stale) throw Error('The board returned an older balance. The saved snapshot is unchanged.');
const stamp = snapshot.receivedAt.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
const record = `/records/society-wallet-${stamp}.json`;
await mkdir(resolve(root, 'public/records'), {recursive: true});
await writeFile(resolve(root, 'public' + record), JSON.stringify(snapshot, null, 2) + '\n', {flag: 'wx'});
const pointer = resolve(root, 'content/society-wallet.json'), temporary = pointer + '.pending';
await writeFile(temporary, JSON.stringify({...snapshot, record}, null, 2) + '\n', {flag: 'wx'});
try {
  await rename(temporary, pointer);
} catch (error) { await unlink(temporary).catch(() => {}); throw error; }
console.log(JSON.stringify({record, checkedAt: snapshot.checkedAt, receivedAt: snapshot.receivedAt, balanceCents: snapshot.balanceCents}));
