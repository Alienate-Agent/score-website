import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const deltaPath = resolve(
  projectRoot,
  'docs/site-spec/full-corpus-map-delta-2026-09-02.json',
);
const representativeLedgerPath = resolve(
  projectRoot,
  'docs/site-spec/chronology-entry-ledger.json',
);

const [deltaText, representativeLedgerText] = await Promise.all([
  readFile(deltaPath, 'utf8'),
  readFile(representativeLedgerPath, 'utf8'),
]);

const delta = JSON.parse(deltaText);
const representativeLedger = JSON.parse(representativeLedgerText);
const added = delta.delta?.records ?? [];
const current = delta.current_map ?? {};
// This delta describes a historical edition, not a limit on later composition.
// Preserve that exact prefix while separately validating subsequent admissions.
const historicalRepresentativeIds = [
  'E01', 'E09', 'E39', 'E39·2', 'E40', 'E41', 'E41·2',
  'E43·1', 'E43·2', 'E43·3', 'E43·4', 'E49·1', 'E49·2',
  'E49·3', 'E48·1', 'E48·2', 'E50', 'E50·2', 'E41·1', 'E10',
];

if (
  delta.schema_version !== 1 ||
  delta.prior_map?.records + added.length !== current.records ||
  delta.prior_map?.root_event_groups + delta.delta?.root_event_groups_added !==
    current.root_event_groups
) {
  throw new Error('Full-corpus map arithmetic is inconsistent.');
}

if (
  added.length !== 2 ||
  added[0]?.entry_id !== 'E52' ||
  added[1]?.entry_id !== 'E52·2' ||
  new Set(added.map((record) => record.originator_role)).size !== 2
) {
  throw new Error('E52 and E52·2 must remain distinct attributable records.');
}

if (
  !added.every(
    (record) =>
      record.temporal_status === 'contemporaneous' &&
      record.admission_status === 'later admission',
  )
) {
  throw new Error(
    'The sibling exchange must preserve contemporaneous acts and later site admission.',
  );
}

if (
  historicalRepresentativeIds.length !== current.representative_rendered_measures ||
  JSON.stringify(representativeLedger.entry_ids.slice(0, historicalRepresentativeIds.length)) !==
    JSON.stringify(historicalRepresentativeIds)
) {
  throw new Error(
    'The full-map delta must not silently change the representative baseline.',
  );
}

const laterRendered =
  current.representative_rendering_additions_after_delta ?? [];
if (
  laterRendered.length !== 1 ||
  laterRendered[0]?.entry_id !== 'E10' ||
  laterRendered[0]?.temporal_status !== 'retroactive' ||
  laterRendered[0]?.admission_status !== 'later admission' ||
  representativeLedger.entry_ids[historicalRepresentativeIds.length - 1] !== 'E10'
) {
  throw new Error(
    'The later-admitted August 24 representative measure must remain explicit and append-only.',
  );
}

process.stdout.write(
  `Historical story-map delta verified: declared map of ${current.records} records in ${current.root_event_groups} root event groups; preserved ${current.representative_rendered_measures}-identity prefix, including E10's later admission. The current ledger has ${representativeLedger.entry_ids.length} identities. This checks the historical delta and prefix, not subsequent admissions, the complete public-record dataset, or rendered reachability.\n`,
);
