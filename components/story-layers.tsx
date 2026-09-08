'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** The original reading instruments stay mounted, with their URLs intact. */
export function StoryLayers({ children }: { children: ReactNode }) {
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
      if (event?.type !== 'score:open-entry' && storyTarget?.closest('.unfolding-story, [data-story-surface]')) {
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
      if (event?.type !== 'score:open-entry' && (!hash || hash.startsWith('#story-'))) return;
      // Selected records may mount only after their own location reader runs.
      // Keep their established routes; unrelated hashes do not open the archive.
      const selectedRecord = /^#(?:chronology-entry-|public-record-)/.test(hash);
      // A direct source URL, or a link followed before hydration, has no
      // captured click origin. Offer its first explicit narrative context
      // rather than pretending that the reader started at the Prelude.
      if (!event && selectedRecord) {
        const citation = [...document.querySelectorAll<HTMLAnchorElement>('a[data-story-return]')]
          .find(link => link.hash === hash);
        if (citation?.dataset.storyReturn) setReturnTo(citation.dataset.storyReturn);
      }
      if (event?.type !== 'score:open-entry' && !selectedRecord && !disclosure.current?.contains(storyTarget)) return;
      if (disclosure.current) disclosure.current.open = true;
      // Older introductions are preserved behind their own disclosure, but
      // their exact anchors must remain usable from existing links/history.
      let ancestor: Element | null = storyTarget;
      while (ancestor && disclosure.current?.contains(ancestor)) {
        if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
        ancestor = ancestor.parentElement;
      }
      measureReturn();
      if (storyTarget && !selectedRecord && event?.type !== 'score:open-entry') {
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
    window.addEventListener('score:open-entry', reveal);
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
      window.removeEventListener('score:open-entry', reveal);
    };
  }, []);

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

  const returnLabel=returnTo.startsWith('encounter-')?'Return to the encounter':'Return to the story';

  return (
    <details ref={disclosure} className="story-records" id="story-instruments">
      <summary><span>Now read the score.</span><small>Open the public words and the visual timeline. Follow an event into its source; where sound is available, carry that same act into the instrument.</small></summary>
      <div ref={returnBar} className="story-records__return"><button type="button" onClick={resume}>{returnLabel}</button><span>Public records and reading instruments</span></div>
      {children}
      <button className="story-records__end" type="button" onClick={resume}>Close this surface · {returnLabel}</button>
    </details>
  );
}
