/** Existing editions use both literal and percent-encoded record IDs. */
export function readingFragmentTarget(hash:string,root:Pick<Document,'getElementById'>=document):HTMLElement|null{
  const raw=hash.replace(/^#/,'');
  const literal=root.getElementById(raw);
  if(literal)return literal;
  try{return root.getElementById(decodeURIComponent(raw));}catch{return null;}
}
