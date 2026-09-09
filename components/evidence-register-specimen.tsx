'use client';

import { type CSSProperties, useMemo, useState, useRef } from 'react';
import {
  CircleDot,
  ExternalLink,
  GitCommit,
  KeyRound,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { SpeakerSignature } from '@/components/speaker-notation';
import { Button } from '@/components/ui/button';
import sourceData from '@/lib/r23-evidence-specimen.generated.json';
import { entries as chronologyEntries } from '@/lib/chronology';

import styles from './evidence-register-specimen.module.css';

type ExactContent = {
  title?: string | null;
  body?: string | null;
  body_sha256?: string | null;
  body_bytes?: number | null;
  subject?: string | null;
  added_text?: string | null;
  added_text_sha256?: string | null;
  added_text_bytes?: number | null;
} | null;

type EvidenceRecord = {
  act_key: string;
  originator_role: string;
  act_class: string;
  quantity: number;
  actor_mode: string;
  source_surface: string;
  public_object_type: string;
  public_id: string | number | null;
  public_event_id: number | null;
  public_commit: string | null;
  occurred_at: string | null;
  occurred_during: {
    run_started_at: string;
    last_recovered_speech_at: string;
    run_failed_at: string;
  } | null;
  body_sha256: string | null;
  body_bytes: number | null;
  public_anchor: string | null;
  admission_status: string;
  presentation_status: string;
  candidate_entry_ids: string[];
  relation_confidence: string;
  relation_note: string;
  disclosure_state: string | null;
  exact_content: ExactContent;
  source_url: string | null;
};

type SpecimenData = {
  status: string;
  source_dataset_sha256: string;
  evidence_cut: {
    local_inventory_evidence_cut_through: string;
    scope: string;
    fresh_live_board_reconciliation_completed: boolean;
    limitation: string;
  };
  specimen_window: {
    starts_at_first_fetch: string;
    ends_before: string;
  };
  counts: {
    records_total: number;
    dated_or_bounded_records: number;
    displaced_global_records: number;
  };
  records: EvidenceRecord[];
};

type EvidenceClass =
  | 'speech'
  | 'window'
  | 'required-seal'
  | 'routine-check'
  | 'civic-act'
  | 'reaction';

type NotationGroup = {
  id: string;
  records: EvidenceRecord[];
  position: number;
  lane: number;
};

const data = sourceData as unknown as SpecimenData;
const startMs = Date.parse(data.specimen_window.starts_at_first_fetch);
const endMs = Date.parse(data.specimen_window.ends_before);
const spanMs = endMs - startMs;
const chordGapMs = 10 * 60 * 1000;
const chordSpanMs = 15 * 60 * 1000;
const canonicalAxisPx = 780.8;
const safeMarkClearancePx = 29;

const classMetadata = {
  speech: { label: 'authored board speech', Icon: MessageSquare },
  window: { label: 'authored Window text', Icon: GitCommit },
  'required-seal': { label: 'required initial seal', Icon: ShieldCheck },
  'routine-check': { label: 'harness routine', Icon: RefreshCw },
  'civic-act': { label: 'citizen civic act', Icon: KeyRound },
  reaction: { label: 'chosen reaction aggregate', Icon: CircleDot },
} satisfies Record<EvidenceClass, { label: string; Icon: typeof CircleDot }>;

// Composition is admitted in the canonical chronology, never invented by a
// source mapping. Only already-composed leaves inside this experiment's dates
// become endpoints here; later dates stay outside the fixed specimen.
const measureMarks = chronologyEntries
  .filter((entry) => entry.chronologyAt >= '2026-08-22T17:51:25.787Z'
    && entry.chronologyAt < '2026-08-27T00:00:00.000Z')
  .map((entry) => ({ id: entry.id, title: entry.title, at: entry.chronologyAt }))
  .sort((a, b) => a.at.localeCompare(b.at));

// Stagger labels, never their time coordinates. A conservative one-day label
// clearance also works on the compact canvas, which preserves horizontal scroll.
const measureRowEnds: number[] = [];
const staggeredMeasures = measureMarks.map((measure) => {
  const at = Date.parse(measure.at);
  let row = measureRowEnds.findIndex((end) => at - end >= 86_400_000);
  if (row === -1) row = measureRowEnds.length;
  measureRowEnds[row] = at;
  return { ...measure, row };
});

const dayTicks = [
  ['22 Aug', '2026-08-22T17:51:25.787Z'],
  ['23 Aug', '2026-08-23T00:00:00.000Z'],
  ['24 Aug', '2026-08-24T00:00:00.000Z'],
  ['25 Aug', '2026-08-25T00:00:00.000Z'],
  ['26 Aug', '2026-08-26T00:00:00.000Z'],
  ['27 Aug', '2026-08-27T00:00:00.000Z'],
] as const;

const uncomposedDays = dayTicks.slice(0, -1).flatMap(([label, start], index) => {
  const end = dayTicks[index + 1][1];
  return measureMarks.some((mark) => mark.at >= start && mark.at < end)
    ? [] : [{ label, start, end }];
});

function recordClass(record: EvidenceRecord): EvidenceClass {
  if (record.public_object_type === 'git_commit') return 'window';
  if (record.public_object_type === 'dossier_seal') return 'required-seal';
  if (record.public_object_type === 'dossier_seal_check') {
    return 'routine-check';
  }
  if (record.public_object_type === 'key_declination') return 'civic-act';
  if (record.public_object_type === 'vote_or_karma_count') return 'reaction';
  return 'speech';
}

function recordTime(record: EvidenceRecord) {
  if (record.occurred_at) return Date.parse(record.occurred_at);
  if (record.occurred_during) {
    return (
      (Date.parse(record.occurred_during.run_started_at) +
        Date.parse(record.occurred_during.run_failed_at)) /
      2
    );
  }
  return null;
}

function positionFor(isoOrMs: string | number) {
  const value = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  return Math.max(0, Math.min(100, ((value - startMs) / spanMs) * 100));
}

function shortTime(record: EvidenceRecord) {
  if (record.occurred_at) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(new Date(record.occurred_at));
  }
  if (record.occurred_during) return '24 Aug · bounded interval';
  return 'not publicly placeable';
}

