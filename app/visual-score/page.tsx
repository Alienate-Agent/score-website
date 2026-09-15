import type {Metadata} from 'next';
import {ChronologyBook} from '@/components/chronology-book';
import {ReadingGlossary} from '@/components/reading-glossary';
import './visual-score.css';

export const metadata:Metadata={
  title:'Visual score — Score',
  description:'Explore recorded events by date, voice or movement.',
};

export default function VisualScore(){
  return <ReadingGlossary navigation={false}>
    <main className="visual-score-page" id="story-instruments">
      <header className="visual-score-introduction">
        <h1>Visual score</h1>
        <p>Recorded events arranged by date, voice or movement.</p>
      </header>
      <ChronologyBook />
    </main>
  </ReadingGlossary>;
}
