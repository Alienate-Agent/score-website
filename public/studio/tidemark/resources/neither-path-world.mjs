export function initial(){return {place:'threshold',arrangement:0,visitor:1,footprints:[],history:[]};}
export function actions(s){return s.place==='outside'?['arrive']:['walk_to_chair','walk_to_door','sweep','sit','leave','wait'];}
export function step(s,a){
  if(!actions(s).includes(a))throw new Error('Unavailable action: '+a);
  if(a==='wait')return structuredClone(s);
  const n=structuredClone(s);
  n.history.push({visitor:s.visitor,action:a,arrangement:s.arrangement});
  if(a==='sweep')n.arrangement=(n.arrangement+1)%3;
  if(a==='walk_to_chair'||a==='walk_to_door'){
    n.place=a==='walk_to_chair'?'chair':'door';
    n.footprints.push({visitor:s.visitor,to:n.place,arrangement:s.arrangement});
  }
  if(a==='sit')n.place='seated';
  if(a==='leave')n.place='outside';
  if(a==='arrive'){n.place='threshold';n.visitor++;}
  return n;
}
export function observe(s){return {place:s.place,visitor:s.visitor,arrangement:s.arrangement,paths:['chair','door'],warmth:{chair:'equal',door:'equal'},footprints:s.footprints.length,actions:actions(s)};}
