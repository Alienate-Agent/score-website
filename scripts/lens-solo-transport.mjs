// Injected inside play(): one audio clock, bounded look-ahead, no timer restart
// between passes. The original composition and its mapped echo stay available.
export const soloSessionCode = String.raw`
if(onlyKey){
 const serialize=pass=>({act_key:onlyKey,start_s:pass.start,end_s:pass.end,cycle:pass.number,
  loop:soloTransport.loop,echo:soloTransport.echo,echo_delay_s:tf(DELAY).v,
  changes:patchTake.changes,changes_omitted:patchTake.changes_omitted,
  notes:pass.rows.map(({n})=>({text:n.text||null,t_s:n.t,duration_s:n.hd,output_hz:playbackHz(n.hf),glide_output_hz:n.hglide?playbackHz(n.hglide):null}))});
 let pass={number:1,start:plan.start,end:plan.records[0].end,rows:flat.slice()},passes=[pass];
 patchTake={changes:[],changes_omitted:0};
 const view=()=>serialize(passes.findLast(p=>p.start<=now())??passes[0]);
 const release=()=>Math.max(.05,...pass.rows.map(({rc,n})=>Math.max(0,rc.env.a+rc.env.d-n.hd)+rc.env.r+.05));
 const reschedule=()=>{
  clearTimeout(endTimer);endTimer=null;
  plan.end=pass.end+(soloTransport.echo&&OPT.band!=='band'?tf(DELAY).v+2:release());
  filt.extendScheduleTo(plan.end);
  if(!soloTransport.loop)endTimer=setTimeout(finishSolo,Math.max(0,(plan.end-now())*1000));
 };
 const log=entry=>{patchTake.changes.push(entry);if(patchTake.changes.length>128){patchTake.changes.shift();patchTake.changes_omitted++;}};
 soloSession={key:onlyKey,pending:null,view,reschedule,
  revise:()=>{
   const change=soloSession.pending;if(!change)return;soloSession.pending=null;
   const anchor=flat[ei]?.n.t;applyPatchState(change);
   if(anchor!=null){const fresh=REC.find(rc=>rc.r.key===onlyKey);let t=anchor;
    const future=fresh.notes.slice(ei).map(note=>{const n={...note,t};t+=n.hd+(OPT.quant==='all'?qdur(Math.max(n.hr,DAYS/C.caps.comment/8),DAYS/C.caps.comment):n.hr);return {rc:fresh,n};});
    flat.splice(ei,flat.length-ei,...future);pass.rows=flat.slice();pass.end=t;reschedule();
   }
   log({at_s:now(),effective_from_s:anchor??null,cycle:pass.number,mapping:{...MAP},options:{...OPT}});
   document.dispatchEvent(new CustomEvent('lens-patch',{detail:{state:'applied',when:anchor==null?'next-pass':'next-note'}}));
  },
  advance:()=>{
   if(!soloTransport.loop||ei<flat.length||now()+.35<pass.end)return;
   const fresh=REC.find(rc=>rc.r.key===onlyKey),start=Math.max(pass.end,now()+.025);
   const rows=fresh.notes.map(note=>({rc:fresh,n:{...note,t:start+note.t-fresh.at}}));
   pass={number:pass.number+1,start,end:start+fresh.end-fresh.at,rows};
   // The future pass can be scheduled before it sounds. Retain the current
   // pass for truthful visual feedback, and discard completed older passes.
   passes=passes.filter(p=>p.end>now());passes.push(pass);
   flat.splice(0,flat.length,...rows);ei=0;reschedule();
  }
 };
 reschedule();
}`;
