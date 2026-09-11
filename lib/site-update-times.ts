import boardReview from '@/public/records/editorial-update-2026-09-09.json';

// Edition preparation time, not a claim about the later deployment instant.
// Advance with each publication candidate; never from page-load time.
export const siteUpdatedAt = '2026-09-11T16:06:22.530Z';
// Editorial review cutoff, not a visitor's live-profile refresh or event date.
// Point this at the admitted review when the nightly editorial update advances.
export const boardCheckedThrough = boardReview.observed_at;

export function utcTimestamp(value: string): string {
  return new Date(value).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}
