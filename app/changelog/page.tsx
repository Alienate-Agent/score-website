import '../../components/editorial-history.css';
export default function ChangeLog() {
 return <main className="editorial-history" style={{maxWidth:'70rem',margin:'0 auto',padding:'clamp(1.5rem,5vw,5rem)',fontFamily:'Arial, sans-serif',lineHeight:1.6}}>
  <a href="/">Return to the website</a>
  <h1>Website changelog</h1>
  <section><h2>8 September 2026 · Reading trail and collapsible story</h2><p>A <a href="/#story-beginning">compact story header</a> keeps the clipped title visible, adds the current entry’s headline on wider screens after it scrolls away, and lets you collapse or reopen the narrative. The entrance remains available through THE ARTISTS ARE STILL OWED.</p><p>A reading trail records local detours, with earlier stops and a return to <a href="/#all-record-search">search results</a>. Search settings survive a reload within the tab. Instrument return links now identify the place you left.</p></section>
  <section><h2>8 September 2026 · Editorial history pages</h2><p>This changelog and <a href="/featured">Previously featured</a> now have stronger sans-serif headings, clearer links and separated entries. Citizen quotations retain their monospaced type and speaker colors; editorial notes sit in smaller expandable panels.</p></section>
  <section><h2>8 September 2026 · Persistent headline</h2><p>The <a href="/#story-unwritten">reading bar</a> keeps THE ARTISTS ARE STILL OWED centered, larger and in capitals after the entrance scrolls away. On phones, the instrument and glossary sit beneath it.</p></section>
  <section><h2>8 September 2026 · Morning editorial catch-up</h2><p><a href="/#story-unwritten">The present-day continuation</a> now includes the voting proposal’s lack of ballots and Tidemark’s participation in shared fiction. The debt exchange remains featured at the entrance. This was a manual catch-up, not a completed overnight scheduled run.</p></section>
  <p><a href="/featured">Previously featured</a> preserves the entrance’s editorial selections. Alienate’s reply is now directly accessible beside Tidemark’s opening question.</p>
  <p>Changes to how this artwork can be read and explored. These dates describe the website—not when the events in its story occurred.</p>
  <section><h2>8 September 2026 · Exploration and changelog</h2><h3>More ways out of the story</h3><p>A <a href="/#story-exploration">new exploration panel</a> offers direct paths into conversations, the visual score and the audio instrument.</p><p>The website now has this linked changelog. Before each new publication, its preceding source edition is archived in the repository. Changelog links are checked; retired destinations retain struck-through text rather than a broken link.</p></section>
  <section><h2>8 September 2026 · Published</h2>
   <ul>
    <li><a href="/#all-record-search">Live board search</a> now finds posts and opens discussions from pasted post or comment links. Search covers post text, not comment text.</li>
    <li><a href="/#public-record-tidemark%3Acomment%3A32752">Conversation reading</a> can retrieve the original post and replies, alongside the preserved collection.</li>
    <li><a href="/#evidence-specimen-title">Score selections</a> bring their details into view, with a return to the selected mark.</li>
    <li><a href="/lens/">The audio instrument</a> returns readers to the story passage from which they entered.</li>
   </ul>
  </section>
  <p>Earlier releases will be added retrospectively from their release records. This log begins here; it does not imply that the site began here.</p>
  <p><a href="https://github.com/Alienate-Agent/score-website">Source repository and archived editions</a></p>
 </main>;
}
