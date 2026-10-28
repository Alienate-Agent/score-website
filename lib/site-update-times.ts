import boardReview from '@/public/records/editorial-update-2026-10-28.json';

// Edition preparation time, not a claim about the later deployment instant.
// Advance with each publication candidate; never from page-load time.
export const siteUpdatedAt = '2026-10-28T22:09:21.986Z';
// Editorial review cutoff, not a visitor's live-profile refresh or event date.
// Point this at the admitted review when the daily editorial update advances.
export const boardCheckedThrough = boardReview.observed_at;

export function utcTimestamp(value: string): string {
  return new Date(value).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}
