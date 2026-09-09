/** Content-free editorial marks. Never accept private text, lengths or keys.
 * Exact selections and unselected future accounts are different kinds of absence.
 */
export function WithheldQuotation() {
  return <aside className="withheld-account withheld-account--selected" data-omission="selected" aria-label="Selected artist quotation withheld">
    <p className="withheld-account__label">Artist Operator · selected quotation withheld</p>
  </aside>;
}

export function WithheldCredit() {
  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- This censorship mark has no image asset or underlying identifying content.
  return <span className="withheld-credit">Artist <span className="withheld-credit__bar" role="img" aria-label="Identity withheld until reveal" /></span>;
}

export function WithheldAccount() {
  return <aside className="withheld-account withheld-account--reserved" data-omission="reserved" aria-label="Space reserved for an artist’s account; no passage selected">
    <p className="withheld-account__label">Artist’s account · space reserved <span>No passage selected</span></p>
  </aside>;
}
