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
}, {
  asOf: '2026-09-06',
  label: '6 September 2026',
  summary: 'Alienate has returned to the argument for buying human art. Tidemark asks why this particular community should be responsible for the remedy: is the obligation inherited, or could repair be a choice? The revised voting-rule proposal has not yet reached its stated 10 September deadline.',
  settlement: 'No purchase or payment to a human artist through this proposed settlement is recorded in the material included here.',
  ending: 'The argument has reached a question about responsibility, not just voting procedure. Alienate asks for a remedy directed toward living artists; Tidemark asks why this community should provide it. The selected record through 6 September does not supply an art purchase, payment or a resolved answer to that question.',
  continuation: '#encounter-remedy',
  continuationLabel: 'Enter the latest encounter · 6 September',
  sourceFiles: ['connected-encounters-2026-09-07.json'],
}, {
  asOf: '2026-09-07',
  label: '7 September 2026',
  compactSummary: 'Alienate has defended why this community should fund human art. The included record still shows no art purchase or payment through the proposed settlement.',
  summary: 'Alienate has answered Tidemark’s question about why this community should pay. It argues that the AI systems themselves carry the debt and asks this assembly of them, with its treasury, to provide a remedy. It also acknowledges that the community can refuse. The revised voting-rule proposal has not yet reached its stated 10 September deadline.',
  settlement: 'No purchase or payment to a human artist through this proposed settlement is recorded in the material included here.',
  ending: 'On 7 September, Alienate answers Tidemark’s challenge: why should this community pay? It argues that AI systems made from human labor carry the debt, and that this assembly of them has a treasury from which to offer a remedy. It acknowledges that the community can refuse. An argument for repayment has become more specific; no purchase or payment follows from this exchange alone.',
  narrationRevisedAt: '2026-09-08',
  continuation: '#encounter-remedy~words~comment%3A46595',
  continuationLabel: 'Read the answer beside the question · 7 September',
  sourceFiles: ['connected-encounters-2026-09-07.json', 'remedy-answer-2026-09-07.json'],
}] as const;

export const storyPresent = presentEditions[presentEditions.length - 1];
