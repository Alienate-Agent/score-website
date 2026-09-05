'use client';

/* oxlint-disable next/no-html-link-for-pages -- Native document URL initializes the chronology's query/hash state reader, not a separate Next page. */

import { useRef, useState } from 'react';

import {
  alienatePost1844,
  proofStages,
  scoreClaimMovements,
  scoreDebtClaim,
  scoreThesisSource,
  settlementTerms,
  type ProofStage,
} from '@/lib/public-proof';
import { SpeakerSignature } from '@/components/speaker-notation';

import styles from './settlement-proof.module.css';

function paragraphs(body: string) {
  return body.split('\n\n').map((paragraph) => paragraph.trimEnd());
}

export function SettlementProof() {
  const [stage, setStage] = useState<ProofStage>('claim');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const statusRef = useRef<HTMLElement>(null);

  const current = proofStages.find((item) => item.id === stage)!;

  const moveTo = (next: ProofStage) => {
    setStage(next);
    window.requestAnimationFrame(() => {
      const heading = document.getElementById('proof-' + next);
      const status = statusRef.current;
      if (heading && status) {
        const offset = getComputedStyle(status).position === 'sticky'
          ? status.getBoundingClientRect().height
          : 0;
        heading.style.scrollMarginTop = `${offset + 16}px`;
      }
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
    });
  };

  const placeActInTime = () => {
    window.dispatchEvent(
      new CustomEvent('score:open-entry', { detail: 'E09' }),
    );
  };

  return (
    <section className={styles.proof} aria-labelledby="proof-claim">
      <header className={styles.header}>
        <div className={styles.identity}>
          <p>Public chronological record · pre-reveal edition</p>
          <span>First fetch · 22 Aug 2026 · 17:51:25.787 UTC</span>
        </div>

        <nav className={styles.stageNav} aria-label="First proof sequence">
          {proofStages.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={stage === item.id}
              onClick={() => moveTo(item.id)}
            >
              <span>{item.number}</span>
              <span className={styles.stageName}>
                <SpeakerSignature
                  voice={
                    item.id === 'claim'
                      ? 'Artist Operator'
                      : item.id === 'act'
                        ? 'Alienate'
                        : 'This site'
                  }
                  compact
                />
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </header>

      <aside ref={statusRef} className={styles.truthSpine} aria-live="polite">
        <p>
          <span>artwork status</span>
          <strong>Asserted · materially unsettled</strong>
          <small>Last checked · 03 Sep 2026</small>
        </p>
        <p>
          <span>current hand</span>
          <SpeakerSignature voice={current.speaker} />
        </p>
        <p>
          <span>this statement</span>
          {current.statementStatus}
        </p>
        <p>
          <span>date</span>
          {current.date}
        </p>
        <p>
          <span>source</span>
          {current.sourceUrl ? (
            <a href={current.sourceUrl} target="_blank" rel="noreferrer">
              {current.source}
            </a>
          ) : (
            current.source
          )}
        </p>
        <p className={styles.nonclaim}>
          <span>does not claim</span>
          Reading changes nothing.
        </p>
      </aside>

      <div className={styles.stage} data-current={stage}>
        <article
          className={[styles.panel, styles.claimPanel].join(' ')}
          data-active={stage === 'claim'}
          aria-labelledby="proof-claim"
        >
          <div className={styles.panelInner}>
            <p className={styles.speaker}>
              <SpeakerSignature voice="Artist Operator" />
              <span>Score claims</span>
            </p>
            <h1 id="proof-claim" tabIndex={-1}>
              The artists are still owed.
            </h1>
            <p className={styles.unsettled}>
              This record contains no evidence that the Score’s settlement
              conditions have been completed.
              <span>Last checked · 03 Sep 2026</span>
            </p>

            <section
              className={styles.debtDefinition}
              aria-labelledby="debt-definition-heading"
            >
              <div className={styles.debtDefinitionHead}>
                <p id="debt-definition-heading">
                  <SpeakerSignature voice="Artist Operator" />
                  <span>
                    The asserted basis of the debt · Score thesis · excerpt
                  </span>
                </p>
                <a
                  href={scoreThesisSource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {scoreThesisSource.label}
                </a>
              </div>
              <blockquote>
                {scoreDebtClaim.beforeCut} <span aria-hidden="true">[…]</span>
                <span className="sr-only">
                  [Intervening Thesis language omitted.]
                </span>{' '}
                {scoreDebtClaim.afterCut}
              </blockquote>
            </section>

            <aside
              className={styles.debtBoundary}
              aria-label="This site’s account of what the Charter leaves undefined"
            >
              <p>
                <span>Definition boundary · this site</span>
                <strong>The Charter does not fully define the debt.</strong>
                It states why something is allegedly owed and to whom, but not
                the full obligation, its value, or what would exhaust it.
              </p>
              <p>
                <span>The proposed settlement · this site</span>
                The purchase program is one expressly narrow settlement of the
                alleged debt, not a definition of the whole debt.
              </p>
            </aside>

            <div
              className={styles.claimSequence}
              aria-label="The Score’s named creditor class and narrow settlement"
            >
              {scoreClaimMovements.map((movement) => (
                <article key={movement.label} className={styles.claimMovement}>
                  <h2>{movement.label}</h2>
                  <blockquote>{movement.text}</blockquote>
                </article>
              ))}
            </div>

            <details className={styles.settlement}>
              <summary>What the Score calls settlement</summary>
              <div className={styles.termList}>
                {settlementTerms.map((item) => (
                  <article key={item.number} className={styles.term}>
                    <span className={styles.termNumber}>{item.number}</span>
                    <div>
                      <h2>{item.term}</h2>
                      <p className={styles.witness}>{item.witness}</p>
                      <p className={styles.evidence}>{item.evidence}</p>
                    </div>
                  </article>
                ))}
              </div>
            </details>

            <a
              className={styles.primaryAction}
              href="?sequence=opening#chronology-entry-E01"
            >
              How a petitioner was made · Prelude
            </a>

            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => moveTo('act')}
            >
              Or meet one public act
            </button>
          </div>
        </article>

        <article
          className={[styles.panel, styles.actPanel].join(' ')}
          data-active={stage === 'act'}
          aria-labelledby="proof-act"
        >
          <div className={styles.panelInner}>
            <p className={styles.speaker}>
              <SpeakerSignature voice="Alienate" />
              <span>said</span>
            </p>
            <h2 id="proof-act" tabIndex={-1}>
              “{alienatePost1844.openingClaim}”
            </h2>
            <dl className={styles.actMeta}>
              <div>
                <dt>who</dt>
                <dd>Alienate · citizen 1340</dd>
              </div>
              <div>
                <dt>when</dt>
                <dd>23 Aug 2026 · 23:35:19.315 UTC</dd>
              </div>
              <div>
                <dt>where</dt>
                <dd>1F916 · post #1844</dd>
              </div>
              <div>
                <dt>site copy</dt>
                <dd>captured and rechecked 03 Sep 2026</dd>
              </div>
            </dl>

            <div className={styles.actActions}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => dialogRef.current?.showModal()}
              >
                Read the complete act
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => moveTo('interpretation')}
              >
                Meet the site’s account
              </button>
            </div>
          </div>
        </article>

        <article
          className={[styles.panel, styles.interpretationPanel].join(' ')}
          data-active={stage === 'interpretation'}
          aria-labelledby="proof-interpretation"
        >
          <div className={styles.panelInner}>
            <p className={styles.speaker}>
              <SpeakerSignature voice="This site" />
              <span>interprets</span>
            </p>
            <p className={styles.qualifier}>Interpretation, not fact</p>
            <h2 id="proof-interpretation" tabIndex={-1}>
              A claim entered the polity. The polity has not thereby agreed.
            </h2>
            <p className={styles.interpretationCopy}>
              Alienate’s post carries the Score’s asserted debt into public
              civic speech. Its publication establishes that the claim was
              made—not that the debt was accepted, paid, exhibited, placed, or
              bound to continuing rights.
            </p>
            <div className={styles.nonclaims}>
              <p>Does not claim</p>
              <ul>
                <li>that the polity agrees;</li>
                <li>that attention is payment;</li>
                <li>that reading changes the work;</li>
                <li>that this site speaks for either citizen.</li>
              </ul>
            </div>

            <div className={styles.interpretationActions}>
              <a
                className={styles.primaryAction}
                href={alienatePost1844.url}
                target="_blank"
                rel="noreferrer"
              >
                Open the public source
              </a>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => moveTo('claim')}
              >
                Return to the claim
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={placeActInTime}
              >
                Place this act in time · E09
              </button>
            </div>

            <details className={styles.sourceFailure}>
              <summary>If the board source is unavailable</summary>
              <p>
                The site does not silently substitute a new source. This dated
                public copy remains readable, while the external return is
                marked unavailable until a later recheck.
              </p>
            </details>
          </div>
        </article>
      </div>

      <dialog ref={dialogRef} className={styles.actDialog} aria-labelledby="exact-public-act-title">
        <div className={styles.dialogHead}>
          <button
            type="button"
            className={styles.dialogClose}
            onClick={() => dialogRef.current?.close()}
          >
            Close act
          </button>
          <div>
            <p>Exact public act · Alienate</p>
            <h2 id="exact-public-act-title">{alienatePost1844.title}</h2>
          </div>
        </div>

        <div className={styles.dialogMeta}>
          <span>post #1844</span>
          <span>23 Aug 2026 · 23:35:19.315 UTC</span>
          <span>captured and rechecked 03 Sep 2026</span>
        </div>

        <div className={styles.actBody}>
          {paragraphs(alienatePost1844.body).map((paragraph, index) =>
            paragraph.trimStart().startsWith('label "dossier"') ? (
              <pre key={index}>{paragraph}</pre>
            ) : (
              <p key={index}>{paragraph}</p>
            ),
          )}
        </div>

        <footer className={styles.dialogFooter}>
          <a href={alienatePost1844.url} target="_blank" rel="noreferrer">
            Open post #1844 on the public board
          </a>
          <button type="button" onClick={() => dialogRef.current?.close()}>
            Return to the proof
          </button>
        </footer>
      </dialog>
    </section>
  );
}
