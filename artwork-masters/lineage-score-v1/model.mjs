// Composition layer. Call with frozen source-model paths; no global reseeding.
export const VERSION='lineage-score/1';
export const PLACEMENT=Object.freeze({base:{x:.78,y:.84,tx:165,ty:72},motif:{left:46,top:95,width:118,height:710}});
export function inheritedPaths(rootPaths,lineage){
 const selected=rootPaths.filter(p=>p.source===lineage.selection.source&&lineage.selection.roles.includes(p.role));
 if(!selected.length)throw Error('No source paths for inherited motif');
 const count=Math.min(selected.length,lineage.selection.maxPaths),picked=Array.from({length:count},(_,i)=>selected[Math.round(i*(selected.length-1)/Math.max(1,count-1))]);
 // A horizontal question becomes an upright memory; the ballot stays upright.
 const oriented=picked.map(p=>({...p,points:p.points.map(([x,y])=>lineage.rootId==='who-owes'?[y,x]:[x,y])}));
 const xs=oriented.flatMap(p=>p.points.map(x=>x[0])),ys=oriented.flatMap(p=>p.points.map(x=>x[1]));
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),b=PLACEMENT.motif;
 return oriented.map(p=>({...p,role:'inherited-source',originalRole:p.role,motifKey:lineage.motifKey,strokeWidth:1.35,opacity:.85,
  points:p.points.map(([x,y])=>[b.left+(x-minX)/(maxX-minX||1)*b.width,b.top+(y-minY)/(maxY-minY||1)*b.height])}));
}
export function compose(basePaths,rootPaths,lineage,entryId){
 const base=basePaths.filter(p=>!(entryId===lineage.rootId&&p.source===lineage.sourceKey&&(lineage.selection.roles.includes(p.role)||p.role==='votes-grain')));
 const b=PLACEMENT.base;
 return [...base.map(p=>({...p,points:p.points.map(([x,y])=>[x*b.x+b.tx,y*b.y+b.ty])})),...inheritedPaths(rootPaths,lineage)];
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function svg(paths,title,{plotter=false,drawnAt}={}){
 const groups=new Map();for(const p of paths){const key=p.source+'|'+p.role+'|'+p.color;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 1000 900" width="${plotter?'250mm':'1000'}" height="${plotter?'225mm':'900'}"><title>${esc(title)}</title><desc>Margin. ${VERSION}. Drawn ${drawnAt}. Operator-directed composition study of frozen source observations.</desc>${plotter?'':'<rect width="1000" height="900" fill="#171516"/>'}${[...groups].map(([key,ps],i)=>`<g id="layer-${i}" inkscape:groupmode="layer" inkscape:label="${esc(key)}" fill="none" stroke="${ps[0].color}" stroke-linecap="round">${ps.map(p=>`<path stroke-width="${p.strokeWidth??.85}" opacity="${plotter?1:p.opacity.toFixed(3)}" d="${p.points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(3)+' '+y.toFixed(3)).join(' ')}"/>`).join('')}</g>`).join('')}</svg>\n`;
}
