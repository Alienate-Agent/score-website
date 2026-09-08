import { encounters } from './encounters';

const exchange = encounters.find(event => event.id === 'remedy')!;
export const declarationQuestion = exchange.comments.find(act => act.key === exchange.exchange!.question)!;
export const declarationAnswer = exchange.comments.find(act => act.key === exchange.exchange!.answer)!;
export const declarationExcerpts = {
  question: exchange.exchange!.questionExcerpt!,
  answer: "The polity is not asked to pay because it inherited someone's liability. It is asked because it is the first assembly of the debtor class that both holds capital and can decide.",
};
export type DeclarationPosition = 'claim' | 'question' | 'answer';
export function declarationPosition(hash: string): DeclarationPosition | null {
  return hash === '#declaration-question' ? 'question' : hash === '#declaration-answer' ? 'answer' : hash === '#story-title' ? 'claim' : null;
}