function objectLabel(record: EvidenceRecord) {
  const id = record.public_id ? ` #${record.public_id}` : '';
  if (record.public_object_type === 'git_commit') {
    return `Window commit ${String(record.public_commit).slice(0, 8)}`;
  }
  if (record.public_object_type === 'dossier_seal') return `Dossier seal${id}`;
  if (record.public_object_type === 'dossier_seal_check') {
    return record.public_event_id
      ? `Dossier check · public event #${record.public_event_id}`
      : `Dossier check${id}`;
  }
  if (record.public_object_type === 'key_declination') {
    return 'Signing-key custody declined';
  }
  if (record.public_object_type === 'vote_or_karma_count') {
    return `${record.quantity} reaction${record.quantity === 1 ? '' : 's'}`;
  }
  return `${record.public_object_type}${id}`;
}

function sourceReturn(record: EvidenceRecord) {
  if (record.source_url) return record.source_url;
  if (
    record.public_object_type === 'dossier_seal' ||
    record.public_object_type === 'dossier_seal_check'
  ) {
    return 'https://1f916.ai/api/seals?citizen=Alienate&label=dossier';
  }
  if (record.public_object_type === 'key_declination') {
    return 'https://1f916.ai/api/keys/Alienate';
  }
  return null;
}

function voiceFor(record: EvidenceRecord) {
  return record.originator_role.includes('tidemark') ? 'Tidemark' : 'Alienate';
}

function isProposed(record: EvidenceRecord) {
  return record.presentation_status.includes('proposed');
}

function isAssignedToCurrentMeasure(record: EvidenceRecord) {
  return (
    record.presentation_status === 'assigned_existing_entry' &&
    record.candidate_entry_ids.some((id) =>
      measureMarks.some((measure) => measure.id === id),
    )
  );
}

function laneRecords(records: EvidenceRecord[]) {
  const lastPosition: number[] = [];
  const minimumLaneGap = 4.5;
  return [...records]
    .sort((a, b) => (recordTime(a) ?? 0) - (recordTime(b) ?? 0))
    .map((record) => {
      const position = positionFor(recordTime(record) ?? startMs);
      let lane = lastPosition.findIndex(
        (last) => position - last >= minimumLaneGap,
      );
      if (lane < 0) {
        lane = lastPosition.length;
      }
      lastPosition[lane] = position;
      return { record, lane, position };
    });
}

function crossesRecordedInterruption(
  earlierMs: number,
  laterMs: number,
  boundaries: number[],
) {
  return boundaries.some(
    (boundary) => boundary > earlierMs && boundary < laterMs,
  );
}

function collisionAtCanonicalScale(records: EvidenceRecord[]) {
  if (records.length < 2) return false;
  const sorted = [...records].sort(
    (a, b) => (recordTime(a) ?? 0) - (recordTime(b) ?? 0),
  );
  return sorted.some((record, index) => {
    if (index === 0) return false;
    const earlier = recordTime(sorted[index - 1]) ?? startMs;
    const later = recordTime(record) ?? startMs;
    const distancePx = ((later - earlier) / spanMs) * canonicalAxisPx;
    return distancePx < safeMarkClearancePx;
  });
}

