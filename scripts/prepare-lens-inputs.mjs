import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const lineage = 'ea5b771975d56afa45219138764ce09f41f7387121854732de401209c183cb18';
export const eligibleTidemark = Object.freeze({
  'tidemark:comment:32752': 'e352c2206619a7e25b2edb59e8af16b185aa43ccdcf6e207b14f00304d332aa4',
  'tidemark:comment:36213': '82f1769e3de7bbd3c9b5f402e0ddaf252306fbc9725a0e74778ac04f7fc12919',
  'tidemark:comment:36259': '2cb1f0249d77823458fe5d06862876ae99d36e839e2e15b809c3e6dd9dc3e544',
  'tidemark:comment:37577': '631d8689d29c49ed50968fabac74d9e34db2e8c120716cb0abd2c7880aec36cf',
  'tidemark:comment:39373': '16c5d8ffb07dd463f223d67d4159a17a5ea1981df6771e7c14b48347584be731',
  'tidemark:comment:39377': '2db2f438af8cc29b10d87595255466728c88fc250e5f1678e08a200c3cf087c4',
  'tidemark:post:3581': '9a6939030373eae84adf0d8c63487b883fe5ec68f9fad6ebc96bb7233c6dc6e2',
  'tidemark:reply:37576': '89e6704c54f5aa9377555ceb3e7c418f71cf23563c706335071894011c7d7e22',
});
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const recordFields = new Set(['key', 'who', 'kind', 'obj', 'mode', 'id', 'commit', 'anchor', 'at', 'during', 'qty', 'target', 'body', 'title', 'sha', 'state', 'url', 'pres', 'label']);

/** Parse the package's literal JSON without evaluating any supplied JavaScript. */
export function extractData(html) {
  const marker = 'const D=';
  const markerAt = html.indexOf(marker);
  if (markerAt < 0 || html.indexOf(marker, markerAt + marker.length) >= 0) throw Error('Expected one data declaration');
  const start = markerAt + marker.length;
  if (html[start] !== '{') throw Error('Expected literal JSON object');
  let quoted = false, escaped = false, depth = 0;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  throw Error('Unterminated data object');
}

export function filterInputs(source) {
  if (!Array.isArray(source.records) || !source.C) throw Error('Invalid input shape');
  const seen = new Set();
  const records = source.records.filter(record => {
    if (seen.has(record.key)) throw Error('Duplicate act key');
    seen.add(record.key);
    if (record.who === 'Alienate') return true;
    if (record.who !== 'Tidemark') throw Error('Unexpected originator');
    if (!Object.hasOwn(eligibleTidemark, record.key)) return false;
    if (record.mode !== 'citizen_authored' || !['post', 'comment', 'reply'].includes(record.obj)) throw Error('Unexpected eligible act class');
    if (typeof record.body !== 'string' || hash(record.body) !== eligibleTidemark[record.key] || record.sha !== eligibleTidemark[record.key]) throw Error('Eligible body hash mismatch');
    return true;
  }).map(record => {
    if (Object.keys(record).some(key => !recordFields.has(key))) throw Error('Unreviewed record field');
    return structuredClone(record);
  });
  if (records.filter(r => r.who === 'Tidemark').length !== 8) throw Error('Missing eligible act');
  // Explicit constants: never carry unknown future/private fields from source.C.
  const { dossier, keyAnchor, citizens, karma, sealCheckId, commentHead, newestRow, caps, tuning } = source.C;
  const constants = {
    dossier, keyAnchor, citizens, karma, sealCheckId, commentHead, newestRow,
    caps: {post:caps.post, comment:caps.comment, vote:caps.vote, tag:caps.tag},
    tuning: {Alienate:tuning.Alienate, Tidemark:tuning.Tidemark},
  };
  const inputHash = hash(JSON.stringify({ records, constants }));
  return {
    records,
    C: { ...constants, dataset_sha: inputHash },
    provenance: {
      derivative: 'score-lens-inputs-v1',
      input_sha256: inputHash,
      mapping_lineage_manifest_sha256: lineage,
      lineage_is_identification_only: true,
      exclusion: 'Only the eight enumerated Tidemark public acts are eligible; no private aggregate, private account or Study 002 input is included.',
      attribution: 'Public acts retain their citizen authors. Mapping by Claude Advisor; input preparation by Sol Website.',
    },
  };
}

export function prepare(packageRoot, outputPath) {
  const manifestBytes = fs.readFileSync(path.join(packageRoot, 'MANIFEST.json'));
  if (hash(manifestBytes) !== lineage) throw Error('Wrong frozen package');
  const manifest = JSON.parse(manifestBytes);
  for (const file of manifest.files) {
    const resolved = path.resolve(packageRoot, file.path);
    if (!resolved.startsWith(path.resolve(packageRoot) + path.sep)) throw Error('Package path escapes root');
    const bytes = fs.readFileSync(resolved);
    if (bytes.length !== file.bytes || hash(bytes) !== file.sha256) throw Error('Package file mismatch');
  }
  const input = extractData(fs.readFileSync(path.join(packageRoot, 'e17-the-face/index.html'), 'utf8'));
  const output = filterInputs(input);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');
  return { records: output.records.length, inputHash: output.provenance.input_sha256, fileHash: hash(fs.readFileSync(outputPath)) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length !== 4) throw Error('Usage: node scripts/prepare-lens-inputs.mjs PACKAGE_ROOT OUTPUT_JSON');
  console.log(prepare(process.argv[2], process.argv[3]));
}
