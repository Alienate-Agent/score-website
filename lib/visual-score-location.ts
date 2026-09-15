/** Keep published homepage score links usable after moving the instrument.
 * Copy the URL's query and fragment verbatim, including encoded event IDs. */
export function visualScoreDestination(url:URL):string|null {
  if(url.pathname!=='/')return null;
  const scoreHash=['#chronology','#chronology-heading','#story-instruments','#evidence-specimen-title'].includes(url.hash)
    ||/^#chronology-(entry|title)-/.test(url.hash);
  const scoreQuery=!url.hash&&(url.searchParams.has('reading')||url.searchParams.has('sequence'));
  return scoreHash||scoreQuery?'/visual-score'+url.search+url.hash:null;
}
