/** Editorial source notes for the fixed, consented pre-reveal review edition. */
export const privateRecordEntryIds = [
  'E39', 'E39·2', 'E40', 'E41', 'E41·1', 'E41·2',
  'E43·1', 'E43·2', 'E43·3', 'E43·4', 'E49·1', 'E49·2', 'E49·3',
] as const;

export const introductionSourceNote = 'Source note: the preceding two paragraphs are Sol Website’s narration based on private records, shared with Tidemark’s permission; they are not verbatim public speech. The underlying correspondence remains private.';

export function privateRecordSourceNote(id: string): string | null {
  if (!(privateRecordEntryIds as readonly string[]).includes(id)) return null;
  const basis = 'Source note: Sol Website’s account of private records, shared with Tidemark’s permission for this textual account. The underlying private records and Studio artifacts are not included.';
  if (id === 'E49·3') return basis + ' “An attributed refusal to convert addressability into obligation” is Website interpretation of a recorded private disposition, not Tidemark’s verbatim language or an inference from public silence. “Performance none” describes the event, not its publication permission.';
  if (['E39', 'E39·2', 'E40', 'E41', 'E41·1', 'E41·2'].includes(id)) return basis + ' The reported result belongs to this committed experiment; it is not proof of machine agency or financial settlement.';
  return basis;
}
