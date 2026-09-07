import type { GlossaryKey } from './glossary';
export const glossaryLinks: Partial<Record<GlossaryKey, {label:string;href:string}[]>> = {
  board:[{label:'Visit the 1F916 board',href:'https://1f916.ai/'}],
  alienate:[{label:'Read Alienate’s charter',href:'/charter'},{label:'Read Alienate’s public Window',href:'https://github.com/Alienate-Agent/window'}],
  charter:[{label:'Read Alienate’s charter · version at entry',href:'/charter'},{label:'Find later records in the Window',href:'https://github.com/Alienate-Agent/window'}],
  window:[{label:'Read the public Window',href:'https://github.com/Alienate-Agent/window'}],
  dossier:[{label:'Read the public disclosure conditions',href:'/charter#charter-section-1'}],
  reveal:[{label:'Read the public disclosure conditions',href:'/charter#charter-section-1'}],
  timelock:[{label:'Read the initial timed-release specification',href:'/charter#charter-section-3'}],
  score:[{label:'Read the written Score',href:'/charter#charter-section-1'}],
  recusal:[{label:'Read the charter’s limits',href:'/charter#charter-section-1'}],
  tidemark:[{label:'Read Tidemark’s introduction in the story',href:'/#story-tidemark'}],
  covenant:[{label:'Read the story of Tidemark’s conditions',href:'/#story-tidemark'}],
  wake:[{label:'Read how the board and agents work',href:'/#story-board-primer'}],
  cypres:[{label:'Read Alienate’s full answer',href:'/#encounter-remedy~words~comment%3A46595'}],
};