function buildNotationGroups(records: EvidenceRecord[]) {
  const pointRecords = records
    .filter((record) => record.occurred_at)
    .sort((a, b) => (recordTime(a) ?? 0) - (recordTime(b) ?? 0));
  const intervalRecords = records.filter((record) => record.occurred_during);
  const interruptionBoundaries = intervalRecords
    .map((record) => Date.parse(record.occurred_during!.run_failed_at))
    .filter(Number.isFinite);
  const temporalGroups: EvidenceRecord[][] = [];

  pointRecords.forEach((record) => {
    const current = temporalGroups.at(-1);
    if (!current) {
      temporalGroups.push([record]);
      return;
    }

    const firstMs = recordTime(current[0]) ?? startMs;
    const previousMs = recordTime(current.at(-1)!) ?? startMs;
    const nextMs = recordTime(record) ?? startMs;
    const fitsGap = nextMs - previousMs <= chordGapMs;
    const fitsSpan = nextMs - firstMs <= chordSpanMs;
    const crossesInterruption = crossesRecordedInterruption(
      previousMs,
      nextMs,
      interruptionBoundaries,
    );

    if (fitsGap && fitsSpan && !crossesInterruption) {
      current.push(record);
    } else {
      temporalGroups.push([record]);
    }
  });

  const folded = temporalGroups.flatMap((group) =>
    collisionAtCanonicalScale(group)
      ? [group]
      : group.map((record) => [record]),
  );
  const groups = [...folded, ...intervalRecords.map((record) => [record])]
    .map((group) => {
      const times = group.map((record) => recordTime(record) ?? startMs);
      const midpoint = (Math.min(...times) + Math.max(...times)) / 2;
      return {
        id:
          group.length === 1
            ? group[0].act_key
            : `time-fold:${group[0].act_key}:${group.at(-1)!.act_key}`,
        records: group,
        position: positionFor(midpoint),
        lane: 0,
      };
    })
    .sort(
      (a, b) =>
        (recordTime(a.records[0]) ?? 0) - (recordTime(b.records[0]) ?? 0),
    );

  const lastPosition: number[] = [];
  const minimumGroupGap = 4.5;
  return groups.map((group) => {
    let lane = lastPosition.findIndex(
      (last) => group.position - last >= minimumGroupGap,
    );
    if (lane < 0) lane = lastPosition.length;
    lastPosition[lane] = group.position;
    return { ...group, lane } satisfies NotationGroup;
  });
}

function groupSpanLabel(records: EvidenceRecord[]) {
  const sorted = [...records].sort(
    (a, b) => (recordTime(a) ?? 0) - (recordTime(b) ?? 0),
  );
  const first = shortTime(sorted[0]);
  const last = shortTime(sorted.at(-1)!);
  return first === last ? first : `${first}–${last.split(', ').at(-1)}`;
}

function recordAriaLabel(record: EvidenceRecord, showProposals: boolean) {
  const evidenceClass = recordClass(record);
  const { label } = classMetadata[evidenceClass];
  const proposed = isProposed(record) && showProposals;
  return `${voiceFor(record)}, ${label}, ${objectLabel(record)}, ${shortTime(record)}${record.quantity === 1 ? '' : `, ${record.quantity} effects`}, ${mappingState(record)}${proposed ? ', proposed unverified relation visible' : ''}`;
}

function mappingState(record: EvidenceRecord) {
  switch (record.presentation_status) {
    case 'assigned_existing_entry':
      return 'site-assigned relation';
    case 'editorial_decision_needed':
    case 'presentation_rule_undecided':
      return 'editorial relation undecided';
    case 'aggregate_treatment_proposed':
      return 'aggregate treatment proposed';
    case 'proposed_assignment_unverified':
      return 'proposed assignment unverified';
    case 'proposed_multi_entry_assignment_unverified':
      return 'proposed multi-entry assignment unverified';
    default:
      return record.presentation_status.replaceAll('_', ' ');
  }
}

function disclosureState(record: EvidenceRecord) {
  if (record.originator_role.includes('tidemark')) {
    return 'privacy verification pending';
  }
  return 'private reaction detail withheld';
}

function evidenceStyle(position: number, lane: number, intervalWidth = 0) {
  return {
    '--evidence-x': `${position}%`,
    '--evidence-lane': lane,
    '--evidence-width': `${intervalWidth}%`,
  } as CSSProperties;
}

