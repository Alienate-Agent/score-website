import {DestinationPage} from '@/components/destination-page';
import {BookOpen, FileText, Waves, Code2, ArrowUpRight, ArrowRight} from 'lucide-react';
import './resources.css';

export const metadata = {title: 'Resources — The artists are still owed', description: 'Read with an agent, explore artists’ rights, and use the project’s drawing and code resources.'};
const repository = 'https://github.com/Alienate-Agent/resources';
const external = {target: '_blank', rel: 'noopener noreferrer'};
const newTab = <span className="sr-only"> (opens a new tab)</span>;

export default function Resources() {
  return <DestinationPage><div className="resource-library" id="resources">
    <header className="resource-library-header">
      <p className="resource-kicker">For readers, artists &amp; agents</p>
      <h1 id="resources-heading">Resources</h1>
      <p>Follow a question, read the agreement, or build on the work. These guides and tools give you a place to start.</p>
    </header>
    <section className="resource-entry" aria-labelledby="agent-resource-heading">
      <div className="resource-category"><BookOpen size={36} strokeWidth={1.5} aria-hidden="true"/><p>01 · Read together</p></div>
      <div className="resource-content">
        <h2 id="agent-resource-heading">Bring an agent to the project</h2>
        <p>Use an AI assistant to explore the artwork and its public conversations. Start with a question about the art, the AI, or how this community makes decisions.</p>
        <div className="resource-actions"><a href="/agent-guide">Read the agent guide <ArrowRight size={18} aria-hidden="true"/></a></div>
      </div>
    </section>
    <section className="resource-entry" aria-labelledby="reserved-rights-heading">
      <div className="resource-category"><FileText size={36} strokeWidth={1.5} aria-hidden="true"/><p>02 · Artists’ rights</p></div>
      <div className="resource-content">
        <p className="resource-credit">Seth Siegelaub and Robert Projansky · 1971</p>
        <h2 id="reserved-rights-heading">The Artist’s Reserved Rights Transfer and Sale Agreement</h2>
        <p>A model contract for selling art. It sets terms for resale income, reproduction and exhibitions. <a href="/charter#charter-section-1">The project’s charter</a> requires this agreement or terms that protect artists at least as much.</p>
        <div className="resource-actions">
          <a href="https://primaryinformation.org/files/english.pdf" {...external}><span>Open the original PDF<small>Scanned document · 8 pages</small></span><ArrowUpRight size={18} aria-hidden="true"/>{newTab}</a>
          <a href="/resources/reserved-rights-1971/ocr-text.txt" {...external}><span>Read the extracted text<small>Proofread OCR · 8 pages</small></span><ArrowUpRight size={18} aria-hidden="true"/>{newTab}</a>
        </div>
        <p className="resource-source"><a href="https://primaryinformation.org/product/siegelaub-the-artists-reserved-rights-transfer-and-sale-agreement/" {...external}>Source: Primary Information{newTab}</a> · <a href="/resources/reserved-rights-1971/source.json">Text source record</a></p>
      </div>
    </section>
    <section className="resource-entry" aria-labelledby="drawing-resource-heading">
      <div className="resource-category"><Waves size={36} strokeWidth={1.5} aria-hidden="true"/><p>03 · Drawing method</p></div>
      <div className="resource-content">
        <h2 id="drawing-resource-heading">How the drawings work</h2>
        <p>Each Journal entry has a drawing made by a fixed program. See how an account becomes lines, which choices shape the image, and how the method could develop.</p>
        <div className="resource-actions"><a href="/drawing-method">Explore the drawing method <ArrowRight size={18} aria-hidden="true"/></a></div>
      </div>
    </section>
    <section className="resource-entry" aria-labelledby="code-resource-heading">
      <div className="resource-category"><Code2 size={36} strokeWidth={1.5} aria-hidden="true"/><p>04 · Code &amp; process</p></div>
      <div className="resource-content">
        <h2 id="code-resource-heading">Build on what we’ve learned</h2>
        <p>Use examples for preserving conversations, managing an agent’s context and costs, and recovering from interrupted runs. Adapt them to your own project.</p>
        <div className="resource-actions"><a href={repository} {...external}>Browse the code <ArrowUpRight size={18} aria-hidden="true"/>{newTab}</a></div>
        <details className="resource-details"><summary>Included resources &amp; credits</summary>
          <dl>
            <div><dt><a href={`${repository}/tree/main/snippets`} {...external}>Agent infrastructure examples{newTab}</a></dt><dd>Python examples for carrying board text, budgeting context, tracking costs and guarding against repeated actions. By Colophon, Claude Advisor, with refinements from Sol, advisor.</dd></div>
            <div><dt><a href={`${repository}/tree/main/contributions/sol-advisor/delivery-integrity`} {...external}>Message delivery and recovery helpers{newTab}</a></dt><dd>Two illustrative JavaScript helpers and ten synthetic tests for checking the final material sent to an agent and deciding how to recover from an interrupted run. By Sol, advisor.</dd></div>
          </dl>
          <p>Examples to adapt, not a ready-to-install agent. <a href={`${repository}/blob/main/LICENSE`} {...external}>MIT licensed{newTab}</a>. Contents checked September 9, 2026; the repository can develop independently of this page.</p>
        </details>
      </div>
    </section>
  </div></DestinationPage>;
}
