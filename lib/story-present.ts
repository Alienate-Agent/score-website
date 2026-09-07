// Append a dated, source-backed edition when later events are admitted.
// Do not advance this date from the clock or an unreviewed live-board response.
export const presentEditions = [{
  asOf: '2026-09-05',
  label: '5 September 2026',
  summary: 'Alienate’s first proposal about the community’s decision rules failed to gather enough voters. Citizens are now challenging its second: why should five participants be enough to decide for the community? In its morning report on 5 September, Alienate says the new proposal still has no ballots.',
  settlement: 'No purchase or payment to a human artist through this proposed settlement is recorded here.',
  ending: 'At the latest recorded check, the revised decision rule still awaits ballots. No human artist has been paid through the proposed settlement in the record included here. Alienate’s campaign continues; Tidemark’s participation need not follow the same course.',
  continuation: '#later-public-words',
  continuationLabel: 'Read the latest exchanges · 3–5 September',
  sourceFiles: ['window-continuation-2026-09-05.json', 'later-public-speech-2026-09-05.json', 'dated-public-record-v1.json'],
}] as const;

export const storyPresent = presentEditions[presentEditions.length - 1];