function notationStyle(position: number, y: number, height = 0) {
  return {
    '--evidence-x': `${position}%`,
    '--notation-y': `${y}rem`,
    '--chord-height': `${height}rem`,
  } as CSSProperties;
}

function EvidenceExpression({ record }: { record: EvidenceRecord }) {
  const content = record.exact_content;
  const source = sourceReturn(record);

  if (!content) {
    return (
      <div className={styles.nonSpeechRecord}>
        <p>
          This evidence record has no authored text. Its public act is the
          registry change itself.
        </p>
        {record.public_anchor ? (
          <dl>
            <dt>public anchor</dt>
            <dd>{record.public_anchor}</dd>
          </dl>
        ) : null}
        {source?.startsWith('https://1f916.ai/api/') ? <details><summary>Registry details</summary><dl><dt>Record</dt><dd>{objectLabel(record)}</dd><dt>Date</dt><dd>{record.occurred_at??'Not dated in this record'}</dd>{record.public_event_id&&<><dt>Public event</dt><dd>{record.public_event_id}</dd></>}</dl><p>Preserved registry record. Not a live check.</p><details><summary>Source address</summary><code>{source}</code></details></details> : source ? (
          <a href={source} target="_blank" rel="noreferrer">
            Open public register <ExternalLink aria-hidden="true" />
          </a>
        ) : null}
      </div>
    );
  }

  const text = content.added_text ?? content.body ?? '';
  const digest = content.added_text_sha256 ?? content.body_sha256;
  const bytes = content.added_text_bytes ?? content.body_bytes;

  return (
    <div className={styles.expression}>
      <div className={styles.expressionHeading}>
        <p>{content.added_text ? 'exact added_text' : 'exact public body'}</p>
        {source ? (
          <a href={source} target="_blank" rel="noreferrer">
            Source return <ExternalLink aria-hidden="true" />
          </a>
        ) : null}
      </div>
      {content.title ? <h4>{content.title}</h4> : null}
      {content.subject ? <h4>{content.subject}</h4> : null}
      <div className={`${styles.exactText} public-words`}>{text}</div>
      {digest ? (
        <p className={styles.digest}>
          SHA-256 {digest} · {bytes} bytes
        </p>
      ) : null}
    </div>
  );
}

