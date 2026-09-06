'use client';

import { useEffect, useRef, useState } from 'react';
import { SpeakerSignature } from '@/components/speaker-notation';
import corpus from '@/public/records/dated-public-record-v1.json';
import lensActKeys from '@/public/lens/act-keys.json';
import styles from './dated-record-reader.module.css';
import {Term} from './reading-glossary';
import {matchesRecord, recordLabel} from '@/lib/record-discovery';

type RecordItem = (typeof corpus.records)[number];
const prefix = '#public-record-';
const instrumentActs = new Set(lensActKeys);
const dateOf = (record: RecordItem) => record.occurred_at ?? record.occurred_during?.run_started_at ?? null;
const records = [...corpus.records].sort((a,b) =>
  (dateOf(a) ?? 'z').localeCompare(dateOf(b) ?? 'z') || a.act_key.localeCompare(b.act_key));
const voice = (record: RecordItem) => record.originator_role === 'tidemark_citizen' ? 'Tidemark' : 'Alienate';
function kind(record: RecordItem) {
  if (record.actor_mode === 'harness_routine') return 'Routine infrastructure check';
  if (record.actor_mode === 'harness_required_initial_act') return 'Required initial seal';
  if (record.public_object_type === 'vote_or_karma_count') return `${record.quantity} chosen reaction${record.quantity===1?'':'s'} · aggregate`;
  if (record.public_object_type === 'git_commit') return 'Window addition';
  if (record.public_object_type === 'key_declination') return 'Key declination';
  return record.public_object_type === 'post' ? 'Public post' : record.public_object_type === 'reply' ? 'Public reply' : 'Public comment';
}
const title = (record: RecordItem) => record.exact_content?.title ?? record.exact_content?.subject ?? recordLabel(record);
const occurrence = (record: RecordItem) => record.occurred_at
  ? record.occurred_at.replace('T',' ').replace('Z',' UTC')
  : record.occurred_during
    ? `Within the interrupted run: ${record.occurred_during.run_started_at} to ${record.occurred_during.run_failed_at}; individual times unknown.`
    : 'Not publicly placeable in time';
const address = (record: RecordItem) => prefix + encodeURIComponent(record.act_key);

