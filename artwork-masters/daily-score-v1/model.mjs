// daily-score/1. Editorial accounts are inputs, not impersonated board speech.
import {createHash} from 'node:crypto';
export const sha = value => createHash('sha256').update(value).digest('hex');
const unit = value => parseInt(sha(value).slice(0,8),16)/0xffffffff;
export function layers(input){
 const family=unit('daily-family/1|'+input.family), out=[];
 input.sources.forEach((s,i)=>{
  const key=s.key+'|'+s.textSha256+'|'+input.evidence.map(x=>x.sha256).join('|');
  const seed=unit(key), count=Math.max(12,Math.min(64,s.wordCount));
  const phase=unit('scene/1|'+s.sceneId)*Math.PI*2;
  const color=['#ed96cf','#66d0cc','#d7c395','#ffc08e'][i%4];
  const paths=[];
  for(let j=0;j<count;j++){
   const points=[];
   for(let k=0;k<=100;k++){
    const t=k/100, bend=Math.sin(t*Math.PI), wave=Math.sin(t*Math.PI*(2+Math.floor(seed*4))+phase);
    let x,y;
    if(input.form==='address'){
     const side=i%2?1:-1;
     x=500+side*(350-300*t)+wave*bend*42;
     y=190+i*100+j*3.6+t*(180+family*130)+bend*(j-count/2)*3;
    }else if(input.form==='threshold'){
     x=110+t*780;
     y=210+i*95+j*3.5+wave*bend*(30+seed*90);
     if(t>.43&&t<.48){if(points.length>1)paths.push(points.join(' '));points.length=0;continue;}
    }else{
     x=110+t*780;
     y=340+j*2+(i-(input.sources.length-1)/2)*70*Math.pow(t,1.2)+wave*bend*100+Math.sin(phase)*55;
    }
    // Common source frame; no geometry is clipped out of the plotter area.
    y=Math.max(70,Math.min(830,y));
    points.push(`${points.length?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`);
   }
   if(points.length>1)paths.push(points.join(' '));
  }
  out.push({key:s.key,color,paths});
 });
 // The family spine has identical coordinates across dates in the same story.
 const paths=[];
 for(let j=0;j<9;j++){let d='';for(let k=0;k<=100;k++){const t=k/100;d+=`${k?'L':'M'}${(100+800*t).toFixed(2)},${(730+j*4+Math.sin(t*Math.PI*(2+family*3))*35).toFixed(2)} `;}paths.push(d);}
 out.push({key:'family',color:'#c6bca5',paths});return out;
}
export function svg(input,plotter=false,only=null){return `<svg xmlns="http://www.w3.org/2000/svg" width="${plotter?'250mm':'1000'}" height="${plotter?'225mm':'900'}" viewBox="0 0 1000 900">${plotter?'':'<rect width="1000" height="900" fill="#171516"/>'}${layers(input).filter(l=>only===null||l.key===only).map((l,i)=>`<g id="pen-${i+1}" fill="none" stroke="${l.color}" stroke-width="${plotter?'.8':'1.15'}" opacity="${plotter?'1':'.62'}">${l.paths.map(d=>`<path d="${d}"/>`).join('')}</g>`).join('')}</svg>`;}