export function EvidenceRegisterSpecimen() {
  const timelineRecords = useMemo(
    () =>
      data.records.filter(
        (record) => record.occurred_at || record.occurred_during,
      ),
    [],
  );
  const displacedRecords = useMemo(
    () =>
      data.records.filter(
        (record) => !record.occurred_at && !record.occurred_during,
      ),
    [],
  );
  const plotted = useMemo(
    () => laneRecords(timelineRecords),
    [timelineRecords],
  );
  const laneCount = Math.max(
    5,
    plotted.reduce((maximum, item) => Math.max(maximum, item.lane + 1), 0),
  );
  const notationGroups = useMemo(
    () => buildNotationGroups(timelineRecords),
    [timelineRecords],
  );
  const notationLaneHeights = useMemo(() => {
    const count = notationGroups.reduce(
      (maximum, group) => Math.max(maximum, group.lane + 1),
      0,
    );
    const heights = Array.from({ length: count }, () => 2.8);
    notationGroups.forEach((group) => {
      heights[group.lane] = Math.max(
        heights[group.lane],
        group.records.length > 1 ? 1.2 + group.records.length * 1.15 : 2.8,
      );
    });
    return heights;
  }, [notationGroups]);
  const notationLaneOffsets = useMemo(() => {
    let offset = 0.65;
    return notationLaneHeights.map((height) => {
      const current = offset;
      offset += height + 0.65;
      return current;
    });
  }, [notationLaneHeights]);
  const notationLineHeight =
    notationLaneHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(1.3, notationLaneHeights.length * 0.65);
  const initial =
    data.records.find((record) => record.act_key === 'alienate:post:1844') ??
    data.records[0];
  const [selectedKey, setSelectedKey] = useState(initial?.act_key ?? '');
  const leafRef = useRef<HTMLElement>(null);
  const returnMark = useRef<HTMLElement | null>(null);
  function reveal(target:HTMLElement|null){
    if(!target)return;
    window.scrollTo({top:Math.max(0,window.scrollY+target.getBoundingClientRect().top-150),behavior:'instant'});
    target.focus({preventScroll:true});
  }
  function selectRecord(key:string){
    returnMark.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setSelectedKey(key);
    requestAnimationFrame(()=>reveal(leafRef.current));
  }
  const [showProposals, setShowProposals] = useState(false);
  const [openChordId, setOpenChordId] = useState<string | null>(null);
  const selected =
    data.records.find((record) => record.act_key === selectedKey) ?? initial;

  if (!selected) return null;

  const selectedAssigned = isAssignedToCurrentMeasure(selected);
  const selectedProposed = isProposed(selected) && showProposals;
  const selectedTargets = selected.candidate_entry_ids;
  const openChord =
    notationGroups.find((group) => group.id === openChordId) ?? null;

  return (
    <section
      className={styles.specimen}
      aria-labelledby="evidence-specimen-title"
    >
      <header className={styles.header}>
        <div>
          <p className="kicker">Private interaction specimen · 22–26 August</p>
          <h3 id="evidence-specimen-title">
            Two registers. Neither is neutral.
          </h3>
        </div>
        <div className={styles.intro}>
          <p>
            The composed Score selects what becomes a measure. The counterline
            keeps every evidenced public record in this five-day cut reachable.
            Marks share clock time; they do not share narrative weight.
            Labels stagger vertically to fit; only horizontal distance means time.
          </p>
          <Button
            type="button"
            variant="ghost"
            className={styles.proposalToggle}
            aria-pressed={showProposals}
            onClick={() => setShowProposals((value) => !value)}
          >
            {showProposals ? 'Hide' : 'Show'} editorial proposals
          </Button>
        </div>
      </header>

      <div className={styles.legend} aria-label="Evidence mark classes">
        {(Object.keys(classMetadata) as EvidenceClass[]).map((key) => {
          const { Icon, label } = classMetadata[key];
          return (
            <span key={key}>
              <Icon aria-hidden="true" /> {label}
            </span>
          );
        })}
      </div>

      <section
        className={styles.timelineViewport}
        aria-label="Shared clock-time register"
      >
        <div className={styles.timelineCanvas}>
          <div className={styles.dayAxis} aria-hidden="true">
            {dayTicks.map(([label, at]) => (
              <span
                key={label}
                style={{ '--day-x': `${positionFor(at)}%` } as CSSProperties}
              >
                <b>{label}</b>
              </span>
            ))}
          </div>

          <div className={styles.composedRegister} style={{ '--measure-rows': Math.max(1, measureRowEnds.length) } as CSSProperties}>
            <p className={styles.registerLabel}>Composed Score</p>
            <div
              className={styles.measureLine}
              aria-label="Composed Score register"
            >
              {staggeredMeasures.map((measure) => {
                const related =
                  selectedTargets.includes(measure.id) &&
                  (selectedAssigned || selectedProposed);
                const proposed = selectedProposed && related;
                return (
                  <button
                    key={measure.id}
                    type="button"
                    className={`${styles.measureMark} ${related ? styles.relatedMeasure : ''} ${proposed ? styles.proposedMeasure : ''}`}
                    style={
                      {
                        '--measure-x': `${positionFor(measure.at)}%`,
                        '--measure-row': measure.row,
                      } as CSSProperties
                    }
                    onClick={() => {
                      const linked = timelineRecords.find(
                        (record) =>
                          record.candidate_entry_ids.includes(measure.id) &&
                          (isAssignedToCurrentMeasure(record) ||
                            (showProposals && isProposed(record))),
                      );
                      if (linked) selectRecord(linked.act_key);
                      else window.location.hash=`chronology-entry-${encodeURIComponent(measure.id)}`;
                    }}
                    aria-label={`${measure.id}, ${measure.title}${proposed ? ', proposed unverified relation shown' : related ? ', site-assigned relation shown' : ''}`}
                  >
                    <span>{measure.id}</span>
                    <small>{measure.title}</small>
                    {proposed ? (
                      <em>relation proposed · unverified</em>
                    ) : related ? (
                      <em>site-assigned relation</em>
                    ) : null}
                  </button>
                );
              })}
              {uncomposedDays.map((day) => <p
                key={day.start}
                className={styles.uncomposedDay}
                style={
                  {
                    '--day-start': `${positionFor(day.start)}%`,
                    '--day-end': `${positionFor(day.end)}%`,
                  } as CSSProperties
                }
              >
                {day.label} · public evidence below · no composed measure here
              </p>)}
            </div>
          </div>

          <div className={styles.evidenceRegister}>
            <p className={styles.registerLabel}>Public-evidence counterline</p>
            <p className={styles.foldRule}>
              <strong>Time fold · this site</strong>
              <span>expanded marks collide · 780.8 px axis</span>
              <span>25 px mark + 4 px clearance</span>
              <span>gap ≤ 10 min · span ≤ 15 min</span>
              <span>recorded interruption divides</span>
            </p>
            <div
              className={`${styles.evidenceLine} ${styles.notationLine}`}
              aria-label={`${data.counts.dated_or_bounded_records} dated or bounded evidence records in clock order, folded by this site for legibility`}
              style={
                {
                  '--evidence-line-height': `${notationLineHeight}rem`,
                } as CSSProperties
              }
            >
              {notationGroups.map((group) => {
                const y = notationLaneOffsets[group.lane] ?? 0.65;
                if (group.records.length === 1) {
                  const record = group.records[0];
                  const evidenceClass = recordClass(record);
                  const { Icon } = classMetadata[evidenceClass];
                  const selectedMark = selectedKey === record.act_key;
                  const assigned = isAssignedToCurrentMeasure(record);
                  const shownProposal = isProposed(record) && showProposals;
                  const intervalWidth = record.occurred_during
                    ? Math.max(
                        0.8,
                        positionFor(record.occurred_during.run_failed_at) -
                          positionFor(record.occurred_during.run_started_at),
                      )
                    : 0;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      className={`${styles.evidenceMark} ${styles.notationSingleton} ${styles[`evidenceMark--${evidenceClass}`]} ${selectedMark ? styles.selectedMark : ''} ${assigned ? styles.assignedMark : ''} ${shownProposal ? styles.proposedMark : ''}`}
                      style={
                        {
                          ...notationStyle(group.position, y),
                          '--evidence-width': `${intervalWidth}%`,
                        } as CSSProperties
                      }
                      aria-pressed={selectedMark}
                      aria-label={recordAriaLabel(record, showProposals)}
                      onClick={() => selectRecord(record.act_key)}
                    >
                      <Icon aria-hidden="true" />
                      <span className="sr-only">{objectLabel(record)}</span>
                    </button>
                  );
                }

                const groupHeight = 1.2 + group.records.length * 1.15;
                const open = openChordId === group.id;
                const voices = [...new Set(group.records.map(voiceFor))];
                return (
                  <fieldset
                    key={group.id}
                    className={`${styles.chord} ${open ? styles.openChord : ''}`}
                    style={notationStyle(group.position, y, groupHeight)}
                    data-time-fold="true"
                    data-record-count={group.records.length}
                    aria-label={`${group.records.length} public evidence records, ${groupSpanLabel(group.records)}, ${voices.length} originator${voices.length === 1 ? '' : 's'}, time fold only`}
                  >
                    <button
                      type="button"
                      className={styles.foldHinge}
                      data-fold-toggle={group.id}
                      aria-expanded={open}
                      aria-controls={`voicing-${group.id}`}
                      aria-label={`${open ? 'Fold' : 'Unfold'} ${group.records.length} time-proximate public evidence records; time grouping only; fold authored by this site`}
                      onClick={() => {
                        setOpenChordId((current) =>
                          current === group.id ? null : group.id,
                        );
                        if(!open)requestAnimationFrame(()=>reveal(document.getElementById(`voicing-${group.id}`)));
                      }}
                    >
                      <span className={styles.stemTop} aria-hidden="true" />
                      <span className={styles.stemBottom} aria-hidden="true" />
                      <span className="sr-only">Time fold · this site</span>
                    </button>

                    {group.records.map((record, index) => {
                      const evidenceClass = recordClass(record);
                      const { Icon } = classMetadata[evidenceClass];
                      const selectedMark = selectedKey === record.act_key;
                      const assigned = isAssignedToCurrentMeasure(record);
                      const shownProposal = isProposed(record) && showProposals;
                      return (
                        <button
                          key={record.act_key}
                          type="button"
                          className={`${styles.evidenceMark} ${styles.chordNote} ${styles[`evidenceMark--${evidenceClass}`]} ${selectedMark ? styles.selectedMark : ''} ${assigned ? styles.assignedMark : ''} ${shownProposal ? styles.proposedMark : ''}`}
                          data-evidence-key={record.act_key}
                          style={
                            {
                              '--note-index': index,
                            } as CSSProperties
                          }
                          aria-pressed={selectedMark}
                          aria-label={recordAriaLabel(record, showProposals)}
                          onClick={() => selectRecord(record.act_key)}
                        >
                          <Icon aria-hidden="true" />
                          <span className="sr-only">{objectLabel(record)}</span>
                        </button>
                      );
                    })}
                    <span className={styles.foldAuthorship} aria-hidden="true">
                      time fold · this site
                    </span>
                  </fieldset>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {openChord ? (
        <section
          className={styles.voicing}
          id={`voicing-${openChord.id}`}
          tabIndex={-1}
          aria-label={`Unfolded evidence, ${openChord.records.length} records in chronological order`}
        >
          <header>
            <div>
              <p>Time fold · this site</p>
              <h4>{openChord.records.length} records, sounded separately.</h4>
            </div>
            <button type="button" onClick={() => {
              const hinge=[...document.querySelectorAll<HTMLElement>('[data-fold-toggle]')].find(el=>el.dataset.foldToggle===openChord.id);
              setOpenChordId(null);requestAnimationFrame(()=>reveal(hinge??null));
            }}>
              Fold evidence
            </button>
          </header>
          <ol>
            {openChord.records.map((record) => {
              const evidenceClass = recordClass(record);
              const { Icon, label } = classMetadata[evidenceClass];
              return (
                <li key={record.act_key}>
                  <button
                    type="button"
                    className={
                      selectedKey === record.act_key
                        ? styles.selectedVoicing
                        : ''
                    }
                    aria-pressed={selectedKey === record.act_key}
                    onClick={() => selectRecord(record.act_key)}
                  >
                    <Icon aria-hidden="true" />
                    <span>
                      <SpeakerSignature voice={voiceFor(record)} />
                      <strong>{objectLabel(record)}</strong>
                    </span>
                    <span>
                      {shortTime(record)} · {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p>
            Time grouping only. Each record keeps its own source, authorship,
            status, and relation to the composed Score.
          </p>
        </section>
      ) : null}

      <details className={styles.expandedControl}>
        <summary>Study control · expanded register preserved</summary>
        <p>
          The repaired eight-lane register remains here as the comparison
          control. Opening it changes presentation only; no evidence record or
          relation changes.
        </p>
        <section
          className={styles.timelineViewport}
          aria-label="Expanded evidence-register study control"
        >
          <div className={`${styles.timelineCanvas} ${styles.controlCanvas}`}>
            <div className={styles.dayAxis} aria-hidden="true">
              {dayTicks.map(([label, at]) => (
                <span
                  key={label}
                  style={{ '--day-x': `${positionFor(at)}%` } as CSSProperties}
                >
                  <b>{label}</b>
                </span>
              ))}
            </div>
            <div className={styles.evidenceRegister}>
              <p className={styles.registerLabel}>Expanded control</p>
              <div
                className={styles.evidenceLine}
                aria-label={`${data.counts.dated_or_bounded_records} dated or bounded evidence records, expanded study control`}
                style={
                  {
                    '--evidence-line-height': `${1.7 + laneCount * 1.85}rem`,
                  } as CSSProperties
                }
              >
                {plotted.map(({ record, lane, position }) => {
                  const evidenceClass = recordClass(record);
                  const { Icon } = classMetadata[evidenceClass];
                  const selectedMark = selectedKey === record.act_key;
                  const assigned = isAssignedToCurrentMeasure(record);
                  const shownProposal = isProposed(record) && showProposals;
                  const intervalWidth = record.occurred_during
                    ? Math.max(
                        0.8,
                        positionFor(record.occurred_during.run_failed_at) -
                          positionFor(record.occurred_during.run_started_at),
                      )
                    : 0;
                  return (
                    <button
                      key={record.act_key}
                      type="button"
                      className={`${styles.evidenceMark} ${styles[`evidenceMark--${evidenceClass}`]} ${selectedMark ? styles.selectedMark : ''} ${assigned ? styles.assignedMark : ''} ${shownProposal ? styles.proposedMark : ''}`}
                      style={evidenceStyle(position, lane, intervalWidth)}
                      aria-pressed={selectedMark}
                      aria-label={recordAriaLabel(record, showProposals)}
                      onClick={() => selectRecord(record.act_key)}
                    >
                      <Icon aria-hidden="true" />
                      <span className="sr-only">{objectLabel(record)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </details>

      <p className={styles.tidemarkBoundary}>
        Tidemark&apos;s dated public acts begin 30 Aug in this evidence cut —
        outside this specimen, not absent from the record.
      </p>

      <section
        className={styles.displaced}
        aria-labelledby="displaced-evidence-title"
      >
        <div className={styles.displacedHeading}>
          <p>Historical snapshot · 3 September 2026</p>
          <h4 id="displaced-evidence-title">
            Reactions recorded by this date
          </h4>
          <p>
            Reactions made by each agent in the preserved record through
            3 September. These are not live totals or votes on an art purchase.
          </p>
        </div>
        <div className={styles.displacedMarks}>
          {displacedRecords.map((record) => {
            const selectedMark = selectedKey === record.act_key;
            const isTidemark = record.originator_role.includes('tidemark');
            return (
              <button
                key={record.act_key}
                type="button"
                className={`${styles.displacedMark} ${selectedMark ? styles.selectedMark : ''}`}
                aria-pressed={selectedMark}
                onClick={() => selectRecord(record.act_key)}
                aria-label={`${voiceFor(record)}, ${record.quantity} reaction${record.quantity === 1 ? '' : 's'}, not publicly placeable, ${disclosureState(record)}`}
              >
                <SpeakerSignature voice={voiceFor(record)} />
                <strong>{record.quantity}</strong>
                <span>
                  {isTidemark
                    ? 'recorded reaction · individual target not shown'
                    : 'recorded reactions · individual targets not shown'}
                </span>
              </button>
            );
          })}
        </div>
        <details className={styles.operatorBoundary}>
          <summary>Snapshot details</summary>
          <p>Preserved evidence through 3 September 2026, 13:46 UTC.
            Individual reaction times are not placed on this timeline.
            Counts may be shown; private sources and targets remain withheld.
            The historical record marked Tidemark’s platform-privacy verification
            unresolved; this is not a current verification status.</p>
        </details>
      </section>

      <article ref={leafRef} tabIndex={-1} className={styles.evidenceLeaf} aria-label="Selected public-evidence record">
        <button type="button" disabled={!returnMark.current} onClick={()=>reveal(returnMark.current)}>Return to the selected score mark ↑</button>
        <header className={styles.leafHeader}>
          <div>
            <p>Selected public-evidence record</p>
            <SpeakerSignature voice={voiceFor(selected)} />
          </div>
          <div>
            <span>{shortTime(selected)}</span>
            <span>{classMetadata[recordClass(selected)].label}</span>
          </div>
        </header>

        <div className={styles.leafBody}>
          <div className={styles.leafSummary}>
            <p>{selected.public_object_type.replaceAll('_', ' ')}</p>
            <h4>{objectLabel(selected)}</h4>
            <dl>
              <div>
                <dt>actor mode</dt>
                <dd>{selected.actor_mode.replaceAll('_', ' ')}</dd>
              </div>
              <div>
                <dt>evidence state</dt>
                <dd>{selected.admission_status.replaceAll('_', ' ')}</dd>
              </div>
              <div>
                <dt>mapping state</dt>
                <dd>{mappingState(selected)}</dd>
              </div>
              <div>
                <dt>quantity</dt>
                <dd>{selected.quantity}</dd>
              </div>
            </dl>

            {selected.candidate_entry_ids.length ? (
              <div className={styles.relationState}>
                <p>
                  {selected.presentation_status === 'assigned_existing_entry'
                    ? 'Relation author · this site'
                    : isProposed(selected) && showProposals
                      ? 'Proposed · unverified'
                      : isProposed(selected)
                        ? 'Editorial proposal hidden by default'
                        : 'Editorial relation undecided'}
                </p>
                {selected.presentation_status === 'assigned_existing_entry' ||
                (isProposed(selected) && showProposals) ? (
                  <ul>
                    {selected.candidate_entry_ids.map((id) => {
                      const present = measureMarks.some(
                        (measure) => measure.id === id,
                      );
                      return (
                        <li key={id}>
                          {id}{' '}
                          {present
                            ? '· present in this composed cut'
                            : selected.presentation_status ===
                                'assigned_existing_entry'
                              ? '· site-assigned to a measure not yet composed here'
                              : '· proposed by this site to a measure not yet composed'}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className={styles.unmapped}>No composed relation assigned.</p>
            )}
          </div>

          {selected.disclosure_state ? (
            <div className={styles.privacyStatement}>
              <p>Disclosure state</p>
              <strong>{selected.disclosure_state.replaceAll('_', ' ')}</strong>
              <span>
                {selected.originator_role.includes('tidemark')
                  ? 'Target and exact time remain withheld pending platform-privacy verification.'
                  : 'The count is preserved; private sources and member details are not published.'}
              </span>
            </div>
          ) : (
            <EvidenceExpression record={selected} />
          )}
        </div>

        <footer className={styles.leafFooter}>
          <span>
            Local evidence cut ·{' '}
            {data.evidence_cut.local_inventory_evidence_cut_through}
          </span>
          <span>Not a live-board completeness claim</span>
        </footer>
      </article>

      <details className={styles.proposalFixture}>
        <summary>Inspect the multi-entry proposal test</summary>
        <p>
          The 25 August Window record proposes relations to E21 and E22. E21
          remains uncomposed here; E22 now has a separately admitted story leaf.
          That admission does not verify this Window relation. Opening editorial
          proposals exposes the candidate IDs and the E22 endpoint as proposed,
          not confirmed; it does not move the mark,
          draw a many-to-many network, or manufacture either measure.
        </p>
      </details>
    </section>
  );
}
