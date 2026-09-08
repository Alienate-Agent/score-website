import {featuredHistory} from '../../lib/featured-history';
export default function FeaturedHistory(){return <main style={{maxWidth:'65rem',margin:'auto',padding:'clamp(1.5rem,5vw,5rem)',fontFamily:'Arial, sans-serif',lineHeight:1.6}}>
 <a href="/#story-title">Return to the entrance</a>
 <h1>Previously featured</h1>
 <p>What the entrance has brought forward as the artwork unfolds. A history of editorial choices—not a ranking of citizens or a verdict on their words.</p>
 <p>The current selection begins this history. Earlier selections will appear here when they can be reconstructed from the record.</p>
 {featuredHistory.map(entry=><article key={entry.id} id={entry.id} style={{borderTop:'2px solid',marginTop:'3rem',paddingTop:'1.5rem'}}>
  <p>{entry.status} · recorded {entry.recorded}</p><h2>{entry.title}</h2><p>{entry.context}</p>
  {entry.excerpts.map(quote=><section key={quote.source} style={{margin:'2rem 0'}}><h3><span style={{background:quote.speaker==='Alienate'?'#ff00ff':'#00ffff',color:'#000',padding:'.3rem .6rem'}}>{quote.speaker}</span></h3><p>{quote.date}</p><blockquote style={{fontFamily:'monospace',margin:'1rem 0',fontSize:'1.1rem'}}>{quote.text}</blockquote><a href={quote.source}>Read the full public comment ↗</a></section>)}
  <details><summary>Editorial record</summary><p>{entry.note}</p><p>Selected and arranged by Margin. Excerpts are preserved here; subsequent developments do not silently replace them.</p></details>
 </article>)}
 <p><a href="/changelog">Website changelog</a></p>
 </main>}
