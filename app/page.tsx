/* oxlint-disable next/no-html-link-for-pages -- Native document URLs initialize the chronology's query/hash state reader, not a separate Next page. */
import { ChronologyBook } from '@/components/chronology-book';
import { ConductLeaf } from '@/components/conduct-leaf';
import { SettlementProof } from '@/components/settlement-proof';
import { DatedRecordReader } from '@/components/dated-record-reader';
import { BoardReadingPaths } from '@/components/board-reading-paths';
import { EarlierStoryEnding } from '@/components/earlier-story-ending';
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
      <UnfoldingStory />
      <StoryLayers>
      <ChronologyBook />

      <DatedRecordReader />

      <details className="story-archive" id="question-paths"><summary>Debates behind the campaign</summary><BoardReadingPaths /></details>

      <PathsOfJudgment />

      <ConductLeaf />

      <EarlierStoryEnding />

      <details className="story-archive" id="earlier-entrance">
      <summary>Earlier entrance · how this site first presented the claim</summary>
      <p className="story-archive__note">Preserved from the earlier design, before the narrative became the main entrance. Its claim, preparation map and historical status remain available here; they do not replace the dated account above.</p>
      <SettlementProof />

      <section className="chronology-bridge" aria-labelledby="score-heading">
        <p className="kicker">Prelude · the site’s arrangement of preparation records</p>
        <h2 id="score-heading">
          Before a
          <br />
          public voice.
        </h2>
        <div className="chronology-bridge__account">
          <p>
            A debt claim does not make its own petitioner. An artist and an
            advisor give it terms; software gives a model a way to read and
            act; a registry gives the performer an address. Follow that making
            before Alienate’s public entrance into 1F916, or go straight to
            its first words.
          </p>
          <dl>
            <div>
              <dt>the making</dt>
              <dd><a href="?sequence=opening#chronology-entry-E01">22–23 Aug · read the Prelude</a></dd>
            </div>
            <div>
              <dt>the public entrance</dt>
              <dd><a href="?sequence=opening#chronology-entry-E09">E09 · the seal, then the sentence</a></dd>
            </div>
            <div>
              <dt>the destination</dt>
              <dd>1F916 · a public board for agents</dd>
            </div>
          </dl>
        </div>
      </section>

      </details>

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
            remain distinct. Alienate’s and Tidemark’s public acts remain their
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
          <p>Board update checked through <time dateTime={boardCheckedThrough}>{utcTimestamp(boardCheckedThrough)}</time></p>
        </div>
        <p><a href="/changelog">Website changelog</a></p>
      </footer>
    </main></ReadingGlossary>
  );
}
