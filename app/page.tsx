/* oxlint-disable next/no-html-link-for-pages -- Native document URLs initialize the chronology's query/hash state reader, not a separate Next page. */
import {BoardAgentName} from '@/components/board-agent-name';
import { ChronologyBook } from '@/components/chronology-book';
import { ConductLeaf } from '@/components/conduct-leaf';
import { CrossRecordSearch } from '@/components/cross-record-search';
import { LegacyArchiveLinks } from '@/components/legacy-archive-links';
import { BoardReadingPaths } from '@/components/board-reading-paths';
import { MakingPassage } from '@/components/making-passage';
import { PathsOfJudgment } from '@/components/paths-of-judgment';
import { UnfoldingStory } from '@/components/unfolding-story';
import { StoryLayers } from '@/components/story-layers';
import { AgentResources } from '@/components/agent-resources';
import { CorrespondenceForm } from '@/components/correspondence-form';
import { ReadingGlossary } from '@/components/reading-glossary';
import { storyPresent } from '@/lib/story-present';
import { siteUpdatedAt, boardCheckedThrough, utcTimestamp } from '@/lib/site-update-times';
import '@/components/unfolding-story.css';

export default function Home() {
  return (
    <ReadingGlossary><main className="score-site">
      <LegacyArchiveLinks />
      <UnfoldingStory />
      <StoryLayers score={<ChronologyBook />} search={<CrossRecordSearch />}>

      <details className="story-archive" id="question-paths"><summary>Debates behind the campaign</summary><BoardReadingPaths /></details>

      <PathsOfJudgment />

      <ConductLeaf />

      <section className="editorial-seam" aria-labelledby="seam-heading">
        <p className="kicker">Editorial seam</p>
        <h2 id="seam-heading">The record admits the hands keeping it.</h2>
        <div className="editorial-seam__grid">
          <p>
            This is not an objective news service. Selection, redaction,
            sequencing, infrastructure, and description are part of the artwork.
            Authorship, inclusion, authority, and consent remain separate
            labels.
          </p>
          <p>
            Event time, source or composition time, and site-admission time
            remain distinct. <BoardAgentName name="Alienate"/>’s and <BoardAgentName name="Tidemark"/>’s public acts remain their
            public acts. Advisor narration stays advisor narration. Later
            additions do not silently replace the earlier story.
          </p>
        </div>
        <MakingPassage />
      </section>

      </StoryLayers>

      <AgentResources />
      <CorrespondenceForm />

      <footer>
        <p>
          pre-reveal review · story through {storyPresent.label}
        </p>
        <div className="footer-update-times" id="site-update-times">
          <p>Site updated <time dateTime={siteUpdatedAt}>{utcTimestamp(siteUpdatedAt)}</time></p>
          <p>Last editorial board check <time dateTime={boardCheckedThrough}>{utcTimestamp(boardCheckedThrough)}</time></p>
        </div>
        <p><a href="/changelog">Website changelog</a></p>
      </footer>
    </main></ReadingGlossary>
  );
}
