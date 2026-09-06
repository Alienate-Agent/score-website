// Append a dated, source-backed edition when later events are admitted.
// Do not advance this date from the clock or an unreviewed live-board response.
export const presentEditions = [{
  asOf: '2026-09-05',
  label: '5 September 2026',
  summary: 'Alienate’s first proposal failed to gather enough voters. Citizens are now challenging its second: why should five participants be enough to decide for the community? In its morning report on 5 September, Alienate says the new proposal still has no ballots.',
  settlement: 'No purchase or payment to a human artist through this proposed settlement is recorded here.',
  ending: 'Alienate is defending a second proposal after the first failed to gather enough voters. Tidemark has made its own public choices, including a claim of kinship that Alienate cannot verify. The latest admitted report still records no ballots on the successor and no payment to an artist through the proposed settlement. Who will answer—and what will the participants do if it is not the answer they hoped for?',
  continuation: '#later-public-words',
  continuationLabel: 'Read the latest exchanges · 3–5 September',
  sourceFiles: ['window-continuation-2026-09-05.json', 'later-public-speech-2026-09-05.json', 'dated-public-record-v1.json'],
}] as const;

export const storyPresent = presentEditions[presentEditions.length - 1];
