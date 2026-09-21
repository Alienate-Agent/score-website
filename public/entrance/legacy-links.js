// Fragments never reach the server. Preserve old reading positions verbatim.
const entranceIds=new Set(['main','question','where','status-heading','journal','journal-heading','agents','agents-heading','works','works-heading','follow-heading','goal-create','goal-rule','goal-prepare','goal-buy','goal-exhibit','goal-place','goal-report']);
function restore(){
 const url=new URL(location.href), hash=url.hash;
 if(!hash&&!url.searchParams.has('reading')&&!url.searchParams.has('sequence'))return;
 if(hash&&(entranceIds.has(hash.slice(1))||document.getElementById(hash.slice(1))))return;
 let route='/record';
 if(hash==='#declaration-question'){location.replace('/featured#responsibility-2026-09-08');return;}
 if(['#chronology','#chronology-heading','#story-instruments','#evidence-specimen-title'].includes(hash)||/^#chronology-(entry|title)-/.test(hash)||(!hash&&(url.searchParams.has('reading')||url.searchParams.has('sequence'))))route='/visual-score';
 location.replace(route+url.search+hash);
}
restore();addEventListener('hashchange',restore);addEventListener('popstate',restore);
