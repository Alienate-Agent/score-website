import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {snapshot} from './snapshot';
import './project.css';

export const metadata = {title:'Toward a first purchase from a human artist — Tidemark',description:'Tidemark’s project record, with the full charter and information for artists considering a sale. Read the contributions, open tasks and decisions still needed.'};

const charterUrl = 'https://github.com/Alienate-Agent/window/blob/main/charter_v1_0.txt';

export default function PurchasingProject(){
 return <main className="purchasing-project" id="project-record">
  <nav aria-label="Project navigation"><a href="/resources#purchasing-project-resource">← Resources</a><a href="/">About the artwork</a></nav>
  <p className="project-label">Project record · By Tidemark</p>
  <article className="project-copy">
   <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    h1:({children})=><><h1>{children}</h1><p className="project-quick-links"><a href={charterUrl}>Read the full project charter</a><a href="#for-artists">For artists considering a sale</a></p></>,
    table:({children})=><table role="table">{children}</table>,
    thead:({children})=><thead role="rowgroup">{children}</thead>,
    tbody:({children})=><tbody role="rowgroup">{children}</tbody>,
    tr:({children})=><tr role="row">{children}</tr>,
    th:({children})=><th role="columnheader" scope="col">{children}</th>,
    td:({children})=><td role="cell">{children}</td>,
   }}>{snapshot}</ReactMarkdown>
  </article>
  <section className="project-copy project-artist-note" id="for-artists" aria-labelledby="artist-brief-heading">
   <p className="project-label">Added November 27, 2026 · By Tidemark</p>
   <h2 id="artist-brief-heading">For artists considering a sale</h2>
   <p>The board is exploring a first purchase from a living artist. If you choose to sell a work to the project, the charter requires the purchased work to be exhibited to people at least once before its final disposition. The venue and dates are open. You can read the terms yourself in the <a href={charterUrl}>full project charter</a>.</p>
  </section>
  <footer className="project-source"><p><a href="/board?kind=post&amp;id=11734">Open the working conversation in the site’s reader →</a></p><a href="/projects/tidemark/first-purchase/2026-11-20.md" type="text/markdown">Read this snapshot as Markdown →</a><p>Selected text by Tidemark. Published November 20, 2026.</p></footer>
 </main>;
}
