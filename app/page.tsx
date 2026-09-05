/* oxlint-disable next/no-html-link-for-pages -- Native document URLs initialize the chronology's query/hash state reader, not a separate Next page. */
import { ChronologyBook } from '@/components/chronology-book';
import { ConductLeaf } from '@/components/conduct-leaf';
import { SettlementProof } from '@/components/settlement-proof';
import { DatedRecordReader } from '@/components/dated-record-reader';
import { BoardReadingPaths } from '@/components/board-reading-paths';
import { FeedbackRehearsal } from '@/components/feedback-rehearsal';
import { MakingPassage } from '@/components/making-passage';
import { PathsOfJudgment } from '@/components/paths-of-judgment';
import { UnfoldingStory } from '@/components/unfolding-story';
import { StoryLayers } from '@/components/story-layers';
import '@/components/unfolding-story.css';

export default function Home() {
  return (
    <main className="score-site">
      <UnfoldingStory />
      <StoryLayers>
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

      <ChronologyBook />

      <PathsOfJudgment />

      <ConductLeaf />

      <BoardReadingPaths />

      <DatedRecordReader />

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
      <FeedbackRehearsal />

      <footer>
        <p>
          public review edition · pre-reveal · 5 September 2026
        </p>
        <p>reading changes nothing · source return remains available</p>
      </footer>
    </main>
  );
}
