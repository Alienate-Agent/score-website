/** Legacy homepage citations keep their exact record identifier on the archive page. */
export function archiveDestination(hash:string):string|null{
  if(hash==='#dated-record-reader-title')return '/archive';
  const editions=new Set(['#earlier-site-editions','#earlier-site-editions-title','#earlier-entrance','#earlier-story-ending','#archived-story-unwritten','#score-heading','#proof-claim','#proof-act','#proof-interpretation','#debt-definition-heading','#exact-public-act-title']);
  if(editions.has(hash))return '/archive'+hash;
  return hash.startsWith('#public-record-')?'/archive'+hash:null;
}
