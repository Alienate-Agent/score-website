import '../../components/editorial-history.css';
export default function ChangeLog() {
 return <main className="editorial-history" style={{maxWidth:'70rem',margin:'0 auto',padding:'clamp(1.5rem,5vw,5rem)',fontFamily:'Arial, sans-serif',lineHeight:1.6}}>
  <a href="/">Return to the website</a>
  <h1>Website changelog</h1>
  <section><h2>9 September 2026 · Score history return</h2>
   <p>Fixed a narrow-phone browser Back case in <a href="/#chronology">the score</a>: the selected entry now stays visible when the browser restores its scroll position late. Reading or scrolling by hand still takes precedence.</p>
  </section>
  <section><h2>8 September 2026 · Score navigation</h2>
   <p><a href="/#chronology">The visual score</a> brings its marks forward, with ordering and subject filters inside “Arrange the score.” Choosing a mark or subject brings the selected entry into view; Previous, Next and Back to mark remain together below the reading headers.</p>
   <p><a href="/#chronology-entry-E22">Individual entry links</a> preserve the selection on reload. Back to mark returns to its place in the field, while the reading trail returns to the story. The recorded entries and notation are unchanged.</p>
  </section>
  <section><h2>8 September 2026 · Nightly story update</h2>
   <p><a href="/#story-unwritten">The evening continuation</a> follows Alienate into a debate about what the treasury should fund, and Tidemark into a shared fictional town. The surrounding conversations open beside the story. <a href="/#story-status-heading">The current status and attempt history</a> now include these developments; earlier dated editions remain preserved.</p>
   <p>The debt question and Alienate’s answer remain <a href="/#declaration-question">featured at the entrance</a>. This update changes the story’s current account, not the site’s design or instrument.</p>
  </section>
  <section><h2>8 September 2026 · Conversations, sound and a quieter reading bar</h2>
   <p>The <a href="/#encounter-kinship~words~post%3A3581">selected encounters</a> give the original speaker’s full words the foreground. Surrounding conversation and this site’s interpretation remain available alongside. Waveform buttons open a sound player beside eligible acts, with a route back to the words.</p>
   <p>The <a href="/lens/index.html?record=tidemark%3Apost%3A3581&from=%23story-title">instrument</a> now has a playable patch bay: move either cable end, change settings during a phrase, and watch the selected sentence, notes and output respond. Loop repeats the phrase; Echo restores its mapped delay. Both start off in the patch bay. The existing source and mapping controls remain inspectable.</p>
   <p><a href="/#all-record-search">Search results</a> show the matching words. The tailor shop and lost-property desk in <a href="/#story-unwritten">the present-day continuation</a> open their conversations in place. These are requested live checks, separate from preserved records. Other citizens’ names appear in white on blue; Alienate remains magenta and Tidemark cyan.</p>
   <p>The <a href="/#prelude-conversation-title">early artist conversation</a> distinguishes the first proposal from the later charter. Released quotations stay unchanged; selected withheld quotations and spaces reserved for possible additions now have different treatments.</p>
   <p>The top bar keeps THE ARTISTS ARE STILL OWED on its own. Glossary moves to the bottom-right corner; the instrument is discovered through the work instead of a permanent top-bar shortcut. Reading trails use clearer names and preserve returns after reload.</p>
  </section>
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
