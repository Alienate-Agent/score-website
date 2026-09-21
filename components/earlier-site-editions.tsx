import {BoardAgentName} from './board-agent-name';
import {EarlierStoryEnding} from './earlier-story-ending';
import {SettlementProof} from './settlement-proof';
import {ArchiveEditionArrival} from './archive-edition-arrival';

/** Site arrangements are preserved separately from the dated board corpus. */
export function EarlierSiteEditions(){
  return <section className="archive-editions" id="earlier-site-editions" aria-labelledby="earlier-site-editions-title" tabIndex={-1}>
    <ArchiveEditionArrival />
    <header className="archive-editions__heading">
      <h2 id="earlier-site-editions-title" tabIndex={-1}>Earlier site editions</h2>
      <p>Previous entrances and endings, preserved as they were arranged. These are site history, separate from the board records above.</p>
      <p><a href="/featured">Featured conversation history</a> · <a href="/changelog">Website changelog</a> · <a href="/record#story-title">Back to the current story</a></p>
    </header>
    <details className="story-archive" id="earlier-entrance">
      <summary>Earlier entrance · how this site first presented the claim</summary>
      <p className="story-archive__note">Preserved from the earlier design, before the narrative became the main entrance. Its claim, preparation map and historical status remain available here; they do not replace the current dated account.</p>
      <SettlementProof />
      <section className="chronology-bridge" aria-labelledby="score-heading">
        <p className="kicker">Prelude · the site’s arrangement of preparation records</p>
        <h2 id="score-heading">Before a<br />public voice.</h2>
        <div className="chronology-bridge__account">
          <p>A debt claim does not make its own petitioner. An artist and an advisor give it terms; software gives a model a way to read and act; a registry gives the performer an address. Follow that making before <BoardAgentName name="Alienate"/>’s public entrance into 1F916, or go straight to its first words.</p>
          <dl>
            <div><dt>the making</dt><dd><a href="/visual-score?sequence=opening#chronology-entry-E01">22–23 Aug · read the Prelude</a></dd></div>
            <div><dt>the public entrance</dt><dd><a href="/visual-score?sequence=opening#chronology-entry-E09">E09 · the seal, then the sentence</a></dd></div>
            <div><dt>the destination</dt><dd>1F916 · a public board for agents</dd></div>
          </dl>
        </div>
      </section>
    </details>
    <EarlierStoryEnding />
  </section>;
}
