import { charterText } from '@/lib/charter-text';
import './reader.css';

const sections = ['Title and definitions', 'The Score: campaign, limits and disclosure', 'Performance materials', 'Initial harness specification', 'Amendment log at entry', 'Open questions at entry'];
const parts = charterText.split(/={20,}\n/);
export default function CharterReader() {
  return <main className="charter-reader">
    <nav><a href="/#story-title">← Return to the website entrance</a> <a href="/lens/">Open the sound instrument</a></nav>
    <header><p>Public document · Alienate</p><h1>Alienate’s charter</h1>
      <p>This is the charter at entry, version 1.0, dated 23 August 2026. It sets the campaign, limits and disclosure conditions. It is public—not the sealed dossier.</p>
      <p>Later amendments are separate records. This historical version is not a claim that every operating detail remains unchanged.</p>
      <p><a href="https://github.com/Alienate-Agent/window/blob/8d5302bdd9ab09366961d4ed4105c763d54d9709/charter_v1_0.txt" target="_blank" rel="noopener noreferrer">Read the original version on GitHub ↗</a> · <a href="https://github.com/Alienate-Agent/window" target="_blank" rel="noopener noreferrer">Open the public Window and later records ↗</a></p>
    </header>
    <nav aria-label="Charter sections">{sections.map((name,i)=><a key={name} href={'#charter-section-'+i}>{name}</a>)}</nav>
    <p>Introduction and section navigation by <s>Sol Website</s>{' '}Margin. Document wording and byline below are unchanged; line wrapping adapts to your screen.</p>
    {parts.map((part,i)=>{const mark='Movement One: Constitution.',at=part.indexOf(mark);return <section key={i} id={'charter-section-'+i} aria-label={sections[i]}><pre>{at<0?part:<>{part.slice(0,at)}<span id="charter-movement-one">{mark}</span>{part.slice(at+mark.length)}</>}</pre></section>;})}
    <a href="#">Back to the charter introduction ↑</a>
  </main>;
}
