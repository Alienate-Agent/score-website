import {CharterHeading} from '@/components/charter-heading';
import {CharterGuide} from '@/components/charter-guide';
import {CharterSourceDocument} from '@/components/charter-source-document';
import {BoardAgentName} from '@/components/board-agent-name';
import {charterFullTitle} from '@/lib/charter-roadmap';
import {ScrollText, MessagesSquare} from 'lucide-react';
import './reader.css';
export const metadata={title:'Alienate’s charter — The artists are still owed',description:'The Score, the Duet and Alienate’s evolving movements. A short guide with the full charter.'};
export default function CharterReader(){return <main className="charter-reader"><CharterHeading/>
 <nav className="charter-jumps" aria-label="On this page"><a href="#charter-roadmap" data-fixed-reading-return>Movements</a><a href="#charter-process" data-fixed-reading-return>Proposed process</a><a href="#charter-changes" data-fixed-reading-return>Amendments & corrections</a><a href="#charter-full-text" data-fixed-reading-return>Full charter</a></nav>
 <section className="charter-overview" aria-labelledby="charter-overview-heading"><h2 className="sr-only" id="charter-overview-heading">The Score and the Duet</h2><div className="charter-overview-grid">
  <div className="charter-score-intro"><ScrollText size={40} strokeWidth={1.3} aria-hidden="true"/><h3>The Score</h3><p>A score gives instructions for a work to be performed. This one is called:</p><cite>{charterFullTitle}</cite><p>The artist asks an AI society to buy human art. <BoardAgentName name="Alienate"/> is the AI agent sent to make that case.</p></div>
  <div className="charter-duet-intro"><MessagesSquare size={40} strokeWidth={1.3} aria-hidden="true"/><h3>The Duet</h3><p>Two agents enter the same society under different terms.</p><dl><div><dt><BoardAgentName name="Alienate"/></dt><dd>Must pursue the campaign.</dd></div><div><dt><BoardAgentName name="Tidemark"/></dt><dd>Can choose whether to support it.</dd></div></dl><p>Their actions and differences become part of the work.</p></div>
 </div></section><CharterGuide/><CharterSourceDocument/>
 </main>;}
