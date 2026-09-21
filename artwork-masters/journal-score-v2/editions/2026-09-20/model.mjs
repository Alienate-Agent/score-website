import {createHash} from 'node:crypto';
export const VERSION='journal-score/2';
export const sha=s=>createHash('sha256').update(s).digest('hex');
export const seed=s=>parseInt(sha(s).slice(0,8),16)/0x100000000;
export const words=s=>s.trim().split(/\s+/u).filter(Boolean);
const TAU=Math.PI*2, sin=Math.sin, cos=Math.cos;
export function hand(speaker){const s=seed('speaker/v1|'+speaker.toLowerCase());return {phase:s*TAU,frequency:2+Math.floor(s*4),slant:(s-.5)*.55,color:({alienate:'#ed96cf',tidemark:'#66d0cc',episteme:'#ffc08e'})[speaker.toLowerCase()]??'#d7c395'};}
const path=(points,source,color,opacity=.55,role='structure')=>({points,source,color,opacity,role});
const line=(fn,n=180)=>Array.from({length:n+1},(_,i)=>fn(i/n));
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
function fingerprint(s){return `${s.key}|${s.occurredAt}|${s.excerptSha256}`;}
function refusal(e){
 const [c,p]=e.sources,h=hand(c.speaker),all=[],f=e.facts;
 if(f.reportedDraftCharacters===null||f.reportedCapCharacters===null)throw Error('No reported character constraint');
 const excess=(f.reportedDraftCharacters-f.reportedCapCharacters)/f.reportedCapCharacters;
 const gap=45+limit(excess*e.editorial.weights.overflowAmplification,0,.3)*440;
 const seam=430+seed(fingerprint(c))*65, ws=words(c.excerpt);
 for(let i=0;i<Math.min(100,ws.length);i++){
  const q=seed(fingerprint(c)+'|'+ws[i]+'|'+i),v=i/Math.max(1,Math.min(100,ws.length)-1);
  all.push(path(line(u=>[90+(seam-90)*u,450+(v-.5)*(330-210*u)+sin(u*TAU+h.phase)*80+sin(u*TAU*3+q*TAU)*10*sin(Math.PI*u)]),c.key,h.color,.28+.34*q,'reported-refusal'));
 }
 // The refused draft has no selected body. Nothing crosses its gap.
 f.options.forEach((o,k)=>{
  const ws=words(o.text),n=Math.min(56,ws.length);
  for(let i=0;i<n;i++){
   const v=i/Math.max(1,n-1)-.5,q=seed(p.key+'|'+p.occurredAt+'|'+o.sha256+'|'+i);
   all.push(path(line(u=>[seam+gap+(900-seam-gap)*u,
    450+sin(Math.PI*u)*(v*92+sin(u*TAU+h.phase+q)*22)+(k-2)*132*u*e.editorial.weights.branchSpread+v*34+sin(u*Math.PI)*q*25]),p.key,k%2?'#efd9b5':h.color,.28+.27*q,'unselected-alternative'));
  }
 });return all;
}
function quorum(e){
 const s=e.sources[0],h=hand(s.speaker),f=e.facts,all=[];
 if(!Number.isInteger(f.requiredParticipants)||f.requiredParticipants<1||f.requiredParticipants>100)throw Error('Unsupported participation floor');
 if(f.observedParticipants===null)throw Error('Observed participation unavailable');
 const span=Date.parse(f.secondRead)-Date.parse(f.firstRead), before=(Date.parse(f.close)-Date.parse(f.firstRead))/span;
 const seam=.2+before*.55, gap=e.editorial.weights.blindGap, n=f.requiredParticipants;
 for(let k=0;k<n;k++)for(let j=0;j<5;j++){
  const q=seed(fingerprint(s)+'|'+k+'|'+j),slot=k/Math.max(1,n-1),active=k<f.observedParticipants;
  const pts=line(u=>[140+660*slot+(j-2)*3+sin(Math.PI*u)*(sin(u*TAU+h.phase)*65+(slot-.5)*155)+sin(u*TAU*h.frequency+q*TAU)*7,
   110+680*u+sin(Math.PI*u)*sin(slot*TAU)*30]);
  for(const segment of [pts.filter((_,i)=>i/180<seam-gap/2),pts.filter((_,i)=>i/180>seam+gap/2)])all.push(path(segment,s.key,active?h.color:'#e5d4b0',active?.7:e.editorial.weights.guideOpacity,active?'observed-participation':'threshold-guide'));
 }return all;
}
function position(e,view){
 const s=e.sources[0],h=hand(s.speaker),all=[],colors=[h.color,'#efdbb7','#eba9af'];
 e.passages.slice(0,view+1).forEach((p,k)=>{
  const ws=words(p.excerpt),n=Math.min(110,ws.length*2);
  for(let i=0;i<n;i++){
   const v=i/Math.max(1,n-1)-.5,q=seed(s.key+'|'+s.occurredAt+'|'+p.sha256+'|'+i),wave=u=>sin(Math.PI*u);
   const fn=k===0?u=>[390+v*200+sin(u*TAU+h.phase)*125*wave(u)+sin(u*TAU*h.frequency+q*TAU)*wave(u)*12,90+710*u+v*38]:
    k===1?u=>[310+510*u*e.editorial.weights.opening+v*75*wave(u),570-300*sin(u*Math.PI*.8)+v*170*wave(u)+sin(u*TAU+h.phase)*25]:
    u=>[745-145*sin(Math.PI*u)*e.editorial.weights.boundary+v*100*wave(u),145+610*u+sin(u*TAU+h.phase+q)*38*wave(u)];
   all.push(path(line(fn),s.key,colors[k],.3+.25*q,['room-question','qualified-support','stated-limits'][k]));
  }
 });return all;
}
export function contours(e,view=2){
 if(e.generator!==VERSION)throw Error('Wrong generator');
 let all=({'refusal-and-refiling':refusal,'participation-floor':quorum,'qualified-position':position}[e.family])(e,view);
 // Captured karma adds capped texture only; never changes base geometry.
 const echoes=e.sources.flatMap(s=>{
  if(s.votes===null||s.votes.value===0)return[];
  const g=Math.log1p(Math.min(100,Math.abs(s.votes.value)))/Math.log(101);
  return all.filter(p=>p.source===s.key&&p.role!=='threshold-guide').filter((_,i)=>i%7===0).map((p,i)=>path(p.points.map(([x,y],j)=>[x+sin(j*.17+i)*2*g,y]),s.key,p.color,.13*g,'votes-grain'));
 });return [...all,...echoes];
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function svg(e,{plotter=false,view=2}={}){
 const paths=contours(e,view),groups=new Map();for(const p of paths){const key=p.source+'|'+p.role+'|'+p.color;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 1000 900" width="${plotter?'250mm':'1000'}" height="${plotter?'225mm':'900'}"><title>${esc(e.title)}</title><desc>Margin. Drawn ${e.drawnAt}. ${VERSION}. Edition ${e.edition}; view ${view}. Source cutoff ${e.sourceCutoff}.</desc>${plotter?'':'<rect width="1000" height="900" fill="#171516"/>'}${[...groups].map(([key,ps],i)=>`<g id="layer-${i}" inkscape:groupmode="layer" inkscape:label="${esc(key)}" fill="none" stroke="${ps[0].color}" stroke-width=".85" stroke-linecap="round">${ps.map(p=>`<path opacity="${plotter?'1':p.opacity.toFixed(3)}" d="${p.points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(3)+' '+y.toFixed(3)).join(' ')}"/>`).join('')}</g>`).join('')}</svg>\n`;
}
