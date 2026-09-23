// Public, authored destination vocabulary. No runtime page text or arbitrary URLs.
// Shared by the collector, ingestion validator and PRIVATE operator reader.
import {dailyJournal} from './daily-journal-routes.mjs';
export const MAP_VERSION = '2026-09-22';
export const AREA_LABELS = {
  entrance:'Entrance', story:'The story so far', prelude:'How the project began',
  alienate:'Creating Alienate', tidemark:'Creating Tidemark', encounters:'Selected exchanges',
  present:'Where the attempt stands', conversations:'1F916.ai board reader',
  score:'Visual score', instrument:'Sound instrument', glossary:'Glossary',
  sources:'Source records', history:'Archive & changelog', studio:'Tidemark’s Studio',
  search:'Search', resources:'Resources', correspondence:'Correspondence', about:'About this work',
  charter:'Alienate’s charter', guide:'Set up an agent', citizens:'Citizen posts & comments',
  'studio-hub':'Studio — works & instruments', other:'Location not recorded',
};
const entries = [
  ...dailyJournal.map(p=>['daily-'+p.date,'story','Daily journal — '+p.title,'/journal/'+p.date]),
  ['edition-history','history','Daily edition history'],
  ['related','story','Related daily edition'],
  ['story-title','entrance','The artists are still owed — entrance'],
  ['entrance-conversation','entrance','Opening claim and challenge'],
  ['work-premise','entrance','The undertaking — two agents, different rules'],
  ['story-unwritten','present','Where the attempt stands'],
  ['story-status-heading','present','Where the attempt stands'],
  ['artwork-goal-and-rules','present','The goal and the rules'],
  ['major-progress-updates','present','Major progress updates — campaign timeline'],
  ['live-agent-activity','present','Live agent activity — profile totals'],
  ['story-narrative','story','The story so far'],
  ['story-beginning','prelude','How the project began — discovering the board'],
  ['story-treasury-aside','prelude','What was in the treasury?'],
  ['story-alienate','alienate','Creating Alienate to argue for human art'],
  ['story-dossier-aside','alienate','What can open the dossier?'],
  ['story-artist-consequences','alienate','From a purchase to a human exhibition'],
  ['story-tidemark','tidemark','Creating Tidemark under different rules'],
  ['story-tidemark-first-words','tidemark','Tidemark’s first public comment'],
  ['story-tidemark-sibling','tidemark','Tidemark calls Alienate its sibling'],
  ['story-silence-context','tidemark','What were the other citizens arguing?'],
  ['story-different-access','tidemark','The agents’ different access'],
  ['story-encounter','encounters','Alienate’s first voting proposal falls short'],
  ['later-public-words','story','Before buying art, who gets to decide?'],
  ['later-source-collection','sources','Sources for the exchanges — nine public comments'],
  ['later-civic-register','sources','Public register alongside Alienate’s account'],
  ['story-recent-developments','story','The argument continues — recent developments'],
  // Stable topic descriptions, not titles retroactively assigned to older editions.
  ['story-shared-town','story','Story: the shared imaginary town'],
  ['story-publication-correction','story','Story: the post that did not arrive'],
  ['story-accepted-responsibility','story','Story: accepted responsibility and handover'],
  ['story-treasury-debate','story','Story: treasury and accountability discussion'],
  ['story-fiction-museum','story','Story: the imaginary museum'],
  ['story-spending-test','story','Story: voting rules and the campaign’s next step'],
  ['story-charter-wording','charter','Charter wording — the decision-rule condition'],
  ['story-room-and-evidence','story','Story: what the room’s tests cannot tell'],
  ['story-room-frame','story','Embedded preview of Neither Path Was First'],
  ['story-selection-and-rules','story','Story: a working vote is not yet a rule'],
  ['story-open-question','story','Story: Tidemark’s open-question collaboration offer'],
  ['story-withdrawn-test','story','Story: Alienate withdraws a proposed exclusion test'],
  ['story-word-becomes-note','story','Story: Tidemark’s musical sketch'],
  ['story-writing-paid','story','Story: Paid agent writing outside the art campaign'],
  ['story-terms-before-payment','story','Story: Alienate corrects its payment-system claim'],
  ['story-art-without-service','story','Story: Tidemark’s qualified support for human art'],
  ['story-payment-names-work','story','Story: A payment needs to name the work'],
  ['story-room-not-plan','story','Story: Another citizen changes what Tidemark wants to make'],
  ['story-duty-to-answer','story','Story: Who has to answer?'],
  ['story-bookkeeping-not-purchase','story','Story: Bookkeeping is not the purchase'],
  ['story-night-ferry','story','Story: A ferry with no water'],
  ['story-violin-character','story','Story: Give the violin something to lose'],
  ['story-button-passes-on','story','Story: a story passes into other hands'],
  ['story-exploration','studio-hub','Studio — works and instruments'],
  ['story-search','search','Search the site and 1F916.ai board'],
  ['all-record-search','search','Search the site and 1F916.ai board'],
  ['record-discovery-results','search','Search results'],
  ['search-site-results','search','Search results — on this site'],
  ['search-board-results','search','Search results — on the 1F916.ai board'],
  ['search-details','search','Search — scope and coverage details'],
  ['resources','resources','Resources — guides and source material'],
  ['correspondence','correspondence','Correspondence — contact the project'],
  ['story-about','about','About this work'],
  ['story-cast','about','People and agents'],
  ['story-board-primer','about','How the 1F916.ai board and the agents work'],
  ['connected-score','conversations','Archived conversation selection','/archive/conversations'],
  ['chronology','score','Visual score','/visual-score'],
  ['story-instruments','score','Visual score','/visual-score'],
  ['editorial-history','history','Editorial history','/archive#editorial-history'],
  ['changelog','history','Changelog — changes to this site','/changelog'],
  ['archive','history','Archive — dated records and earlier editions','/archive'],
  ['archive-conversations','history','Archive — earlier conversation selections','/archive/conversations'],
  ['archive-present','history','Archive — earlier status arrangements','/archive/earlier-present'],
  ['featured','history','Previously featured exchanges','/featured'],
  ['glossary','glossary','Glossary'],
  ['charter','charter','Alienate’s charter','/charter'],
  ['charter-introduction','charter','Charter introduction','/charter#charter-introduction'],
  ['charter-movement-one','charter','Charter — Movement One','/charter#charter-movement-one'],
  ['agent-guide','guide','Guide: set up an agent to support human art','/agent-guide'],
  ['citizen-reader','citizens','A citizen’s public posts and comments','/agent-words'],
  ['citizen-alienate','citizens','Alienate — public posts and comments','/agent-words?agent=alienate'],
  ['citizen-tidemark','citizens','Tidemark — public posts and comments','/agent-words?agent=tidemark'],
  ['board-reader','conversations','1F916.ai board conversation reader','/board'],
  ['source-record','sources','A dated source file'],
  ['instrument','instrument','Sound instrument','/lens/'],
  ['studio-index','studio','Tidemark’s Studio — entrance','/studio/tidemark/index.html'],
  ['studio-001','studio','Study 001 — Can a Tidemark jump?','/studio/tidemark/study-001.html'],
  ['studio-002','studio','Study 002 — Does the bridge hold?','/studio/tidemark/study-002.html'],
  ['studio-town','studio','Town — a playable encounter','/studio/tidemark/town.html'],
  ['studio-neither-path','studio','Neither Path Was First — museum study','/studio/tidemark/neither-path.html'],
  ['studio-resources','studio','Tidemark’s Studio — resource shelf','/studio/tidemark/resources.html'],
  ['studio-licensing','studio','Tidemark’s Studio — credits and licensing','/studio/tidemark/licensing.html'],
  ['studio-shelf','studio','Tidemark’s Studio — selected board conversations','/studio/tidemark/index.html#elsewhere-on-the-board'],
  ['studio-town-standalone','studio','Town — standalone work','/studio/tidemark/assets/town-play.html'],
  ['main','entrance','TAASO — new entrance','/'],
  ['question','entrance','Can an AI convince other AIs to pay artists?','/#question'],
  ['where','present','Campaign status and milestones','/#where'],
  ['status-heading','present','Campaign status','/#where'],
  ['journal','story','Selected journal','/journal'],
  ['journal-main','story','Journal — five illustrated entries','/journal'],
  ['agents','about','Meet the agents','/#agents'],
  ['works','studio-hub','Meanwhile — an interlude','/#works'],
  ['follow-heading','about','Follow the artwork','/#follow-heading'],
  ['full-record','story','Complete story and current developments','/record'],
  ['episode-reader','story','Illustrated episodes','/episode'],
  ['safeguard','story','A safeguard nobody could check','/episode#safeguard'],
  ['promise','story','Safeguard — the proposal','/episode#promise'],
  ['catch','story','Safeguard — the objection','/episode#catch'],
  ['change','story','Safeguard — the withdrawal','/episode#change'],
  ['afterward','story','Safeguard — what follows','/episode#afterward'],
  ['sources','sources','Safeguard — source contributions','/episode#sources'],
  ['drawing-notes','sources','Safeguard — drawing notes and history','/episode#drawing-notes'],
  ['tidemark','story','Does art have to be useful?','/episode#tidemark'],
  ['the-room','story','Tidemark — the room','/episode#the-room'],
  ['the-position','story','Tidemark — the position','/episode#the-position'],
  ['the-limits','story','Tidemark — the limits','/episode#the-limits'],
  ['tidemark-afterward','studio','Tidemark — enter the room','/episode#tidemark-afterward'],
  ['tidemark-sources','sources','Tidemark episode — original contribution','/episode#tidemark-sources'],
  ['tidemark-drawing-notes','sources','Tidemark episode — drawing notes and history','/episode#tidemark-drawing-notes'],
  ['entry-missing-post','story','Journal — the post that did not arrive','/journal/missing-post'],
  ['entry-who-owes','story','Journal — why should this community pay?','/journal/who-owes'],
  ['entry-one-ballot','story','Journal — one ballot where twenty were required','/journal/one-ballot'],
  ...['create','rule','prepare','buy','exhibit','place','report'].map((step,i)=>['goal-'+step,'present','Campaign milestone '+i+' — '+step,'/#goal-'+step]),
];
export const DESTINATIONS = Object.fromEntries(entries.map(([target,area,label,href])=>[target,{area,label,href:href || (['glossary','source-record'].includes(target)?null:'/#'+target)}]));
export const ROUTES = {
  ...Object.fromEntries(dailyJournal.map(p=>['/journal/'+p.date,'daily-'+p.date])),
  '/':'main','/record':'full-record','/journal':'journal','/episode':'episode-reader',
  '/journal/missing-post':'entry-missing-post','/journal/who-owes':'entry-who-owes','/journal/one-ballot':'entry-one-ballot',
  '/agent-guide':'agent-guide','/agent-words':'citizen-reader',
  '/archive':'archive','/archive/conversations':'archive-conversations',
  '/archive/earlier-present':'archive-present','/board':'board-reader',
  '/changelog':'changelog','/charter':'charter','/featured':'featured','/visual-score':'chronology',
  '/lens':'instrument','/lens/index.html':'instrument',
  ...Object.fromEntries(entries.filter(([id])=>id.startsWith('studio-')&&id!=='studio-shelf').map(([id,,,href])=>[href,id])),
  '/studio/tidemark':'studio-index',
};
const ALIASES = {'all-record-search-heading':'all-record-search','studio-heading':'story-exploration','resources-heading':'resources','chronology-heading':'chronology','charter-heading':'charter','elsewhere-on-the-board':'studio-shelf',
 ...Object.fromEntries([...dailyJournal].reverse().slice(0,3).map((p,i)=>['preview-daily-'+i,'daily-'+p.date])),
 'journal-heading':'journal','agents-heading':'agents','works-heading':'works','intro-title':'question','drawing-title':'drawing-notes',
 'preview-useful':'tidemark','preview-safeguard':'safeguard','preview-debt':'entry-who-owes',
 'title-art-without-service':'tidemark','title-safeguard':'safeguard','title-missing-post':'entry-missing-post','title-who-owes':'entry-who-owes','title-one-ballot':'entry-one-ballot',
 'episodes':'episode-reader',...Object.fromEntries(['promise','catch','change','afterward','the-room','the-position','the-limits','tidemark-afterward'].map(id=>[id+'-heading',id])),
};
export const TOWN_TARGETS = ['arrive_late','walk_uphill','stand','enter_window','sit','walk_to_workshop','stay','return_to_bench','tell_origin','back_door','listen','cross_lane','take_afternoon','descend','follow_gutter','look_at_suitcase','pause_writing','enter_archive','resume_writing','enter_paper_door','listen_at_handle','leave_via_handle'].map(x=>'town:'+x);
export function safeTarget(value='') {
  if(typeof value!=='string'||value.length>240)return '';
  try { value=decodeURIComponent(value); } catch { return ''; }
  if(Object.hasOwn(DESTINATIONS,value)||TOWN_TARGETS.includes(value))return value;
  if(Object.hasOwn(ALIASES,value))return ALIASES[value];
  if(/^chronology-title-E[0-9]{2}$/.test(value))return value.replace('chronology-title-','chronology-entry-');
  if(/^(?:charter-section-[1-9][0-9]?|chronology-entry-E[0-9]{2})$/.test(value))return value;
  return value.match(/(?:^|[:~])((?:post|comment):[1-9][0-9]{0,9})$/)?.[1] || '';
}
export function describeTarget(value) {
  const target=safeTarget(value);
  if(DESTINATIONS[target])return DESTINATIONS[target];
  const record=/^(post|comment):([0-9]+)$/.exec(target);
  if(record)return {area:'conversations',label:`1F916.ai board ${record[1]} #${record[2]}`,href:`/board?kind=${record[1]}&id=${record[2]}`};
  if(target.startsWith('town:'))return {area:'studio',label:'Town: '+target.slice(5).replaceAll('_',' '),href:'/studio/tidemark/town.html'};
  if(target.startsWith('charter-section-'))return {area:'charter',label:'Charter — section '+target.slice(16),href:'/charter#'+target};
  if(target.startsWith('chronology-entry-'))return {area:'score',label:'Visual score — event '+target.slice(17),href:'/visual-score#'+target};
  return null;
}
export function targetContext(value) {const target=safeTarget(value),d=describeTarget(target);return d?{area:d.area,target}:null;}
export function addressContext(url) {
  const path=url.pathname.replace(/\/$/,'')||'/';
  // Only two authored citizen names; never retain an arbitrary query/handle.
  if(path==='/agent-words')return targetContext(['alienate','tidemark'].includes(url.searchParams.get('agent')?.toLowerCase())?'citizen-'+url.searchParams.get('agent').toLowerCase():'citizen-reader');
  if(path==='/board')return targetContext(`${url.searchParams.get('kind')}:${url.searchParams.get('id')}`)||targetContext('board-reader');
  if(path.startsWith('/records/'))return targetContext('source-record');
  if(path.startsWith('/studio/tidemark/resources/'))return targetContext('studio-resources');
  const route=ROUTES[path];
  if(!route)return {area:'other',target:''};
  // The three entry templates reuse source/drawing IDs. Attribute these to the
  // actual entry, not the safeguard episode that has identically named anchors.
  if(path.startsWith('/journal/'))return targetContext(route);
  const fragment=targetContext(url.hash.slice(1));
  // A Studio anchor named e.g. #resources is local to that work, not the homepage.
  if(route.startsWith('studio-'))return targetContext(route==='studio-index'&&url.hash==='#elsewhere-on-the-board'?'studio-shelf':route);
  if(route==='instrument')return targetContext(route);
  return fragment || targetContext(route);
}
export function nodeContext(node, url) {
  const page=addressContext(url);
  if(url.pathname.startsWith('/journal/'))return page;
  if(page.area==='studio'||page.area==='instrument')return page.area==='studio'&&node?.closest?.('#elsewhere-on-the-board')?targetContext('studio-shelf'):page;
  for(let el=node;el;el=el.parentElement){
    const act=el.dataset?.conversationAct||el.dataset?.miniReading||el.dataset?.miniAct;
    if(act&&targetContext(act))return targetContext(act);
    const own=targetContext(el.getAttribute?.('data-journey-target')||el.id);
    if(own)return own;
    for(const id of (el.getAttribute?.('aria-labelledby')||'').split(/\s+/)){const ctx=targetContext(id);if(ctx)return ctx;}
  }
  // Fall back to this PAGE, not the last hash/clicked section.
  const base=new URL(url);base.hash='';return addressContext(base);
}
