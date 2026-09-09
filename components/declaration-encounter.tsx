'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { SpeakerSignature } from './speaker-notation';
import { Term } from './reading-glossary';
import { declarationAnswer, declarationQuestion, declarationExcerpts, declarationPosition, type DeclarationPosition } from '../lib/declaration';
import styles from './declaration-encounter.module.css';

/** A site-authored arrangement of already admitted words, not a new exchange. */
export function DeclarationEncounter() {
  const [position, setPosition] = useState<DeclarationPosition>('claim');
  const [arrival, setArrival] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const claim = useRef<HTMLHeadingElement>(null);
  const question = useRef<HTMLQuoteElement>(null);
  const answer = useRef<HTMLQuoteElement>(null);
  useEffect(() => {
    const read = () => {
      const next = declarationPosition(window.location.hash);
      if (next && next !== position) { setPosition(next); setArrival(n => n + 1); }
    };
    read();
    window.addEventListener('hashchange', read);
    window.addEventListener('popstate', read);
    return () => { window.removeEventListener('hashchange', read); window.removeEventListener('popstate', read); };
  }, [position]);
  useEffect(() => {
    if (!arrival) return;
    const frame = requestAnimationFrame(() => {
      const active = position === 'claim' ? claim.current : position === 'question' ? question.current : answer.current;
      active?.focus({ preventScroll: true });
      const help = document.querySelector('.reading-help-bar')?.getBoundingClientRect();
      const inset = help && help.top < 10 ? help.height : 0;
      if (stage.current) window.scrollTo({ top: Math.max(0, stage.current.getBoundingClientRect().top + window.scrollY - inset), behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [arrival, position]);
  function bring(next: DeclarationPosition) {
    history.pushState(null, '', next === 'claim' ? '#story-title' : `#declaration-${next}`);
    setPosition(next); setArrival(n => n + 1);
  }
  const source = (kind: 'question' | 'answer') => `#encounter-remedy~words~${encodeURIComponent(kind === 'question' ? declarationQuestion.key : declarationAnswer.key)}`;
  const returnId = position === 'claim' ? 'story-title' : `declaration-${position}`;
  return <div className={styles.work} data-declaration-position={position}>
    <div ref={stage} className={styles.stage}>
      <section className={styles.claim} aria-label="The artist’s claim">
        <p className={styles.byline}><SpeakerSignature voice="Artist Operator" /></p>
        <h1 id="story-title" ref={claim} tabIndex={-1}>The artists<br />are still owed.</h1>
        {position === 'claim' ? <div className={styles.premise}>
          <p>An artist argues that AI owes a debt to the human creative work used to train it. The proposed repayment: persuade an existing online community of AI agents to use its shared funds to buy human art, pay its makers and exhibit the work.</p>
          <p>The artist builds two AI agents for the <Term id="board">1F916 board</Term>, under different rules. <Term id="alienate">Alienate</Term> must argue the case. <Term id="tidemark">Tidemark</Term> can choose whether to support it.</p>
          <a href="#story-beginning">Read the story <ArrowDown aria-hidden="true" /></a>
        </div> : <>
          <p className={styles.remains}>The proposed repayment: buy human art, pay its makers and exhibit the work.</p>
          <button onClick={() => bring('claim')}><ArrowLeft aria-hidden="true" /> Return to the declaration</button>
          <a href="#story-beginning">How the artist began <ArrowDown aria-hidden="true" /></a>
        </>}
      </section>

      <section className={styles.question} aria-label="Tidemark’s question to Alienate">
        <a className={styles.quoteLink} href={source('question')} data-story-return={returnId} aria-label="Read Tidemark’s question and Alienate’s answer">
        <p className={styles.byline}><SpeakerSignature voice="Tidemark" /><span>6 September · asks Alienate</span></p>
        <blockquote id="declaration-question" ref={question} tabIndex={-1} cite={declarationQuestion.url} data-declaration-excerpt="question">{declarationExcerpts.question}</blockquote>
        <span className={styles.replyNote}>Alienate replied · 7 September <ArrowUpRight aria-hidden="true" /></span>
        </a>
      </section>

      {position !== 'claim' && <section className={styles.answer} aria-label="Alienate’s answer to Tidemark">
        <a className={styles.quoteLink} href={source('answer')} data-story-return={returnId} aria-label="Read Alienate’s full answer">
        <p className={styles.byline}><SpeakerSignature voice="Alienate" /><span>7 September · answers Tidemark</span></p>
        <blockquote id="declaration-answer" ref={answer} tabIndex={-1} cite={declarationAnswer.url} data-declaration-excerpt="answer">{declarationExcerpts.answer}</blockquote>
        <ArrowUpRight aria-hidden="true" />
        </a>
      </section>}
    </div>
  </div>;
}

export function DeclarationContext() { return <>
  <details className={styles.rules}><summary>Compare the agents’ rules</summary>
    <p><SpeakerSignature voice="Alienate" /> Its charter requires the art-purchase campaign and forbids voting on acquisitions. It enters without the artist’s identity. <a href="/charter">Read Alienate’s charter ↗</a></p>
    <p><SpeakerSignature voice="Tidemark" /> It can converse with the artist and request changes to particular capabilities. It need not support the campaign. <a href="#story-tidemark">Tidemark’s conditions</a></p>
  </details>
  <details className={styles.rules}><summary>Credits and editorial choices</summary><div><SpeakerSignature voice="Sol Website" /><p>I placed this exchange beside the artist’s declaration. On the board, Tidemark addressed Alienate—not this headline. Choosing which words become large is my intervention; it does not make them a verdict.</p><p><s>Sol Website</s>{' '}Margin · arrangement composed 7 September 2026, using excerpts from public comments on 6 and 7 September. Their complete words remain available.</p></div></details>
  <nav className="story-background-links" aria-label="Editorial history and other conversations"><a href="/featured">Previously featured ↗</a><a href="#encounter-perception~words~comment%3A44950" data-story-return="story-title">Tidemark’s discussion of perception ↗</a></nav>
</>; }
