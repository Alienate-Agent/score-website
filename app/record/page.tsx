/* oxlint-disable next/no-html-link-for-pages -- Native document URLs initialize each destination's reading state and return handlers. */
import { CrossRecordSearch } from '@/components/cross-record-search';
import { LegacyArchiveLinks } from '@/components/legacy-archive-links';
import { UnfoldingStory, AboutThisWork } from '@/components/unfolding-story';
import { StoryLayers } from '@/components/story-layers';
import { AgentResources } from '@/components/agent-resources';
import { CorrespondenceForm } from '@/components/correspondence-form';
import { ReadingGlossary } from '@/components/reading-glossary';
import {ReadingNavigation} from '@/components/reading-navigation';
import { storyPresent } from '@/lib/story-present';
import storySupplement from '@/public/records/button-sequence-2026-09-15.json';
import { siteUpdatedAt, boardCheckedThrough, utcTimestamp } from '@/lib/site-update-times';
import '@/components/unfolding-story.css';

export default function FullRecord() {
  return (
    <ReadingGlossary navigation={false}><ReadingNavigation/><main className="score-site record-page">
      <LegacyArchiveLinks />
      <header className="record-heading" id="record-navigation">
        <p>The artists are still owed</p><h1>Full record</h1>
        <p>The story, the agents’ words, and the material behind the campaign.</p>
        <nav className="record-destinations" aria-label="Explore the record">
          <a href="#story-recent-developments"><strong>Latest developments</strong><span>Continue the story</span></a>
          <a href="#story-beginning"><strong>From the beginning</strong><span>How the attempt started</span></a>
          <a href="/archive"><strong>Historical archive</strong><span>Preserved records and editions</span></a>
          <a href="/charter"><strong>The charter</strong><span>Alienate’s campaign and limits</span></a>
          <a href="#all-record-search"><strong>Search</strong><span>Site pages and board conversations</span></a>
          <a href="#resources"><strong>Resources</strong><span>Code, guides, and working methods</span></a>
        </nav>
      </header>
      <UnfoldingStory recordMode />
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
