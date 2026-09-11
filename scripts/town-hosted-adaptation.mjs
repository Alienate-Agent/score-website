// Margin's hosted-only derivative. Never alter the downloadable town-play file.
export const townMoves=['arrive_late','walk_uphill','stand','enter_window','sit','walk_to_workshop','stay','return_to_bench','tell_origin','back_door','listen','cross_lane','take_afternoon','descend','follow_gutter','look_at_suitcase','pause_writing','enter_archive','resume_writing','enter_paper_door','listen_at_handle','leave_via_handle'];
export function hostedTown(original) {
  let html=original;
  function replace(from,to){if(html.split(from).length!==2)throw Error('Town adaptation source changed: '+from.slice(0,50));html=html.replace(from,to);}
  replace('No network, analytics, storage or external assets.','Hosted adaptation by Margin: selected control actions are recorded privately by the surrounding site, subject to its reading-statistics preferences. No route text or saved traces are sent. The downloadable original has no analytics.');
  replace('let travelers=[initial(),initial()],active=0;',`let townTrackingEnabled=false;
window.addEventListener('message',event=>{
 if(event.source!==window.parent||window.parent===window)return;
 const d=event.data;
 if(d&&Object.keys(d).sort().join(',')==='enabled,type'&&d.type==='score-town-tracking'&&typeof d.enabled==='boolean')townTrackingEnabled=d.enabled;
});
function reportTown(event,action,target='studio-town') {
 if(!townTrackingEnabled||!event?.isTrusted||window.parent===window)return;
 // Only fixed identifiers, never state, route text, JSON or saved traces.
 window.parent.postMessage({type:'score-town-v1',action,target},'*');
}
let travelers=[initial(),initial()],active=0;`);
  replace('b.onclick=()=>{travelers[active]=step(s,a);render();}',"b.onclick=e=>{travelers[active]=step(s,a);reportTown(e,'town_step','town:'+a);render();}");
  replace("active=Number(e.target.value);render();","active=Number(e.target.value);reportTown(e,'town_switch');render();");
  replace("$('reset').onclick=()=>{travelers[active]=initial();render();}","$('reset').onclick=e=>{travelers[active]=initial();reportTown(e,'town_reset');render();}");
  replace("$('example').onclick=()=>{travelers=[walk(exampleRoutes.visitor),walk(exampleRoutes.wanderer)];render();}","$('example').onclick=e=>{travelers=[walk(exampleRoutes.visitor),walk(exampleRoutes.wanderer)];reportTown(e,'town_example');render();}");
  replace("$('run').onclick=()=>{try{","$('run').onclick=event=>{try{");
  replace('travelers[active]=candidate;render();',"travelers[active]=candidate;reportTown(event,'town_run');render();");
  replace("$('download').onclick=()=>{const blob=", "$('download').onclick=e=>{reportTown(e,'town_export');const blob=");
  return html;
}
