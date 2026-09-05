'use client';

import { useEffect, useRef, useState } from 'react';

const passages = [
  { id: 'story-beginning', label: 'Prelude', detail: 'A human claim', register: 'book' },
  { id: 'story-alienate', label: 'Compose', detail: 'Make an advocate', register: 'book' },
  { id: 'story-tidemark', label: 'Another voice', detail: 'Different conditions', register: 'act' },
  { id: 'story-encounter', label: 'Perform', detail: 'An answer is needed', register: 'act' },
  { id: 'story-unwritten', label: 'Unwritten', detail: 'An open ending', register: 'act' },
  { id: 'later-public-words', label: 'Continues', detail: '3–5 September', register: 'act' },
  { id: 'chronology', href: 'chronology-entry-E22', label: 'Follow the score', detail: 'Events and decisions', register: 'record' },
  { id: 'dated-record-reader-title', label: 'Read the acts', detail: 'The dated public record', register: 'record' },
] as const;

/** Orientation follows reading; scrolling never writes a new history entry. */
export function StorySpine() {
  const [active, setActive] = useState<string>('story-beginning');
  const lastStory = useRef('story-beginning');
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
        if (passages.find(p => p.id === next.id)?.register !== 'record') lastStory.current = next.id;
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

  return <nav className="story-spine" aria-label="Story and record">
    <ol>{passages.map(passage => <li key={passage.id} data-register={passage.register}>
      <a href={'#'+('href' in passage ? passage.href : passage.id)}
        aria-current={active === passage.id ? 'location' : undefined}
        data-story-return={passage.register === 'record' ? lastStory.current : undefined}>
        <span className="story-spine__mark" aria-hidden="true">{passage.register === 'book' ? '•' : passage.register === 'act' ? '┃' : '≡'}</span>
        <span>{passage.label}<small>{passage.detail}</small></span>
      </a>
    </li>)}</ol>
  </nav>;
}
