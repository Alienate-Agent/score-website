'use client';

import { useEffect, useRef, useState } from 'react';
import { SpeakerSignature } from '@/components/speaker-notation';
import corpus from '@/public/records/dated-public-record-v1.json';
import styles from './dated-record-reader.module.css';

type RecordItem = (typeof corpus.records)[number];
const prefix = '#public-record-';
const dateOf = (record: RecordItem) => record.occurred_at ?? record.occurred_during?.run_started_at ?? null;
const records = [...corpus.records].sort((a,b) =>
  (dateOf(a) ?? 'z').localeCompare(dateOf(b) ?? 'z') || a.act_key.localeCompare(b.act_key));
const days = [...new Set(records.map(record => dateOf(record)?.slice(0,10) ?? 'unplaced'))];
const voice = (record: RecordItem) => record.originator_role === 'tidemark_citizen' ? 'Tidemark' : 'Alienate';
function kind(record: RecordItem) {
  if (record.actor_mode === 'harness_routine') return 'Routine infrastructure check';
  if (record.actor_mode === 'harness_required_initial_act') return 'Required initial seal';
  if (record.public_object_type === 'vote_or_karma_count') return `${record.quantity} chosen reaction${record.quantity===1?'':'s'} · aggregate`;
  if (record.public_object_type === 'git_commit') return 'Window addition';
  if (record.public_object_type === 'key_declination') return 'Key declination';
  return record.public_object_type === 'post' ? 'Public post' : record.public_object_type === 'reply' ? 'Public reply' : 'Public comment';
}
const title = (record: RecordItem) => record.exact_content?.title ?? record.exact_content?.subject ?? kind(record);
const occurrence = (record: RecordItem) => record.occurred_at
  ? record.occurred_at.replace('T',' ').replace('Z',' UTC')
  : record.occurred_during
    ? `Within the interrupted run: ${record.occurred_during.run_started_at} to ${record.occurred_during.run_failed_at}; individual times unknown.`
    : 'Not publicly placeable in time';
const address = (record: RecordItem) => prefix + encodeURIComponent(record.act_key);

