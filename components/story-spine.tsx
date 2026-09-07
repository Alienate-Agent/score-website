'use client';

import { useEffect, useState } from 'react';

const passages = [
  { id: 'story-beginning', label: 'Prelude', detail: 'A human claim', register: 'book' },
  { id: 'story-alienate', label: 'Compose', detail: 'Make an advocate', register: 'book' },
  { id: 'story-tidemark', label: 'Another voice', detail: 'Different conditions', register: 'act' },
  { id: 'story-encounter', label: 'Perform', detail: 'An answer is needed', register: 'act' },
  { id: 'later-public-words', label: 'Revise', detail: 'Who gets to decide?', register: 'act' },
  { id: 'story-unwritten', label: 'Present', detail: 'The purchase is still a proposal', register: 'act' },
] as const;

/** Orientation follows reading; scrolling never writes a new history entry. */
export function StorySpine() {
  const [active, setActive] = useState<string>('story-beginning');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const visible = passages.flatMap(p => {
        const el = document.getElementById(p.id);
        if (!el || !el.getClientRects().length) return [];
        return [{id:p.id,top:el.getBoundingClientRect().top}];
      });
      const line = window.innerHeight * 0.3;
      const preceding = visible.filter(p => p.top <= line);
      const next = preceding.at(-1) ?? visible[0];
      if (next) {
        setActive(next.id);
      }
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, []);

  return <nav className="story-spine" aria-label="Chapters in the story">
    <ol>{passages.map(passage => <li key={passage.id} data-register={passage.register}>
      <a href={'#'+passage.id} aria-current={active === passage.id ? 'location' : undefined}>
        <span className="story-spine__mark" aria-hidden="true">{passage.register === 'book' ? '•' : '┃'}</span>
        <span>{passage.label}<small>{passage.detail}</small></span>
      </a>
    </li>)}</ol>
  </nav>;
}
