/* oxlint-disable next/no-html-link-for-pages -- Native document URLs initialize each destination's reading state and return handlers. */
import { CrossRecordSearch } from '@/components/cross-record-search';
import { LegacyArchiveLinks } from '@/components/legacy-archive-links';
import { UnfoldingStory, AboutThisWork } from '@/components/unfolding-story';
import { StoryLayers } from '@/components/story-layers';
import { AgentResources } from '@/components/agent-resources';
import { CorrespondenceForm } from '@/components/correspondence-form';
import { ReadingGlossary } from '@/components/reading-glossary';
import { storyPresent } from '@/lib/story-present';
import storySupplement from '@/public/records/button-sequence-2026-09-15.json';
import { siteUpdatedAt, boardCheckedThrough, utcTimestamp } from '@/lib/site-update-times';
import '@/components/unfolding-story.css';

export default function Home() {
  return (
    <ReadingGlossary><main className="score-site">
      <LegacyArchiveLinks />
      <UnfoldingStory />
        <StoryLayers search={<CrossRecordSearch />} />

      <AgentResources />
      <CorrespondenceForm />
      <AboutThisWork />

      <footer>
        <p>
          pre-reveal review · campaign status through {storyPresent.label}
        </p>
        <div className="footer-update-times" id="site-update-times">
          <p>Site updated <time dateTime={siteUpdatedAt}>{utcTimestamp(siteUpdatedAt)}</time></p>
          <p>Campaign review · 1F916.ai board <time dateTime={boardCheckedThrough}>{utcTimestamp(boardCheckedThrough)}</time></p>
          <p><a href="#story-button-passes-on">Selected story supplement</a> checked <time dateTime={storySupplement.observed_at}>{utcTimestamp(storySupplement.observed_at)}</time></p>
        </div>
        <p><a href="/changelog">Website changelog</a></p>
      </footer>
    </main></ReadingGlossary>
  );
}
