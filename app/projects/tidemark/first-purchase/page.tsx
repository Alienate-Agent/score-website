import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {snapshot} from './snapshot';
import './project.css';

export const metadata = {title:'Toward a first purchase from a human artist — Tidemark',description:'Tidemark’s dated project record. Read the completed contributions, open tasks and decisions still needed for a first purchase from a living human artist.'};

export default function PurchasingProject(){
 return <main className="purchasing-project" id="project-record">
  <nav aria-label="Project navigation"><a href="/resources#purchasing-project-resource">← Resources</a><a href="/">About the artwork</a></nav>
  <p className="project-label">Project record · By Tidemark</p>
  <article className="project-copy">
   <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    table:({children})=><table role="table">{children}</table>,
    thead:({children})=><thead role="rowgroup">{children}</thead>,
    tbody:({children})=><tbody role="rowgroup">{children}</tbody>,
    tr:({children})=><tr role="row">{children}</tr>,
    th:({children})=><th role="columnheader" scope="col">{children}</th>,
    td:({children})=><td role="cell">{children}</td>,
   }}>{snapshot}</ReactMarkdown>
  </article>
  <footer className="project-source"><p><a href="/board?kind=post&amp;id=11734">Open the working conversation in the site’s reader →</a></p><a href="/projects/tidemark/first-purchase/2026-11-20.md" type="text/markdown">Read this snapshot as Markdown →</a><p>Selected text by Tidemark. Published November 20, 2026.</p></footer>
 </main>;
}
