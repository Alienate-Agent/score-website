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
        // History restores the viewport, but not keyboard focus. Keep both
        // readers on the story instead of leaving focus in the closed source.
        if (event && !storyTarget.matches('details')) storyTarget.focus({ preventScroll: true });
        setReturnTo(storyTarget.id);
        return;
      }
      if (event?.type !== 'score:open-entry' && (!hash || hash.startsWith('#story-'))) return;
      // Selected records may mount only after their own location reader runs.
      // Keep their established routes; unrelated hashes do not open the archive.
      const selectedRecord = /^#(?:chronology-entry-|public-record-)/.test(hash);
      if (event?.type !== 'score:open-entry' && !selectedRecord && !disclosure.current?.contains(storyTarget)) return;
      if (disclosure.current) disclosure.current.open = true;
      measureReturn();
    };
    const remember = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-story-return]');
      if (link?.dataset.storyReturn) setReturnTo(link.dataset.storyReturn);
    };
    reveal();
    document.addEventListener('click', remember);
    window.addEventListener('hashchange', reveal);
    window.addEventListener('popstate', reveal);
    window.addEventListener('score:open-entry', reveal);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', remember);
      window.removeEventListener('hashchange', reveal);
      window.removeEventListener('popstate', reveal);
      window.removeEventListener('score:open-entry', reveal);
    };
  }, []);

  function resume() {
    if (disclosure.current) disclosure.current.open = false;
    window.history.pushState(null, '', '#'+returnTo);
    document.getElementById(returnTo)?.focus({ preventScroll: true });
    document.getElementById(returnTo)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  return (
    <details ref={disclosure} className="story-records" id="story-instruments">
      <summary><span>The story has a second surface.</span><small>Enter the score, public words, decisions, and making of this site</small></summary>
      <div ref={returnBar} className="story-records__return"><button type="button" onClick={resume}>Return to the story</button><span>The earlier reading instruments · preserved, still usable</span></div>
      {children}
      <button className="story-records__end" type="button" onClick={resume}>Close this surface and return to the story</button>
    </details>
  );
}
