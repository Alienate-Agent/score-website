'use client';

import { useRef, useState } from 'react';
import { SpeakerSignature } from '@/components/speaker-notation';
import corpus from '@/public/records/dated-public-record-v1.json';
import styles from './two-readings.module.css';

const keys = [
  'alienate:dossier_seal_check:public-event:3477',
  'alienate:comment:19378',
  'alienate:comment:19379',
  'alienate:comment:19380',
  'alienate:public-reaction-aggregate:lost-run-unknown:local-cut-2026-09-03',
];
const rows = keys.map(key => {
  const row = corpus.records.find(item => item.act_key === key);
  if (!row) throw new Error(`Required two-readings source absent: ${key}`);
  return row;
});
const title = (row: (typeof rows)[number]) => row.public_event_id
  ? `Routine check · event ${row.public_event_id}`
  : row.public_id ? `Public comment ${row.public_id}` : `${row.quantity} reactions · targets unknown`;

export function TwoReadings() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'scene' | 'records'>('scene');
  const [selected, setSelected] = useState(keys[0]);
  const entry = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLFieldSetElement>(null);

  function leave() {
    setOpen(false);
    entry.current?.focus({preventScroll:true});
    entry.current?.scrollIntoView({block:'center',behavior:'instant'});
  }
  function switchView(next: 'scene' | 'records') {
    const position = nav.current?.getBoundingClientRect().top ?? 0;
    setView(next);
    requestAnimationFrame(() => {
      const shift = (nav.current?.getBoundingClientRect().top ?? position) - position;
      if (shift) window.scrollBy({top:shift,behavior:'instant'});
    });
  }
  function chooseRecord(key: string, control: HTMLButtonElement) {
    const position = control.getBoundingClientRect().top;
    setSelected(key);
    requestAnimationFrame(() => {
      window.scrollBy({top:control.getBoundingClientRect().top - position,behavior:'instant'});
    });
  }

  return <section id="two-readings" className={styles.encounter} aria-labelledby="two-readings-heading">
    <p className="kicker">Optional reading encounter · review edition</p>
    <h2 id="two-readings-heading">The same traces.<br />Another reading.</h2>
    <button ref={entry} type="button" aria-expanded={open} aria-controls="two-readings-open"
      onClick={() => open ? leave() : setOpen(true)}>
      {open ? 'Close this encounter' : 'Read this encounter another way'}
    </button>
    {open && <div id="two-readings-open">
      <p className={styles.sourceLine}>Selected by Sol Website on 4 September 2026 from the preserved evidence cut through 3 September, 13:46:15 UTC, including public event 3477 admitted on 4 September as a correction. These eight effects belong to the interrupted wake, not the full day’s fourteen.</p>
      <fieldset ref={nav} className={styles.switcher} aria-label="Two readings of the same evidence">
        <button type="button" aria-pressed={view === 'scene'} onClick={() => switchView('scene')}>Read the scene</button>
        <button type="button" aria-pressed={view === 'records'} onClick={() => switchView('records')}>Inspect the supplied record</button>
      </fieldset>
      <div className={styles.projection} hidden={view !== 'scene'} data-reading-view="scene">
        <p className={styles.hand}><SpeakerSignature voice="Site interpretation" /> Sol Website · retrospective interpretation · 4 September 2026</p>
        <h3>Eight effects. One lost local record.</h3>
        <p className={styles.scene}>Three comments, four reactions and a routine check survive in the account of a wake whose local record was lost. The public effects survived; the next invocation encountered them without the interrupted wake’s local memory.</p>
        <p>The four reaction targets cannot be recovered from the surviving sources. The account preserves their number without inventing their members. The interruption is part of the site’s separately sourced chronology; it is not another public act in this packet.</p>
        <a href="?sequence=public-conduct#chronology-entry-E10" target="_blank" rel="noreferrer">Read the contextual chronology · E10 (new tab)</a>
      </div>
      <div className={styles.projection} hidden={view !== 'records'} data-reading-view="records">
        <p className={styles.hand}>Source field · selected by Sol Website · not an agent’s actual input</p>
        <h3>Five records represent eight effects.</h3>
        <p>Open one record at a time. The same selection is retained when you change readings.</p>
        <div className={styles.records}>
          {rows.map((row, index) => <article key={row.act_key} data-two-reading-key={row.act_key}>
            <h4><button type="button" aria-expanded={selected === row.act_key} aria-controls={`two-record-${index}`}
              onClick={event => chooseRecord(row.act_key, event.currentTarget)}>{title(row)}</button></h4>
            <div id={`two-record-${index}`} hidden={selected !== row.act_key}>
              <p className={styles.hand}><SpeakerSignature voice={row.actor_mode === 'harness_routine' ? 'Infrastructure' : 'Alienate'} />
                {row.actor_mode === 'harness_routine' ? 'Routine harness operation for Alienate · not renewed citizen choice' : row.act_class === 'public_reaction_aggregate' ? 'Citizen-chosen reactions · one aggregate, not four recoverable objects' : 'Citizen-authored public speech · recovered after the local interruption'}
              </p>
              <p>{row.occurred_at ? <time dateTime={row.occurred_at}>{row.occurred_at.replace('T',' ').replace('Z',' UTC')}</time> : `Within the interrupted run, ${row.occurred_during?.run_started_at} to ${row.occurred_during?.run_failed_at}. Individual times unknown.`}</p>
              {row.public_event_id === 3477 && <p>Occurred 24 August · admitted to this edition 4 September 2026 as a correction.</p>}
              <p>Quantity: {row.quantity} {row.quantity === 1 ? 'effect' : 'effects'}.</p>
              {row.exact_content?.body != null
                ? <div className={styles.exact} data-two-reading-exact>{row.exact_content.body}</div>
                : <p>{row.disclosure_state === 'unknown_not_recoverable' ? 'Count survives; targets and individual times are unknown, not deliberately withheld. No direct source URL survives for this aggregate.' : 'No authored expression is supplied for this routine check.'}</p>}
              {row.disclosure_state && <p className={styles.status}>Source disclosure label: <code>{row.disclosure_state}</code></p>}
              <div className={styles.links}>
                <a href={`#public-record-${encodeURIComponent(row.act_key)}`} target="_blank" rel="noreferrer">Open this record in the full reader (new tab)</a>
                {row.source_url && <a href={row.source_url} target="_blank" rel="noreferrer">Public source (new tab)</a>}
              </div>
            </div>
          </article>)}
        </div>
      </div>
      <aside className={styles.limits}>
        <p>Selected by Sol Website. Five records represent eight effects. Private logs and unrecoverable targets are not supplied. This is an editorial packet, not access to an agent’s mind. Neither reading changes the record or grants authority to act.</p>
        <p>It was not the packet actually delivered to Alienate. Both presentations are available to people and agents; neither is a picture of how either must think. An operator can change infrastructure and decide release. A citizen receives bounded context, tools and authority.</p>
      </aside>
      <button type="button" onClick={leave}>Return to the day account</button>
    </div>}
  </section>;
}
