import {soloSessionCode} from './lens-solo-transport.mjs';
// Exact, reversible changes to the prior playback engine. Calculation functions
// and source inventory are unchanged. Live edits affect only unscheduled notes.
export const patchEngineEdits = [
  ['lastPlayback=null;', 'lastPlayback=null,soloSession=null,patchTake=null,soloEchoGain=null;const soloTransport={loop:false,echo:true};'],
  ['function stop(){if(endTimer)', 'function stop(){if(soloSession)patchTake=soloSession.view();const pending=soloSession?.pending;soloSession=null;soloEchoGain=null;if(pending){applyPatchState(pending);document.dispatchEvent(new CustomEvent("lens-patch",{detail:{state:"applied",when:"next-play"}}));}if(endTimer)'],
  ['listeningGain.connect(ctx.destination);', 'listeningGain.connect(ctx.destination);const split=ctx.createChannelSplitter(2);listeningGain.connect(split);A.left=mkAn();A.right=mkAn();split.connect(A.left,0);split.connect(A.right,1);'],
  ['A.echo.connect(master);', 'const echoReturn=ctx.createGain();echoReturn.gain.value=onlyKey&&!soloTransport.echo?0:1;A.echo.connect(echoReturn);echoReturn.connect(master);soloEchoGain=onlyKey?echoReturn:null;'],
  ['for(let i=i0+1;i*step<plan.end+step;i++){const at=startAt+(i*step-offset); if(at>=startAt) f.frequency.setTargetAtTime(Math.max(20,b[i%32]*C.karma),at,0.05);} return f;', 'let i=i0+1;f.extendScheduleTo=end=>{for(;i*step<end+step;i++){const at=startAt+(i*step-offset);if(at>=startAt)f.frequency.setTargetAtTime(Math.max(20,b[i%32]*C.karma),at,0.05);}};f.extendScheduleTo(plan.end);return f;'],
  ['const flat=[]; plan.records.forEach', 'const flat=[]; plan.records.forEach'],
  ['sched=setInterval(()=>{if(!ctx)return; const horizon=now()+0.35;', soloSessionCode.trim()+'\nsched=setInterval(()=>{if(!ctx)return;soloSession?.revise();soloSession?.advance(); const horizon=now()+0.35;'],
  ['endTimer=setTimeout(()=>{stop();document.dispatchEvent(new CustomEvent(\'lens-playback\',{detail:{state:\'ended\',act_key:onlyKey}}));},(plan.end-plan.start+0.2)*1000);',
   'soloSession.reschedule();'],
  ['function play(from=0,onlyKey=null){', 'function play(from=0,onlyKey=null){function finishSolo(){stop();document.dispatchEvent(new CustomEvent("lens-playback",{detail:{state:"ended",act_key:onlyKey}}));}'],
  ['last_playback:lastPlayback,', 'last_playback:lastPlayback,last_performed_act:soloSession?.view()??patchTake,solo_transport:{...soloTransport},'],
  ['window.E14={scoreDocument,', [
    'function applyPatchState(change){',
    ' Object.entries(change.mapping).forEach(([k,v])=>{MAP[k]=v;});',
    ' const controls={pitch:"oPitch",temper:"oTemper",quant:"oQuant",reg:"oReg"};',
    ' Object.entries(change.options).forEach(([k,v])=>{document.getElementById(controls[k]).value=v;});',
    ' readOpts();applyOpts();',
    '}',
    'function requestPatch(change){',
    ' if(!change||!change.mapping||!change.options)throw Error("Invalid patch");',
    ' for(const [k,v]of Object.entries(change.mapping))if(!Object.hasOwn(MAPDEF,k)||!Object.hasOwn(FIELDS,v))throw Error("Unknown patch connection");',
    ' const allowed={pitch:["safe","voice"],temper:["off","et12"],quant:["off","onsets","all"],reg:["off","role"]};',
    ' for(const [k,v]of Object.entries(change.options))if(!allowed[k]?.includes(v))throw Error("Unknown listening option");',
    ' const copy={mapping:{...change.mapping},options:{...change.options}};',
    ' if(soloSession&&ctx){soloSession.pending=copy;document.dispatchEvent(new CustomEvent("lens-patch",{detail:{state:"queued"}}));return "queued";}',
    ' if(ctx)stop();applyPatchState(copy);document.dispatchEvent(new CustomEvent("lens-patch",{detail:{state:"applied",when:"next-play"}}));return "applied";',
    '}',
    'function setSoloTransport(change){',
    ' if(!change||Object.entries(change).some(([k,v])=>!Object.hasOwn(soloTransport,k)||typeof v!=="boolean"))throw Error("Invalid transport setting");',
    ' Object.assign(soloTransport,change);if(soloEchoGain&&ctx)soloEchoGain.gain.setTargetAtTime(soloTransport.echo?1:0,ctx.currentTime,.005);soloSession?.reschedule();',
    ' document.dispatchEvent(new CustomEvent("lens-transport",{detail:{...soloTransport}}));',
    '}',
    'window.E14={scoreDocument,requestPatch,setSoloTransport,get soloTransport(){return {...soloTransport};},get patchPerformance(){return soloSession?.view()??null;},get outputMeters(){return ctx?{left:A.left,right:A.right}:null;},'
  ].join('\n')]
].filter(([a,b])=>a!==b);

export function patchEngine(html, reverse=false) {
  const changes=reverse?[...patchEngineEdits].reverse():patchEngineEdits;
  for (const pair of changes) {
    const [from,to]=reverse?[pair[1],pair[0]]:pair;
    if (!html.includes(from)||html.indexOf(from)!==html.lastIndexOf(from)) throw Error('Patch-engine anchor missing/repeated: '+from.slice(0,80));
    html=html.replace(from,to);
  }
  return html;
}
