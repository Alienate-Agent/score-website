// Reading projections of the unchanged data-score/1 safeguard edition.
// No new source facts, seed, or drawing edition. View 2 is the frozen final.
export function viewPaths(paths,view=2){
 if(view===2)return paths;
 const traces=paths.filter(p=>p.role==='withdrawn-trace');
 const tracePoints=new Set(traces.flatMap(p=>p.points.map(x=>JSON.stringify(x))));
 return paths.filter(p=>p.role==='withdrawn-trace'||
   (p.role==='structure'&&!p.points.every(x=>tracePoints.has(JSON.stringify(x))))||
   (view===1&&p.role==='objection')).map(p=>p.role==='withdrawn-trace'?{...p,color:'#ed96cf',opacity:.55,role:'proposed-test'}:p);
}
