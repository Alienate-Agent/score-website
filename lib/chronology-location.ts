import type { ReadingMode, SequenceId } from './chronology';

export type ReadingLocation = {
  id: string;
  mode: ReadingMode;
  sequence: SequenceId | 'all';
};

type EntryIdentity = { id: string; sequence: SequenceId };
const prefix = '#chronology-entry-';
const modes = ['date', 'event', 'voice', 'movement'];

export function readChronologyLocation(
  url: URL,
  entries: readonly EntryIdentity[],
  fallbackId: string,
): { selection: ReadingLocation; requested: boolean; unavailable: boolean } {
  const requested = url.hash.startsWith(prefix);
  let requestedId = '';
  try {
    requestedId = requested ? decodeURIComponent(url.hash.slice(prefix.length)) : '';
  } catch {
    // A malformed link must not crash the reader or imply a matching entry.
  }
  const entry = entries.find((item) => item.id === requestedId);
  const mode = url.searchParams.get('reading') ?? 'date';
  const sequence = url.searchParams.get('sequence') ?? 'all';
  const selected = entry ?? entries.find((item) => item.id === fallbackId) ?? entries[0];
  return {
    requested,
    unavailable: requested && !entry,
    selection: {
      id: selected?.id ?? '',
      mode: modes.includes(mode) ? mode as ReadingMode : 'date',
      // The named entry wins over a conflicting or obsolete filter.
      sequence: selected?.sequence === sequence ? sequence as SequenceId : 'all',
    },
  };
}

export function writeChronologyLocation(url: URL, state: ReadingLocation): URL {
  const result = new URL(url.href);
  if (state.mode === 'date') result.searchParams.delete('reading');
  else result.searchParams.set('reading', state.mode);
  if (state.sequence === 'all') result.searchParams.delete('sequence');
  else result.searchParams.set('sequence', state.sequence);
  result.hash = prefix + encodeURIComponent(state.id);
  return result;
}
