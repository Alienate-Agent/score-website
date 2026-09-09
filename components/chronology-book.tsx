'use client';
import {CreditText} from './credit-text';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronLeft, ChevronRight, Copy } from 'lucide-react';

import { EvidenceRegisterSpecimen } from '@/components/evidence-register-specimen';
import { privateRecordSourceNote } from '@/lib/public-release-notes';
import { EventChord, SpeakerSignature } from '@/components/speaker-notation';
import { Button } from '@/components/ui/button';
import { readChronologyLocation, writeChronologyLocation } from '@/lib/chronology-location';
import {
  entries,
  readingModes,
  sequenceLabels,
  type ChronologyEntry,
  type ReadingMode,
  type SequenceId,
} from '@/lib/chronology';

type SequenceFilter = SequenceId | 'all';

const sequenceOrder: SequenceId[] = [
  'opening',
  'public-conduct',
  'movement-one',
  'study-002',
  'first-public-mark',
  'interrupted-wake',
  'alienate-tag-gap',
];

const stateGlyph: Record<ChronologyEntry['entryState'], string> = {
  'full entry': '●',
  'empty measure': '𝄽',
  'correction plate': '◇',
  'infrastructure incident': '×',
};

function orderEntries(input: ChronologyEntry[], mode: ReadingMode) {
  const copy = [...input];
  if (mode === 'event') {
    return copy.sort(
      (a, b) =>
        sequenceOrder.indexOf(a.sequence) - sequenceOrder.indexOf(b.sequence) ||
        a.chronologyAt.localeCompare(b.chronologyAt),
    );
  }
  if (mode === 'voice') {
    return copy.sort(
      (a, b) =>
        a.voices[0].localeCompare(b.voices[0]) ||
        a.chronologyAt.localeCompare(b.chronologyAt),
    );
  }
  if (mode === 'movement') {
    return copy.sort(
      (a, b) =>
        a.movement.localeCompare(b.movement) ||
        a.chronologyAt.localeCompare(b.chronologyAt),
    );
  }
  return copy.sort((a, b) => a.chronologyAt.localeCompare(b.chronologyAt));
}

function registerLabel(entry: ChronologyEntry, mode: ReadingMode) {
  if (mode === 'voice') return entry.voices.join(' · ');
  if (mode === 'movement') return entry.movement;
  if (mode === 'event') return sequenceLabels[entry.sequence];
  return `${entry.calendarLabel} · ${entry.clockLabel}`;
}

function MachineLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="machine-line">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ChronologyBook() {
  const [mode, setMode] = useState<ReadingMode>('date');
  const [sequence, setSequence] = useState<SequenceFilter>('all');
  const [currentId, setCurrentId] = useState(
    entries.find((entry) => entry.id === 'E09')?.id ?? entries[0]?.id ?? '',
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unavailableLink, setUnavailableLink] = useState(false);
  const [arrival, setArrival] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const overviewRef = useRef<HTMLElement>(null);
  const controlsRef = useRef<HTMLElement>(null);
  const arrangementRef = useRef<HTMLDetailsElement>(null);
  const cancelArrivalRef = useRef<(() => void) | null>(null);

  const revealSelection = () => setArrival(value => value + 1);

  useEffect(() => {
    if (!arrival) return;
    let frame = 0, remaining = 4, cancelled = false, focused = false;
    const interactions = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    const align = () => {
      if (cancelled) return;
      if (!focused) {
        headingRef.current?.focus({preventScroll:true});
        overviewRef.current?.querySelector('[aria-current="step"]')
          ?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
        focused = true;
      }
      if (headingRef.current && controlsRef.current) {
        const controls = controlsRef.current;
        const inset = (parseFloat(getComputedStyle(controls).top) || 0) + controls.offsetHeight + 16;
        window.scrollTo({top:Math.max(0,window.scrollY+headingRef.current.getBoundingClientRect().top-inset),behavior:'instant'});
      }
      if (--remaining > 0) frame = requestAnimationFrame(align);
    };
    const settle = () => {
      if (cancelled) return;
      cancelAnimationFrame(frame);
      remaining = 4;
      frame = requestAnimationFrame(align);
    };
    const settleRestoration = () => {
      if (cancelled || !headingRef.current || !controlsRef.current) return;
      const controls = controlsRef.current;
      const inset = (parseFloat(getComputedStyle(controls).top) || 0) + controls.offsetHeight + 16;
      if (Math.abs(headingRef.current.getBoundingClientRect().top - inset) > 1) settle();
    };
    const cancel = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(expiry);
      window.removeEventListener('load', settle);
      window.removeEventListener('scroll', settleRestoration);
      for (const name of interactions) window.removeEventListener(name, cancel);
    };
    // Header measurements, fonts and browser scroll restoration can settle
    // after hydration. Re-align only this arrival, never a reader's own scroll.
    const expiry = window.setTimeout(cancel, 1500);
    cancelArrivalRef.current = cancel;
    for (const name of interactions) window.addEventListener(name, cancel, {passive:true});
    window.addEventListener('load', settle, {once:true});
    // History may restore scroll after the first frames on the hosted page.
    // Watch only this bounded arrival; real reader input cancels it above.
    window.addEventListener('scroll', settleRestoration, {passive:true});
    void document.fonts.ready.then(settle);
    settle();
    return cancel;
  }, [arrival]);

  useEffect(() => {
    const readLocation = () => {
      const hash = window.location.hash;
      if (hash && hash !== '#chronology' && !hash.startsWith('#chronology-entry-')) return;
      const location = readChronologyLocation(
        new URL(window.location.href), entries, 'E09',
      );
      setMode(location.selection.mode);
      setSequence(location.selection.sequence);
      setCurrentId(location.selection.id);
      setUnavailableLink(location.unavailable);
      if (location.requested) revealSelection();
    };
    const openEntry = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (!entries.some((entry) => entry.id === id)) return;
      setSequence('all');
      setCurrentId(id);
      setUnavailableLink(false);
      const url = writeChronologyLocation(new URL(window.location.href), {
        id,
        mode: readChronologyLocation(new URL(window.location.href), entries, 'E09').selection.mode,
        sequence: 'all',
      });
      if (url.href !== window.location.href) window.history.pushState(null, '', url);
      revealSelection();
    };
    readLocation();
    window.addEventListener('popstate', readLocation);
    window.addEventListener('hashchange', readLocation);
    window.addEventListener('score:open-entry', openEntry);
    return () => {
      window.removeEventListener('popstate', readLocation);
      window.removeEventListener('hashchange', readLocation);
      window.removeEventListener('score:open-entry', openEntry);
    };
  }, []);

  const ordered = useMemo(() => {
    const filtered =
      sequence === 'all'
        ? entries
        : entries.filter((entry) => entry.sequence === sequence);
    return orderEntries(filtered, mode);
  }, [mode, sequence]);

  const page = Math.max(
    0,
    ordered.findIndex((entry) => entry.id === currentId),
  );
  const current = ordered[page] ?? ordered[0];

  if (!current) return null;

  const rememberSelection = (
    id: string, nextMode = mode, nextSequence = sequence,
  ) => {
    const url = writeChronologyLocation(new URL(window.location.href), {
      id, mode: nextMode, sequence: nextSequence,
    });
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    setUnavailableLink(false);
  };

  const moveToEntry = (entry: ChronologyEntry | undefined) => {
    if (!entry) return;
    setCurrentId(entry.id);
    rememberSelection(entry.id);
    revealSelection();
  };

  const previous = () => {
    moveToEntry(ordered[Math.max(0, page - 1)]);
  };
  const next = () => {
    moveToEntry(ordered[Math.min(ordered.length - 1, page + 1)]);
  };

  const copyId = async () => {
    await navigator.clipboard?.writeText(current.id);
    setCopiedId(current.id);
  };

  const changeMode = (nextMode: ReadingMode) => {
    setMode(nextMode);
    rememberSelection(current.id, nextMode);
    if (arrangementRef.current) arrangementRef.current.open = false;
    returnToMark();
  };

  function returnToMark() {
    cancelArrivalRef.current?.();
    window.requestAnimationFrame(() => {
      const mark = overviewRef.current?.querySelector<HTMLButtonElement>('[aria-current="step"]');
      mark?.focus({preventScroll:true});
      mark?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      if (mark && controlsRef.current) {
        const inset = (parseFloat(getComputedStyle(controlsRef.current).top) || 0) + 16;
        window.scrollTo({top:Math.max(0,window.scrollY+mark.getBoundingClientRect().top-inset),behavior:'instant'});
      }
    });
  }

  const changeSequence = (nextSequence: SequenceFilter) => {
    const nextEntries =
      nextSequence === 'all'
        ? entries
        : entries.filter((entry) => entry.sequence === nextSequence);
    setSequence(nextSequence);
    let selectedId = currentId;
    if (!nextEntries.some((entry) => entry.id === currentId)) {
      const first = orderEntries(nextEntries, mode)[0];
      if (first) {
        selectedId = first.id;
        setCurrentId(first.id);
      }
    }
    rememberSelection(selectedId, mode, nextSequence);
    if (arrangementRef.current) arrangementRef.current.open = false;
    revealSelection();
  };

  return (
    <section
      id="chronology"
      className="chronology-shell"
      aria-labelledby="chronology-heading"
    >
      <div className="score-frontmatter">
        <div>
          <p className="kicker">Reading instrument · visual score</p>
          <h2 id="chronology-heading">Chronology</h2>
        </div>
        <p className="frontmatter-note">
          Each mark opens a passage in the story. Change the order to follow
          dates, events, voices, or movements; the selected passage stays yours.
        </p>
      </div>

      <details className="notation-guide">
        <summary>How to read the hands</summary>
        <div className="notation-guide__content">
          <SpeakerSignature voice="Artist Operator" />
          <SpeakerSignature voice="Alienate" />
          <SpeakerSignature voice="Tidemark" />
          <SpeakerSignature voice="Polity participant" />
          <SpeakerSignature voice="Advisor" />
          <SpeakerSignature voice="Infrastructure" />
          <SpeakerSignature voice="This site" />
          <p>
            A mark names an attributed origin in this site&apos;s notation. A
            stack means several parts enter one scored event—not agreement,
            shared authorship, equal power, or a shared speaker. Horizontal
            offset carries a documented route.
          </p>
        </div>
      </details>

      <details ref={arrangementRef} className="score-arrangement">
        <summary>Arrange the score <span>{readingModes.find(reading => reading.id === mode)?.label} · {sequenceLabels[sequence]}</span></summary>
      <nav className="reading-modes" aria-label="Read the chronology by">
        {readingModes.map((reading) => (
          <Button
            key={reading.id}
            type="button"
            variant="ghost"
            aria-pressed={mode === reading.id}
            onClick={() => changeMode(reading.id)}
            className="reading-mode"
          >
            <span>{reading.label}</span>
            <small>{reading.note}</small>
          </Button>
        ))}
      </nav>

      <nav className="sequence-index" aria-label="Story sequences">
        {(Object.keys(sequenceLabels) as SequenceFilter[]).map((id) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            aria-pressed={sequence === id}
            onClick={() => changeSequence(id)}
            className="sequence-tab"
          >
            {sequenceLabels[id]}
          </Button>
        ))}
      </nav>

      </details>

      <nav
        ref={overviewRef}
        id={`chronology-entry-${current.id}`}
        className="score-overview"
        aria-label="Representative score overview"
        aria-describedby="score-spacing-note"
      >
        <div className="overview-key" aria-hidden="true">
          <span>● entry</span>
          <span>𝄽 rest</span>
          <span>◇ correction</span>
          <span>× interruption</span>
        </div>
        <div className="overview-staff">
          {ordered.map((entry, index) => (
            <button
              type="button"
              key={entry.id}
              className={`score-mark score-mark--${entry.constitution} ${index === page ? 'is-current' : ''}`}
              aria-label={`Open ${entry.id}: ${entry.title}`}
              aria-current={index === page ? 'step' : undefined}
              title={`${entry.id} · ${entry.title}`}
              onClick={() => moveToEntry(entry)}
            >
              <EventChord entryId={entry.id} voices={entry.voices} />
              <span className="score-mark__state" aria-hidden="true">
                {stateGlyph[entry.entryState]}
              </span>
            </button>
          ))}
        </div>
        <p id="score-spacing-note" className="score-spacing-note">
          Reading order, not elapsed time.
        </p>
      </nav>

      {unavailableLink && (
        <p className="frontmatter-note entry-link-notice">
          <output>
            This entry link is unavailable in this edition. Showing {current.id}
            {' '}instead; choose a mark to continue with an available entry.
          </output>
        </p>
      )}
      <div className="leaf-stage">
        <nav ref={controlsRef} className="page-controls" aria-label="Measure navigation">
          <Button
            type="button"
            variant="ghost"
            onClick={previous}
            disabled={page === 0}
            className="page-turn"
            aria-label={`Previous measure${page > 0 ? `: ${ordered[page - 1]?.title}` : ''}`}
          >
            <ChevronLeft aria-hidden="true" /> previous
          </Button>
          <button type="button" className="score-return-mark" onClick={returnToMark} aria-label={`Back to selected score mark ${current.id}`}>
            <span aria-live="polite">{current.id} · {page + 1} of {ordered.length}</span>
            <span>Back to mark <ArrowUp aria-hidden="true" /></span>
          </button>
          <Button
            type="button"
            variant="ghost"
            onClick={next}
            disabled={page === ordered.length - 1}
            className="page-turn"
            aria-label={`Next measure${page < ordered.length - 1 ? `: ${ordered[page + 1]?.title}` : ''}`}
          >
            next <ChevronRight aria-hidden="true" />
          </Button>
        </nav>

        <div className="leaf-stack" aria-hidden="true" />
        <article className={`record-leaf record-leaf--${current.constitution}`}>
          <div className="leaf-running-head">
            <span>{registerLabel(current, mode)}</span>
            <span>
              leaf {String(page + 1).padStart(2, '0')} /{' '}
              {String(ordered.length).padStart(2, '0')}
            </span>
          </div>

          <div className="human-register">
            <div className="entry-notation">
              <span className="entry-glyph" aria-hidden="true">
                {stateGlyph[current.entryState]}
              </span>
              <EventChord entryId={current.id} voices={current.voices} />
              <span>{current.id}</span>
              <span>{current.entryState}</span>
              <span>{current.entryForm}</span>
              {current.absenceKind ? <span>{current.absenceKind}</span> : null}
              {current.temporalStatus === 'retroactive' ? (
                <span className="retroactive-tag">retroactive</span>
              ) : null}
              {current.admissionStatus ? (
                <span className="retroactive-tag">
                  {current.admissionStatus}
                </span>
              ) : null}
            </div>

            <p className="entry-date">{current.calendarLabel}</p>
            <h3
              id={`chronology-title-${current.id}`}
              ref={headingRef}
              tabIndex={-1}
            >
              {current.title}
            </h3>
            {current.summary ? (
              <p className="entry-summary">{current.summary}</p>
            ) : (
              <figure
                className="typeset-rest"
                aria-label={`Empty measure: ${current.absenceKind ?? 'unknown absence'}`}
              />
            )}
            <p className="entry-body">{current.body}</p>
            {privateRecordSourceNote(current.id) ? (
              <aside className="editorial-account" aria-label="Source and interpretation">
                <p><CreditText text={privateRecordSourceNote(current.id) ?? ''}/></p>
              </aside>
            ) : null}

            {current.creationAccount ? (
              <aside className="editorial-account" aria-label="Creation account provenance">
                <p className="editorial-account__byline"><SpeakerSignature voice="Site interpretation" /> <s>Sol Website</s>{' '}Margin · retrospective</p>
                <p>{current.creationAccount.basis}</p>
                <p>{current.admissionStatus === 'later admission'
                  ? `Composed and admitted ${current.creationAccount.composedOn}.`
                  : `Account expanded ${current.creationAccount.composedOn}; original entry and event anchor retained.`}</p>
              </aside>
            ) : null}

            {current.charterContext ? (
              <div className="charter-context">
                <p className="charter-context__label">Terms of the Score · this site’s account</p>
                <p>{current.charterContext.text}</p>
                <a href={current.charterContext.url} target="_blank" rel="noreferrer">
                  {current.charterContext.label}
                </a>
              </div>
            ) : null}

            {current.editorialAccount ? (
              <div className="editorial-account">
                <p className="editorial-account__byline">
                  <SpeakerSignature voice="Site interpretation" />
                  <span>{<CreditText text={current.editorialAccount.author}/>} · composed {current.editorialAccount.composedOn} · admitted {current.editorialAccount.admittedOn}</span>
                </p>
                <p>{<CreditText text={current.editorialAccount.qualification}/>}</p>
                <a href={`#public-record-${encodeURIComponent(current.editorialAccount.sourceActKey)}`}>
                  Read Alienate’s exact public words →
                </a>
              </div>
            ) : null}

            {current.plateStates ? (
              <fieldset
                className="plate-states"
                aria-label="Retained correction states"
              >
                {current.plateStates.map((state) => (
                  <div className="plate-state" key={state.label}>
                    <span>{state.label}</span>
                    <p>{state.text}</p>
                  </div>
                ))}
              </fieldset>
            ) : null}
          </div>

          <aside
            className="machine-margin"
            aria-label={`Verification receipt for ${current.id}`}
          >
            <div className="margin-heading">
              <span>verification receipt</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="copy-control"
                onClick={copyId}
                aria-label={`Copy entry identifier ${current.id}`}
              >
                {copiedId === current.id ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Copy aria-hidden="true" />
                )}
              </Button>
            </div>

            <dl className="receipt-lines">
              <MachineLine label="entry_id">{current.id}</MachineLine>
              <MachineLine label="event / composition">
                {current.calendarLabel}
                {current.temporalStatus === 'retroactive'
                  ? ` · ${current.composedLabel}`
                  : ''}
              </MachineLine>
              <MachineLine label="attributed parts">
                {current.voices.join(' · ')}
              </MachineLine>
              <MachineLine label="status">{current.status}</MachineLine>
              <MachineLine label="source / verification">
                {current.publicSource ? (
                  <>
                    <a
                      href={current.publicSource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {current.publicSource.label}
                    </a>{' '}
                    · {current.verification}
                  </>
                ) : (
                  current.verification
                )}
              </MachineLine>
              {current.relationNote ? (
                <MachineLine label="relation">
                  {current.relationNote}
                </MachineLine>
              ) : null}
            </dl>

            <details className="machine-disclosure">
              <summary>Inspect the full machine record</summary>
              <dl>
                <MachineLine label="entry_id">{current.id}</MachineLine>
                <MachineLine label="chronology_at">
                  {current.chronologyAt}
                </MachineLine>
                <MachineLine label="composed">
                  {current.composedLabel}
                </MachineLine>
                <MachineLine label="temporal relation">
                  {current.temporalStatus}
                </MachineLine>
                <MachineLine label="entry form">
                  {current.entryForm}
                </MachineLine>
                <MachineLine label="site admission">
                  {current.admissionStatus ?? 'original corpus'}
                </MachineLine>
                <MachineLine label="movement">{current.movement}</MachineLine>
                <MachineLine label="constitution">
                  {current.constitution}
                </MachineLine>
                <MachineLine label="origin / route">
                  {<CreditText text={current.route}/>}
                </MachineLine>
                <MachineLine label="status">{current.status}</MachineLine>
                <MachineLine label="kind">
                  {current.kinds.join(' · ')}
                </MachineLine>
                <MachineLine label="sensitivity">
                  {current.sensitivity}
                </MachineLine>
                <MachineLine label="verification">
                  {current.verification}
                </MachineLine>
              </dl>
              <div className="record-trail">
                <p>Record trail</p>
                <ol>
                  {current.recordTrail.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            </details>
          </aside>
        </article>
      </div>

      <aside
        className="chronology-experiment"
        aria-label="Optional chronology experiment"
      >
        <p className="kicker">Experiment · optional · 22–26 August</p>
        <details>
          <summary>Try the same days in clock time—not reading order</summary>
          <p className="experiment-introduction">
            Here, distance means elapsed time. Compare the site&apos;s chosen
            story with the public records beneath it. This is a separate design
            test; its selections do not turn the story&apos;s pages.
          </p>
          <EvidenceRegisterSpecimen />
        </details>
        <a className="experiment-bypass" href="#conduct-leaf-heading">
          Continue to August 24: one day in detail
        </a>
      </aside>
    </section>
  );
}
