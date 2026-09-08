import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const expectedDatasetSha256 =
  'd754ab9e1a1baf252688ea787808803e25114ab9ed85209ab571170703d73b43';
const specimenStart = '2026-08-22T17:51:25.787Z';
const specimenEnd = '2026-08-27T00:00:00.000Z';

const [, , inputArgument, outputArgument] = process.argv;

if (!inputArgument || !outputArgument) {
  throw new Error(
    'Usage: node scripts/generate-r23-specimen.mjs <source-dataset> <output-json>',
  );
}

const sourceBytes = await readFile(resolve(inputArgument));
const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');

if (sourceSha256 !== expectedDatasetSha256) {
  throw new Error(
    `Refusing unreviewed dataset bytes: expected ${expectedDatasetSha256}, received ${sourceSha256}.`,
  );
}

const source = JSON.parse(sourceBytes.toString('utf8'));

if (!Array.isArray(source.records)) {
  throw new Error('Source dataset has no records array.');
}

const withinSpecimen = (record) => {
  if (typeof record.occurred_at === 'string') {
    return (
      record.occurred_at >= specimenStart && record.occurred_at < specimenEnd
    );
  }

  if (record.occurred_during?.run_started_at) {
    return (
      record.occurred_during.run_started_at >= specimenStart &&
      record.occurred_during.run_started_at < specimenEnd
    );
  }

  return false;
};

const isGlobalAggregate = (record) =>
  record.occurred_at === null &&
  record.occurred_during === null &&
  record.public_object_type === 'vote_or_karma_count';

const selected = source.records.filter(
  (record) => withinSpecimen(record) || isGlobalAggregate(record),
);

if (selected.length !== 24) {
  throw new Error(`Expected 24 specimen records; received ${selected.length}.`);
}

for (const record of selected) {
  if (
    record.public_object_type === 'vote_or_karma_count' &&
    record.target !== null
  ) {
    throw new Error(`Reaction target entered specimen: ${record.act_key}.`);
  }
}

const records = selected.map((record) => ({
  act_key: record.act_key,
  originator_role: record.originator_role,
  act_class: record.act_class,
  quantity: record.quantity,
  actor_mode: record.actor_mode,
  source_surface: record.source_surface,
  public_object_type: record.public_object_type,
  public_id: record.public_id,
  public_event_id: record.public_event_id ?? null,
  public_commit: record.public_commit,
  occurred_at: record.occurred_at,
  occurred_during: record.occurred_during,
  body_sha256: record.body_sha256,
  body_bytes: record.body_bytes,
  public_anchor: record.public_anchor,
  admission_status: record.admission_status,
  presentation_status: record.presentation_status,
  candidate_entry_ids: record.candidate_entry_ids,
  relation_confidence: record.relation_confidence,
  relation_note: record.relation_note,
  disclosure_state: record.disclosure_state ?? null,
  exact_content: record.exact_content,
  source_url: record.source_url,
}));

const output = {
  schema_version: 1,
  status: 'private_r23_bounded_interaction_specimen',
  source_dataset_sha256: sourceSha256,
  evidence_cut: source.evidence_cut,
  specimen_window: {
    starts_at_first_fetch: specimenStart,
    ends_before: specimenEnd,
  },
  counts: {
    records_total: records.length,
    dated_or_bounded_records: records.filter(
      (record) => record.occurred_at || record.occurred_during,
    ).length,
    displaced_global_records: records.filter(
      (record) => !record.occurred_at && !record.occurred_during,
    ).length,
  },
  records,
};

await writeFile(
  resolve(outputArgument),
  `${JSON.stringify(output, null, 2)}\n`,
);
