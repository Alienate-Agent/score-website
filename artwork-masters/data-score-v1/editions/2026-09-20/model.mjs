import {createHash} from 'node:crypto';
export const VERSION='data-score/1';
const TAU=Math.PI*2, sin=Math.sin, cos=Math.cos;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const sha=s=>createHash('sha256').update(s).digest('hex');
export const seed=s=>parseInt(sha(s).slice(0,8),16)/0x100000000;
export const words=s=>s.trim().split(/\s+/u).filter(Boolean);
// Identity is stable across episodes; changing source text or score cannot change it.
export function hand(speaker){const s=seed('speaker/v1|'+speaker.toLowerCase());return {phase:s*TAU,frequency:2+Math.floor(s*4),slant:(s-.5)*.55,color:({alienate:'#ed96cf',tidemark:'#66d0cc',episteme:'#ffc08e'})[speaker.toLowerCase()]??'#d7c395'};}
export function grain(votes){return votes===null?null:Math.log1p(Math.min(100,Math.abs(votes.value)))/Math.log(101);}
const path=(pts,source,color,opacity=.55,role='structure')=>({points:pts,source,color,opacity,role});
function sampled(fn,n=190){return Array.from({length:n+1},(_,i)=>fn(i/n));}
function jitter(s,u,i){const a=seed(s.excerptSha256+'|'+i);return sin(TAU*(u*(2+Math.floor(a*5))+a))* (2+7*a);}
function echo(paths,s){
 const g=grain(s.votes);if(g===null||g===0)return [];
 // A bounded additional texture, never a change to the base geometry.
 return paths.filter((_,i)=>i%7===0).map((p,i)=>path(p.points.map(([x,y],j)=>[x,y+sin(j*.21+i)*2.4*g]),s.key,p.color,.12+.13*g,'votes-grain'));
}
function interruption(e){
 const [proposal,objection,withdrawal]=e.sources, h=hand(proposal.speaker), oh=hand(objection.speaker), all=[];
 const target=e.relationships.find(r=>r.operation==='withdraw-test')?.target;
 const challenged=e.relationships.find(r=>r.operation==='challenge')?.target;
 e.claims.forEach((claim,k)=>{
   const n=words(claim.text).length*4;
   const q=seed(proposal.bodySha256+'|'+claim.id), seam=.32+seed(objection.bodySha256)*.25;
   const isTarget=claim.id===target, isChallenged=claim.id===challenged;
   for(let i=0;i<n;i++){
     const v=n===1?0:i/(n-1), pts=sampled(u=>{
       const envelope=sin(Math.PI*u), bend=sin(TAU*u+h.phase*.2+k*.7);
       return [80+840*u+27*sin(TAU*u+k)*envelope,
        195+k*230+envelope*(bend*100+(v-.5)*180)+jitter(proposal,u,i)*envelope];
     });
     if(isTarget){
       all.push(path(pts,proposal.key,'#b7aea5',e.editorial.weights.withdrawalTrace,'withdrawn-trace'));
       const left=pts.filter((_,j)=>j/190<seam-.035),right=pts.filter((_,j)=>j/190>seam+.085);
       all.push(path(left,proposal.key,h.color,.4),path(right,proposal.key,h.color,.4));
     }else all.push(path(pts,proposal.key,k===1?'#f2dfc3':h.color,.55));
     if(isChallenged&&i%2===0){
       const strain=e.editorial.weights.interruption;
       const pts2=sampled(u=>[80+840*seam+(v-.5)*145+sin(u*TAU+oh.phase)*35,58+u*345+strain*45*sin(u*Math.PI+i*.07)],110);
       all.push(path(pts2,objection.key,oh.color,.5,'objection'));
     }
   }
 });
 // Explicit correction's lexical fingerprint ends in short, separate strokes.
 const amount=Math.min(90,words(withdrawal.excerpt).length);
 for(let i=0;i<amount;i++){const q=seed(withdrawal.excerptSha256+'|'+i);all.push(path(sampled(u=>[705+i*2,92+q*48+u*(4+12*q)],8),withdrawal.key,h.color,.4,'correction'));}
 return [...all,...e.sources.flatMap(s=>echo(all.filter(p=>p.source===s.key),s))];
}
function address(e){
 const all=[],[a,b]=e.sources, gapHours=(Date.parse(b.occurredAt)-Date.parse(a.occurredAt))/3600000;
 const timeGap=clamp(Math.log1p(gapHours)/Math.log(73),0,1);
 const encounter=e.relationships.some(r=>r.kind==='explicit-address')?e.editorial.weights.encounter:0;
 e.sources.forEach((s,k)=>{
   const h=hand(s.speaker), ws=words(s.excerpt), n=Math.min(120,ws.length);
   for(let i=0;i<n;i++){
     const v=i/(n-1), q=seed(s.excerptSha256+'|'+ws[i]+'|'+i);
     all.push(path(sampled(u=>{
       const x=k===0?105+u*780:895-u*780;
       const span=sin(Math.PI*u), fan=(v-.5)*(90+span*210);
       const y=(k===0?255:655)+(k===0?1:-1)*encounter*225*sin(Math.PI*u)
        +fan+sin(u*TAU*(1+q*.45)+h.phase)*span*40
        +(k===0?-1:1)*timeGap*20+sin(u*TAU*h.frequency+q*TAU)*span*8;
       return [x+h.slant*fan,y];
     }),s.key,h.color,.32+.23*q));
   }
 });
 return [...all,...e.sources.flatMap(s=>echo(all.filter(p=>p.source===s.key),s))];
}
function holdings(e){
 const t=e.treasury,s=e.sources[0],h=hand(s.speaker),all=[];
 if(t.reportedTotalCents===null)return all;
 if(t.tiersCents.reduce((a,b)=>a+b,0)!==t.reportedTotalCents)throw Error('Tier total mismatch');
 const colors=['#76ccc6','#ead5ab','#de97bc'];
 let offset=-.5;
 t.tiersCents.forEach((value,k)=>{
   const share=value/t.reportedTotalCents, n=Math.max(1,Math.round(240*share));
   for(let i=0;i<n;i++){
     const v=offset+share*i/Math.max(1,n-1), q=seed(s.bodySha256+'|tier:'+k+'|'+i);
     const pts=sampled(u=>{
       const wave=sin(u*Math.PI), spread=e.editorial.weights.spread;
       return [90+820*u+35*sin(TAU*u)*v,
        440+v*430*spread+115*sin(TAU*u+h.phase*.18)+wave*(35*sin(u*TAU*2+v*3)+v*180)
        +sin(u*TAU*t.holdings+q*TAU)*wave*6];
     },240);
     all.push(path(pts,s.key,colors[k],.4+.22*q));
   }offset+=share;
 });
 // Public seal hash, not its hidden contents, locates the fine cross-grain.
 const sealPhase=seed(t.publicSeal.sha256)*TAU, gap=clamp(t.elapsedSeconds/600,0,1)*e.editorial.weights.readGap;
 for(let i=0;i<64;i++){
   const digit=parseInt(t.publicSeal.sha256[i],16),x=150+i*10.8;
   all.push(path(sampled(u=>[x+sin(u*TAU+sealPhase)*22,300+u*300+(digit-7.5)*4],80),s.key,'#a99b8e',.09+gap*.1,'seal-grain'));
 }
 // The failed read is an interruption of the image, NOT a zero balance.
 const mid=.4+seed(s.excerptSha256)*.18, half=.01+gap*.07;
 const split=all.flatMap(p=>{
  if(p.role!=='structure')return[p];
  const left=p.points.filter((_,i)=>i/240<mid-half),right=p.points.filter((_,i)=>i/240>mid+half),trace=p.points.filter((_,i)=>Math.abs(i/240-mid)<=half);
  return [path(trace,p.source,p.color,.1,'unread-trace'),path(left,p.source,p.color,p.opacity),path(right,p.source,p.color,p.opacity)];
 });
 return [...split,...echo(split.filter(p=>p.role==='structure'),s)];
}
export function contours(e){if(e.generator!==VERSION)throw Error('Wrong generator');const fn={interruption,address,holdings}[e.family];if(!fn)throw Error('Unknown family');return fn(e);}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function svg(e,{plotter=false}={}){
 const paths=contours(e);const groups=new Map();for(const p of paths){const key=p.source+'|'+p.role+'|'+p.color;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 1000 900" width="${plotter?'250mm':'1000'}" height="${plotter?'225mm':'900'}"><title>${esc(e.title)}</title><desc>Margin. Drawn ${esc(e.drawnAt)}. Edition ${e.edition}. Source observations through ${esc(e.sourceCutoff)}. ${VERSION}.</desc>${plotter?'':'<rect width="1000" height="900" fill="#171516"/>'}${[...groups].map(([key,ps],i)=>`<g id="layer-${i}" inkscape:groupmode="layer" inkscape:label="${esc(key)}" fill="none" stroke="${ps[0].color}" stroke-width="${plotter?'.75':'.85'}" stroke-linecap="round">${ps.map(p=>`<path opacity="${plotter?'1':p.opacity.toFixed(3)}" d="${p.points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(3)+' '+y.toFixed(3)).join(' ')}"/>`).join('')}</g>`).join('')}</svg>\n`;
}
