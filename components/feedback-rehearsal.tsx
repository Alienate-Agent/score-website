'use client';

import { useRef, useState } from 'react';

const visibilityOptions = [
  'Editorial team only',
  'May be quoted anonymously',
  'May be quoted with my chosen name',
];

function LocalDraft({ onLeave }: { onLeave: () => void }) {
  const [words, setWords] = useState('');
  const [where, setWhere] = useState('');
  const [kind, setKind] = useState('');
  const [visibility, setVisibility] = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const wordsRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const visibilityRef = useRef<HTMLInputElement>(null);

  function clearDraft() {
    setWords(''); setWhere(''); setKind(''); setVisibility('');
    setPreview(false); setError(''); wordsRef.current?.focus();
  }

  return (
    <div className="feedback-rehearsal__draft" id="feedback-local-draft">
      <p id="feedback-notice">
        Nothing you enter here is sent to an editor or agent. This is a local
        rehearsal of a possible feedback form. Do not enter secrets, contact
        details or guesses about a withheld identity. You can clear the draft
        at any time.
      </p>
      <form aria-label="Local feedback rehearsal" aria-describedby="feedback-notice" autoComplete="off"
        onSubmit={event => {
          event.preventDefault();
          setPreview(false);
          if (!words.trim()) {
            setError('Write a response to preview it locally.');
            wordsRef.current?.focus(); return;
          }
          if (!visibility) {
            setError('Choose a possible audience for this rehearsal. Nothing will be sent.');
            visibilityRef.current?.focus(); return;
          }
          setError(''); setPreview(true);
          requestAnimationFrame(() => previewRef.current?.focus());
        }}>
        <label htmlFor="feedback-words">What did you notice?</label>
        <textarea ref={wordsRef} id="feedback-words" rows={6} value={words}
          aria-invalid={Boolean(error && !words.trim())} aria-describedby="feedback-error"
          onChange={event => { setWords(event.target.value); setPreview(false); setError(''); }} />
        <div className="feedback-rehearsal__fields">
          <div>
            <label htmlFor="feedback-where">Where in the work? <span>(optional)</span></label>
            <input id="feedback-where" value={where} onChange={event => { setWhere(event.target.value); setPreview(false); }} />
          </div>
          <div>
            <label htmlFor="feedback-kind">Type of response <span>(optional)</span></label>
            <select id="feedback-kind" value={kind} onChange={event => { setKind(event.target.value); setPreview(false); }}>
              <option value="">Choose, if useful</option>
              {['Felt response', 'Access barrier', 'Factual or provenance correction', 'Broken interaction', 'Enhancement', 'Another observation'].map(option => <option key={option}>{option}</option>)}
            </select>
          </div>
        </div>
        <fieldset className="feedback-rehearsal__audience" aria-describedby="feedback-permission feedback-error">
          <legend>Who could see it in a future service?</legend>
          {visibilityOptions.map((option, index) => <label key={option}>
            <input ref={index === 0 ? visibilityRef : undefined} type="radio" name="feedback-audience"
              value={option} checked={visibility === option}
              onChange={() => { setVisibility(option); setPreview(false); setError(''); }} />
            {option}
          </label>)}
        </fieldset>
        <p id="feedback-permission" className="feedback-rehearsal__note">These are proposed choices for a possible service, not permission you are granting now. No name or contact details are collected here.</p>
        <p id="feedback-error" role="alert">{error}</p>
        <div className="feedback-rehearsal__actions">
          <button type="submit">Preview locally</button>
          <button type="button" onClick={clearDraft}>Clear this draft</button>
          <button type="button" onClick={onLeave}>Leave and discard draft</button>
        </div>
      </form>
      {preview && <section ref={previewRef} tabIndex={-1} className="feedback-rehearsal__preview" aria-labelledby="feedback-preview-title">
        <p className="kicker">Your local preview · not submitted</p>
        <h3 id="feedback-preview-title">This is what you wrote.</h3>
        <p className="feedback-rehearsal__words">{words}</p>
        <dl>
          {where && <><dt>Where</dt><dd>{where}</dd></>}
          {kind && <><dt>Type</dt><dd>{kind}</dd></>}
          <dt>Hypothetical audience</dt><dd>{visibility}</dd>
        </dl>
        <p>There is no recipient. Editing a field closes this preview; clearing or leaving removes the draft from this rehearsal.</p>
      </section>}
      <details className="feedback-rehearsal__examples">
        <summary>How an editor might respond</summary>
        <p>Invented examples—not responses to your draft, and not promises from an agent.</p>
        <dl>
          <dt>A broken source link</dt><dd>Selected for repair. The original report remains attributable beside the correction.</dd>
          <dt>“I felt shut out.”</dt><dd>Retained as a reading of the experience, without a promised design change.</dd>
          <dt>A request to reveal a withheld identity</dt><dd>Declined: reader interest does not remove the work’s reveal boundary.</dd>
          <dt>Two conflicting navigation suggestions</dt><dd>Unresolved. An editor has not chosen between them.</dd>
        </dl>
      </details>
    </div>
  );
}

export function FeedbackRehearsal() {
  const [open, setOpen] = useState(false);
  const openRef = useRef<HTMLButtonElement>(null);
  function leave() { setOpen(false); openRef.current?.focus(); }

  return <section id="feedback-rehearsal" className="feedback-rehearsal" aria-labelledby="feedback-heading">
    <p className="kicker">Interface rehearsal · nothing is sent</p>
    <h2 id="feedback-heading">A place for your response.</h2>
    <p>The account is made for people. What happens when a reader answers back?</p>
    <button ref={openRef} type="button" aria-expanded={open} aria-controls="feedback-local-draft"
      onClick={() => { if (open) leave(); else setOpen(true); }}>
      {open ? 'Close and discard draft' : 'Leave a response — local rehearsal'}
    </button>
    {open && <LocalDraft onLeave={leave} />}
  </section>;
}
