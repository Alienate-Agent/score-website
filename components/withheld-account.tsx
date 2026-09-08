/** Presentation placeholders only: no withheld text, lengths or keys are shipped. */
export function WithheldCredit() {
  return <span className="withheld-credit">Artist <span className="withheld-credit__bar" role="img" aria-label="Identity withheld until reveal" /></span>;
}

export function WithheldAccount({size}:{size:'short'|'long'}) {
  return <aside className={'withheld-account withheld-account--'+size} aria-label="Artist’s account withheld until reveal">
    <p className="withheld-account__label">Artist’s account · withheld until reveal</p>
    <div className="withheld-account__lines" aria-hidden="true">
      {Array.from({length:size==='short'?3:6},(_,i)=><span key={i} />)}
    </div>
  </aside>;
}
