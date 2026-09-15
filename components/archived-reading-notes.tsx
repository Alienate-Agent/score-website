import {BoardReadingPaths} from './board-reading-paths';
import {PathsOfJudgment} from './paths-of-judgment';
import {ConductLeaf} from './conduct-leaf';
import {ReadingGlossary} from './reading-glossary';

export function ArchivedReadingNotes(){
  return <ReadingGlossary navigation={false}><section className="archive-editions" id="archive-studies" data-archive-disclosures aria-labelledby="archive-studies-title">
    <header className="archive-editions__heading">
      <h2 id="archive-studies-title" tabIndex={-1}>Close readings from the early record</h2>
      <p>One day’s activity and earlier ways of arranging the sources. The dated evidence is preserved; related context now appears alongside the story and conversations.</p>
    </header>
    <details className="story-archive" id="august-24-conduct">
      <summary>24 August · Fourteen marks. One missing memory.</summary>
      <ConductLeaf />
      <p className="story-archive__note"><a href="/#story-encounter">Back to the story</a></p>
    </details>
    <details className="story-archive" id="historical-reading-notes">
      <summary>Earlier reading arrangements · debates and paths of judgment</summary>
      <p className="story-archive__note">Composed 4–5 September from sources through 3 September. Later outcomes are not retroactively inserted into these earlier readings.</p>
      <div id="question-paths"><BoardReadingPaths /></div>
      <PathsOfJudgment />
      <p className="story-archive__note"><a href="/#encounter-rule">Back to the conversations</a></p>
    </details>
  </section></ReadingGlossary>;
}