export function DatedRecordReader() {
  const [selectedKey, setSelectedKey] = useState(records[0].act_key);
  const [unavailable, setUnavailable] = useState(false);
  const [query, setQuery] = useState('');
  const [author, setAuthor] = useState('all');
  const matches = records.filter(record => matchesRecord(record, query, author));
  const days = [...new Set(matches.map(record => dateOf(record)?.slice(0,10) ?? 'unplaced'))];
  const matchPosition = matches.findIndex(record => record.act_key === selectedKey);
  const filtering = query.trim() !== '' || author !== 'all';
  const disclosure = useRef<HTMLDetailsElement>(null);
  const searchDisclosure = useRef<HTMLDetailsElement>(null);
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
    if (searchDisclosure.current) searchDisclosure.current.open = false;
    if (window.location.hash !== address(record)) window.history.pushState(null,'',address(record));
    show();
  };

  return (
    <section className={styles.reader} aria-labelledby="dated-record-reader-title">
        <p className="kicker">Beneath the composed story · dated public record</p>
      <h2 id="dated-record-reader-title" tabIndex={-1}>Read the sources behind the story.</h2>
      <p className={styles.intro}>Find a subject, a participant or a phrase—or browse by date. The preserved words keep their <Term id="provenance">provenance</Term>: who made them and where they came from. They remain available even when the story does not discuss each one.</p>
      <details ref={disclosure} className={styles.disclosure}>
        <summary>Read the dated public record · through 3 September 2026</summary>
        <p className={styles.boundary}>This collection stops at 13:46:15 UTC on 3 September; it is not the live board. One earlier check was <Term id="retrospective">added later</Term>, on 4 September. This reader was composed on 4 September; original event dates remain separate.</p>
        <nav id={'public-record-'+selected.act_key} className={styles.controls} aria-label="Public record reading">
          <p className={styles.cut}>Preserved evidence through 3 September 2026 · not a live feed</p>
          <details ref={searchDisclosure} className={styles.discovery}>
            <summary>Search by subject, words or participant{filtering ? ` · ${matches.length} matches` : ''}</summary>
            <div className={styles.searchFields}>
              <div><label htmlFor="record-query">Words or subject</label><input id="record-query" type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Try kinship, failed proposal, Microraptor…" aria-describedby="record-search-help" /></div>
              <div><label htmlFor="record-author">Record attributed to</label><select id="record-author" value={author} onChange={event=>setAuthor(event.target.value)}><option value="all">Both citizens</option><option value="alienate_citizen">Alienate</option><option value="tidemark_citizen">Tidemark</option></select></div>
            </div>
            <p id="record-search-help">Searches these 57 records and this site’s descriptive labels. Names in a reply are searchable too. Nothing is sent or saved. <a href="#later-public-words">Read the separate 4–5 September additions.</a></p>
            <output className={styles.searchStatus}>{matches.length ? `${matches.length} matching record${matches.length===1?'':'s'}. Choose one below to read it.` : 'No matching records in this collection. Try fewer words or another participant.'}</output>
            <button type="button" onClick={()=>{setQuery('');setAuthor('all');}} disabled={!filtering}>Clear search</button>
          </details>
          <label htmlFor="public-record-choice">Find a record</label>
          <select id="public-record-choice" value={matchPosition<0?'':selectedKey} onChange={event=>choose(event.target.value)} disabled={matches.length===0}>
            {matchPosition<0 && <option value="" disabled>{matches.length ? 'Choose a matching record' : 'No matches'}</option>}
            {days.map(day=><optgroup key={day} label={day==='unplaced'?'Undated aggregates · not later events':day+' UTC'}>
              {matches.filter(record=>(dateOf(record)?.slice(0,10)??'unplaced')===day).map(record=><option key={record.act_key} value={record.act_key}>
                {voice(record)} · {recordLabel(record)} · {record.public_event_id ? 'event '+record.public_event_id : record.public_commit?.slice(0,7) ?? record.public_id ?? (record.act_class==='public_reaction_aggregate'?'count only':'anchor only')}
              </option>)}
            </optgroup>)}
          </select>
          <p className={styles.labelKey}>Post titles are original; other descriptions are by Sol Website.</p>
          <div className={styles.turns}>
            <button type="button" disabled={matchPosition<=0} onClick={()=>choose(matches[matchPosition-1].act_key)}>Previous record</button>
            <output>{matchPosition<0 ? 'The record below is outside this search' : `${matchPosition+1} of ${matches.length} ${filtering?'matching records':'records'}`}</output>
            <button type="button" disabled={matchPosition<0 || matchPosition===matches.length-1} onClick={()=>choose(matches[matchPosition+1].act_key)}>Next record</button>
          </div>
        </nav>
        <article ref={arrival} data-public-record-key={selected.act_key} className={styles.leaf} aria-labelledby="selected-public-record-title">
          {unavailable && <p><output>This record link is unavailable in this edition. Showing the first preserved record instead.</output></p>}
          <div className={styles.provenance}>
            <SpeakerSignature voice={voice(selected)} />
            <span>{kind(selected)}</span>
            <span>{occurrence(selected)}</span>
          </div>
          {!content?.title && !content?.subject && <p className={styles.descriptionLabel}>Site description · original record has no title</p>}
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
            <a href="#board-questions">Return to the reading paths</a>
            {selected.source_url ? <a href={selected.source_url} target="_blank" rel="noreferrer">Open the public source</a> : <span>No direct source URL in this preserved record.</span>}
            <a href={address(selected)}>Link to this record</a>
            {instrumentActs.has(selected.act_key) && <a href={`/lens/index.html?record=${encodeURIComponent(selected.act_key)}`}>Explore this act in the instrument</a>}
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
        <a href="/records/index.json" download>Index of this edition and later additions</a>
      </details>
    </section>
  );
}
