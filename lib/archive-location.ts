/** Legacy homepage citations keep their exact record identifier on the archive page. */
export function archiveDestination(hash:string):string|null{
  if(hash==='#connected-score'||/^#encounter-[a-z0-9-]+(?:~.*)?$/.test(hash))return '/archive/conversations'+hash;
  if(hash==='#dated-record-reader-title')return '/archive';
  const editions=new Set(['#earlier-site-editions','#earlier-site-editions-title','#earlier-entrance','#earlier-story-ending','#archived-story-unwritten','#score-heading','#proof-claim','#proof-act','#proof-interpretation','#debt-definition-heading','#exact-public-act-title']);
  if(editions.has(hash))return '/archive'+hash;
  const studies=new Set(['#archive-studies','#archive-studies-title','#august-24-conduct','#conduct-leaf-heading','#two-readings','#two-readings-heading','#historical-reading-notes','#question-paths','#board-questions','#board-question-money','#board-question-initiative','#board-question-kinship','#paths-of-judgment','#paths-heading']);
  if(studies.has(hash)||/^#thread-check-(3734|3581)$/.test(hash))return '/archive'+hash;
  return hash.startsWith('#public-record-')?'/archive'+hash:null;
}