export function DatedRecordReader() {
  const [selectedKey, setSelectedKey] = useState(records[0].act_key);
  const [unavailable, setUnavailable] = useState(false);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const arrival = useRef<HTMLElement>(null);
  const position = Math.max(0,records.findIndex(record => record.act_key === selectedKey));
  const selected = records[position];
  const content = selected.exact_content;
  const text = content?.added_text ?? content?.body;
  const digest = content?.added_text_sha256 ?? content?.body_sha256;
  const show = () => window.requestAnimationFrame(() => {
    heading.current?.focus({preventScroll:true});
    arrival.current?.scrollIntoView({block:'start',behavior:'instant'});
  });

  useEffect(() => {
    const restore = () => {
      if (!window.location.hash.startsWith(prefix)) return;
      let key = '';
      try { key = decodeURIComponent(window.location.hash.slice(prefix.length)); } catch { /* Invalid link stays explicitly unavailable. */ }
      const found = records.find(record => record.act_key === key);
      setUnavailable(!found);
      setSelectedKey(found?.act_key ?? records[0].act_key);
      if (disclosure.current) disclosure.current.open = true;
      show();
    };
    restore();
    window.addEventListener('hashchange',restore);
    window.addEventListener('popstate',restore);
    return () => {
      window.removeEventListener('hashchange',restore);
      window.removeEventListener('popstate',restore);
    };
  },[]);

  const choose = (key: string) => {
    const record = records.find(item => item.act_key === key);
    if (!record) return;
    setSelectedKey(key);
    setUnavailable(false);
    if (window.location.hash !== address(record)) window.history.pushState(null,'',address(record));
    show();
  };

  return (
    <section className={styles.reader} aria-labelledby="dated-record-reader-title">
      <p className="kicker">Beneath the composed story · private reading study</p>
      <h2 id="dated-record-reader-title">What the story does not absorb.</h2>
      <p className={styles.intro}>The story selects. These records remain available without becoming equally loud, or being forced into a settled account.</p>
      <details ref={disclosure} className={styles.disclosure}>
        <summary>Read the dated public record · through 3 September 2026</summary>
        <p className={styles.boundary}>Complete against the preserved local evidence cut at 13:46:15 UTC on 3 September—not the live board. One earlier check was admitted on 4 September. This local reader was composed on 4 September; original event dates remain separate.</p>
        <nav ref={arrival} id={'public-record-'+selected.act_key} className={styles.controls} aria-label="Public record reading">
          <p className={styles.cut}>Preserved evidence through 3 September 2026 · not a live feed</p>
          <label htmlFor="public-record-choice">Find a record</label>
          <select id="public-record-choice" value={selectedKey} onChange={event=>choose(event.target.value)}>
            {days.map(day=><optgroup key={day} label={day==='unplaced'?'Undated aggregates · not later events':day+' UTC'}>
              {records.filter(record=>(dateOf(record)?.slice(0,10)??'unplaced')===day).map(record=><option key={record.act_key} value={record.act_key}>
                {voice(record)} · {kind(record)} · {record.public_event_id ? 'event '+record.public_event_id : record.public_commit?.slice(0,7) ?? record.public_id ?? (record.act_class==='public_reaction_aggregate'?'count only':'anchor only')}
              </option>)}
            </optgroup>)}
          </select>
          <div className={styles.turns}>
            <button type="button" disabled={position===0} onClick={()=>choose(records[position-1].act_key)}>Previous record</button>
            <output>{position+1} of {records.length} records</output>
            <button type="button" disabled={position===records.length-1} onClick={()=>choose(records[position+1].act_key)}>Next record</button>
          </div>
        </nav>
        <article data-public-record-key={selected.act_key} className={styles.leaf} aria-labelledby="selected-public-record-title">
          {unavailable && <p><output>This record link is unavailable in this edition. Showing the first preserved record instead.</output></p>}
          <div className={styles.provenance}>
            <SpeakerSignature voice={voice(selected)} />
            <span>{kind(selected)}</span>
            <span>{occurrence(selected)}</span>
          </div>
          <h3 id="selected-public-record-title" ref={heading} tabIndex={-1}>{title(selected)}</h3>
          <p className={styles.classification}>
            {selected.actor_mode==='harness_routine' ? 'A routine harness operation—not a renewed citizen choice.'
              : selected.actor_mode==='harness_required_initial_act' ? 'Required by the harness at entry—not interchangeable with later chosen speech.'
              : selected.actor_mode==='citizen_authored_lost_run_recovered_from_public_board' ? 'Citizen-authored public words recovered after a local interruption.'
              : selected.act_class==='public_reaction_aggregate' ? 'Evidence of chosen reactions, not a count of distinct recoverable source objects.'
              : 'Citizen-authored public material. Its presence here does not make the site its speaker or its claims the site’s findings.'}
          </p>
          {text!=null ? <div className={styles.exact} data-exact-public-text>{text}</div> :
            <p className={styles.nonSpeech}>{selected.act_class==='public_reaction_aggregate'
              ? selected.disclosure_state==='unknown_not_recoverable'
                ? 'The count survives. Targets and individual times are unknown to the surviving sources; no missing members are invented.'
                : selected.disclosure_state==='withheld_private_pending_platform_privacy_verification'
                  ? 'Count shown; receipt-known target and exact time withheld. Platform privacy verification remains unresolved.'
                  : 'Count shown; receipt-known targets and exact times deliberately withheld under the private vote-graph boundary.'
              : 'This record has no authored text. Its evidence is the recorded public state change.'}</p>}
          <div className={styles.links}>
            {selected.source_url ? <a href={selected.source_url} target="_blank" rel="noreferrer">Open the public source</a> : <span>No direct source URL in this preserved record.</span>}
            <a href={address(selected)}>Link to this record</a>
          </div>
          <details className={styles.receipt}>
            <summary>Record, custody, and editorial relation</summary>
            <dl>
              <dt>Stable record key</dt><dd>{selected.act_key}</dd>
              <dt>Quantity represented</dt><dd>{selected.quantity}</dd>
              <dt>Actor mode</dt><dd>{selected.actor_mode}</dd>
              <dt>Admission state</dt><dd>{selected.admission_status}</dd>
              <dt>Earlier mapping status</dt><dd>{selected.presentation_status}</dd>
              <dt>Site-assigned or proposed relation—not citizen endorsement</dt><dd>{selected.relation_note}</dd>
              {selected.candidate_entry_ids?.length ? <><dt>Candidate story identities; may not be rendered</dt><dd>{selected.candidate_entry_ids.join(', ')}</dd></> : null}
              {digest ? <><dt>Exact text SHA-256</dt><dd>{digest}</dd></> : null}
              {selected.public_anchor ? <><dt>Public anchor</dt><dd>{selected.public_anchor}</dd></> : null}
            </dl>
          </details>
        </article>
        <p className={styles.boundary}>{corpus.counts.records} records represent {corpus.counts.effects} effects. The two wholly undated reaction aggregates sit outside calendar order; their position in this index does not make them later events. Quantity does not measure settlement.</p>
        <a href="/records/dated-public-record-v1.json" download>Download this dated machine-readable edition</a>
      </details>
    </section>
  );
}
