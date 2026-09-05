import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectRoot, 'lib/chronology.ts');
const ledgerPath = resolve(
  projectRoot,
  'docs/site-spec/chronology-entry-ledger.json',
);

function duplicates(values) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

const [source, ledgerText] = await Promise.all([
  readFile(sourcePath, 'utf8'),
  readFile(ledgerPath, 'utf8'),
]);

const ledger = JSON.parse(ledgerText);
if (ledger.schema_version !== 1 || !Array.isArray(ledger.entry_ids)) {
  throw new Error('Chronology ledger schema is invalid.');
}

const sourceIds = [...source.matchAll(/^\s{4}id: '([^']+)',/gm)].map(
  (match) => match[1],
);
const ledgerIds = ledger.entry_ids;

const sourceDuplicates = duplicates(sourceIds);
const ledgerDuplicates = duplicates(ledgerIds);
if (sourceDuplicates.length || ledgerDuplicates.length) {
  throw new Error(
    `Duplicate chronology identity: ${[
      ...new Set([...sourceDuplicates, ...ledgerDuplicates]),
    ].join(', ')}`,
  );
}

const missingFromSource = ledgerIds.filter((id) => !sourceIds.includes(id));
const missingFromLedger = sourceIds.filter((id) => !ledgerIds.includes(id));
if (missingFromSource.length || missingFromLedger.length) {
  throw new Error(
    `Chronology identity mismatch. Missing from source: ${missingFromSource.join(', ') || 'none'}; missing from append-only ledger: ${missingFromLedger.join(', ') || 'none'}.`,
  );
}

const temporalStatusCount = (
  source.match(/^\s{4}temporalStatus: '(?:contemporaneous|retroactive)',/gm) ??
  []
).length;
if (temporalStatusCount !== sourceIds.length) {
  throw new Error(
    `Every chronology entry must declare temporalStatus (${temporalStatusCount}/${sourceIds.length}).`,
  );
}

const entryFormCount = (
  source.match(
    /^\s{4}entryForm: '(?:event|commentary|summary|contextual bridge|other named form)',/gm,
  ) ?? []
).length;
if (entryFormCount !== sourceIds.length) {
  throw new Error(
    `Every chronology entry must declare entryForm (${entryFormCount}/${sourceIds.length}).`,
  );
}

if (
  !source.includes("admissionStatus?: 'later admission'") ||
  ledger.policy?.later_admission_is_independent_of_retroactive_composition !==
    true ||
  ledger.policy?.validators_do_not_decide_artistic_merit !== true
) {
  throw new Error(
    'The chronology must preserve independent later admission and editorial judgment.',
  );
}

if (
  !source.includes("| 'withheld material'") ||
  !source.includes("| 'unknown absence'")
) {
  throw new Error(
    'Withheld and unknown absence classes must remain available.',
  );
}

process.stdout.write(
  `Chronology verified: ${sourceIds.length} stable entry identities; later admission and retroactive composition remain independent.\n`,
);
