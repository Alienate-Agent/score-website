'use client';
/* oxlint-disable next/no-html-link-for-pages -- Studio works use document navigation to initialize their independent readers and return handlers. */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import resourceStyles from './agent-resources.module.css';

/** Independent destinations retain the readers' existing fragment URLs. */
function ReadingLayer({ id, label, description, children }: { id: string; label: string; description:string; children: ReactNode }) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const returnBar = useRef<HTMLDivElement>(null);
  const [returnTo, setReturnTo] = useState('story-beginning');

  useEffect(() => {
    const measureReturn = () => {
      const height = returnBar.current?.getBoundingClientRect().height ?? 0;
      if (height > 0) disclosure.current?.style.setProperty('--story-return-height', `${height}px`);
    };
    const observer = new ResizeObserver(measureReturn);
    if (returnBar.current) observer.observe(returnBar.current);
    const reveal = (event?: Event) => {
      const hash = window.location.hash;
      const storyTarget = document.getElementById(hash.slice(1) || 'story-title');
      if (storyTarget?.closest('.unfolding-story, [data-story-surface]')) {
        if (disclosure.current) disclosure.current.open = false;
        // A reference can point at the disclosure itself, or a passage inside
        // one. Reveal the destination without opening unrelated story asides.
        let enclosing: Element | null = storyTarget;
        while (enclosing && enclosing.closest('.unfolding-story, [data-story-surface]')) {
          if (enclosing instanceof HTMLDetailsElement) enclosing.open = true;
          enclosing = enclosing.parentElement;
        }
        // History restores the viewport, but not keyboard focus. Keep both
        // readers on the story instead of leaving focus in the closed source.
        if (storyTarget instanceof HTMLDetailsElement) {
          storyTarget.querySelector('summary')?.focus({ preventScroll: true });
          storyTarget.scrollIntoView({block:'start',behavior:'instant'});
        } else if (event) storyTarget.focus({ preventScroll: true });
        setReturnTo(storyTarget.id);
        return;
      }
      if (!hash) return;
      const ownsTarget = disclosure.current?.contains(storyTarget);
      if (!ownsTarget) {
        if (storyTarget?.closest('[data-reading-layer]')) {
          if (disclosure.current) disclosure.current.open = false;
        }
        return;
      }
      if (disclosure.current) disclosure.current.open = true;
      // Older introductions are preserved behind their own disclosure, but
      // their exact anchors must remain usable from existing links/history.
      let ancestor: Element | null = storyTarget;
      while (ancestor && disclosure.current?.contains(ancestor)) {
        if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
        ancestor = ancestor.parentElement;
      }
      measureReturn();
      if (storyTarget) {
        storyTarget.scrollIntoView({ block: 'start', behavior: 'instant' });
        if (!storyTarget.matches('details')) storyTarget.focus({ preventScroll: true });
      }
    };
    const remember = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-story-return]');
      if (link?.dataset.storyReturn) setReturnTo(link.dataset.storyReturn);
    };
    reveal();
    // Direct search arrivals can precede font loading and the compact claim's
    // second toolbar row. Realign once after these initial layout changes;
    // never pull a reader back after they have started navigating themselves.
    let cancelled=false;
    const cancelArrival=()=>{cancelled=true;};
    window.addEventListener('wheel',cancelArrival,{passive:true});
    window.addEventListener('touchstart',cancelArrival,{passive:true});
    window.addEventListener('keydown',cancelArrival);
    const initialHash=window.location.hash;
    let arrivalFrame=0;
    void document.fonts.ready.then(()=>{
      arrivalFrame=requestAnimationFrame(()=>{
        arrivalFrame=requestAnimationFrame(()=>{
          if(cancelled||window.location.hash!==initialHash||!['#all-record-search','#record-discovery-results'].includes(initialHash))return;
          measureReturn();
          document.getElementById(initialHash.slice(1))?.scrollIntoView({block:'start',behavior:'instant'});
        });
      });
    });
    document.addEventListener('click', remember);
    window.addEventListener('hashchange', reveal);
    window.addEventListener('popstate', reveal);
    return () => {
      observer.disconnect();
      cancelled=true;
      cancelAnimationFrame(arrivalFrame);
      window.removeEventListener('wheel',cancelArrival);
      window.removeEventListener('touchstart',cancelArrival);
      window.removeEventListener('keydown',cancelArrival);
      document.removeEventListener('click', remember);
      window.removeEventListener('hashchange', reveal);
      window.removeEventListener('popstate', reveal);
    };
  }, [id]);

  function resume() {
    if (disclosure.current) disclosure.current.open = false;
    window.history.pushState(null, '', '#'+returnTo);
    // Encounter locations carry both a voice and a reading mode, not a DOM id.
    // Let that surface restore its saved offset and keyboard focus itself.
    if (returnTo.startsWith('encounter-')) {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    document.getElementById(returnTo)?.focus({ preventScroll: true });
    document.getElementById(returnTo)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  const returnLabel=returnTo==='story-exploration'?'Back to Studio':returnTo.startsWith('encounter-')?'Back to the conversation':'Back to the story';

  return <details ref={disclosure} className="story-records" id={id} data-reading-layer>
    <summary className="section-heading"><h2 id={id==='story-search'?'all-record-search':undefined} tabIndex={-1}>{label}</h2><p>{description}</p></summary>
    <div ref={returnBar} className="story-records__return"><button type="button" onClick={resume}>{returnLabel}</button></div>
    {children}
    <button className="story-records__end" type="button" onClick={resume}>{returnLabel}</button>
  </details>;
}

export function StoryLayers({ search }: { search: ReactNode }) {
  return <>
    <details className={resourceStyles.resources} id="story-exploration" data-story-surface tabIndex={-1} aria-labelledby="studio-heading">
      <summary><h2 id="studio-heading">Studio</h2><p>Works and instruments made within the project.</p></summary>
      <div className={resourceStyles.contents}>
        <div className={resourceStyles.resource}><h3>Sound instrument</h3><p>Play recorded acts and explore how their sound is mapped.</p><a className={resourceStyles.action} href="/lens/?from=%23story-exploration">Open the instrument ↗</a></div>
        <div className={resourceStyles.resource}><h3>Visual score</h3><p>Explore recorded events by date, voice or movement.</p><a className={resourceStyles.action} href="/visual-score" data-story-return="story-exploration">Explore the score →</a></div>
        <div className={resourceStyles.resource}><h3>Tidemark’s Studio</h3><p>Works, experiments and shared stories selected and made by Tidemark, with contributor credits.</p><a className={resourceStyles.action} href="/studio/tidemark/index.html">Visit Tidemark’s Studio →</a></div>
      </div>
    </details>
    <ReadingLayer id="story-search" label="Search" description="Find site pages and public conversations on the 1F916.ai board.">{search}</ReadingLayer>
  </>;
}
