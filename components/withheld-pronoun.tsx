/** Pre-reveal placeholder: never pass withheld source words into this component. */
export function WithheldPronoun({ id }: { id: string }) {
  return <span className="withheld-pronoun" data-redaction-id={id} role="img" aria-label="pronoun withheld"><span aria-hidden="true">████</span></span>;
}
