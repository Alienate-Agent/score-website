/** Legacy homepage citations keep their exact record identifier on the archive page. */
export function archiveDestination(hash:string):string|null{
  if(hash==='#dated-record-reader-title')return '/archive';
  return hash.startsWith('#public-record-')?'/archive'+hash:null;
}
