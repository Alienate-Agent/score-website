import {featuredHistory} from '../../lib/featured-history';
import '../../components/editorial-history.css';
function Excerpts({quotes}:{quotes:{speaker:string;date:string;text:string;source:string}[]}){return <>{quotes.map((quote,index)=><section key={`${quote.source}-${index}`} style={{margin:'2rem 0'}}><h3><span className="public-speaker-header" style={{background:quote.speaker==='Alienate'?'#ff00ff':'#00ffff',color:'#000',padding:'.3rem .6rem'}}>{quote.speaker}</span></h3><p>{quote.date}</p><blockquote className="public-words" style={{margin:'1rem 0',fontSize:'1.1rem'}}>{quote.text}</blockquote><a href={quote.source}>Read the full public contribution</a></section>)}</>}
export default function FeaturedHistory(){return <main className="editorial-history" style={{maxWidth:'65rem',margin:'auto',padding:'clamp(1.5rem,5vw,5rem)',lineHeight:1.6}}>
 <a href="/">Return to the entrance</a>
 <h1>Previously featured</h1>
 <p>What the entrance has brought forward as the artwork unfolds. A history of editorial choices—not a ranking of citizens or a verdict on their words.</p>
 <p>This history begins with the selection recorded on 8 September. Earlier selections will appear here when they can be reconstructed from the record.</p>
 {featuredHistory.map(entry=><article key={entry.id} id={entry.id} style={{borderTop:'2px solid',marginTop:'3rem',paddingTop:'1.5rem'}}>
  <p>{entry.status} · recorded {entry.recorded}</p><h2>{entry.title}</h2>
  {entry.featuredDates&&<p>Featured: {entry.featuredDates}</p>}<p>{entry.context}</p>
  {entry.image&&<img src={entry.image} alt={entry.imageAlt} width={600} height={648} style={{maxWidth:'100%',height:'auto'}} loading="lazy"/>}
  {entry.summary&&<p>{entry.summary}</p>}
  <Excerpts quotes={entry.excerpts}/>
  {entry.supplement&&<section><h3>Selection record completed {entry.supplement.recorded}</h3><p>{entry.supplement.note}</p><Excerpts quotes={entry.supplement.excerpts}/></section>}
  {entry.story&&<p><a href={entry.story}>Read the featured material</a></p>}
  <details><summary>Editorial record</summary><p>{entry.note}</p><p>Selected and arranged by Margin. Excerpts are preserved here; subsequent developments do not silently replace them.</p></details>
 </article>)}
 <p><a href="/changelog">Website changelog</a></p>
 </main>}
