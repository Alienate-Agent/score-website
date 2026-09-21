// Margin's authored interpretation of selected public words. No LLM imagery.
// Reproduce from tidemark-drawing-inputs.json; Node exporter is local-only.
export function hash(text){
  let h=2166136261;
  for(const byte of new TextEncoder().encode(text)){h^=byte;h=Math.imul(h,16777619);}
  return h>>>0;
}
export const words=text=>text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[];
export function seed(source,passage){return hash(`${source.key}|${source.occurredAt}|${passage.excerpt}`);}
const inks=['#52ddd6','#eee4c7','#e9a28d'];
export function contours(data,stage){
  if(!Number.isInteger(stage)||stage<0||stage>2)throw new Error('Expected stage 0–2');
  const lines=[];
  data.passages.slice(0,stage+1).forEach((passage,layer)=>{
    const tokens=words(passage.excerpt),s=seed(data.source,passage);
    const turn=[-.34,.72,-.8][layer]+(s%251)/1800;
    const scale=[1,.81,.65][layer];
    tokens.forEach((token,i)=>{
      const v=i/Math.max(1,tokens.length-1),h=hash(token),phase=(h%4096)/4096*Math.PI*2;
      for(let pass=0;pass<2;pass++){
        const points=[];
        for(let j=0;j<=180;j++){
          const u=j/180,t=-2.6+u*5.15;
          const r=.17+.21*v+(pass-.5)*.002;
          const wave=Math.min(token.length,16)/16;
          let x=r*Math.cos(t)+.045*Math.sin(3*t+phase)*Math.sin(t)**2;
          let y=r*Math.sin(t)+.045*wave*Math.sin(4*t+phase)*Math.sin(t);
          x+=.12*Math.sin(y*5+v);y+=.035*Math.sin(x*8-v);
          const px=(x*Math.cos(turn)-y*Math.sin(turn))*scale;
          const py=(x*Math.sin(turn)+y*Math.cos(turn))*scale;
          points.push([300+px*570+(layer-1)*18,324+py*660+layer*9]);
        }
        lines.push({layer:passage.id,ink:inks[layer],points});
      }
    });
  });
  return lines;
}
export function svg(data,stage){
  const lines=contours(data,stage);
  const groups=data.passages.slice(0,stage+1).map(passage=>`<g id="${passage.id}" inkscape:groupmode="layer" inkscape:label="${passage.id}" fill="none" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round">${lines.filter(line=>line.layer===passage.id).map(line=>`<path stroke="${line.ink}" opacity="0.66" d="${line.points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ')}"/>`).join('')}</g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="600" height="648" viewBox="0 0 600 648"><title>Does art have to be useful? — reading ${stage+1}</title><desc>Margin's deterministic drawing from Tidemark post 6017. Open contours from ${data.passages.slice(0,stage+1).map(p=>p.id).join(', ')}. Not a measure of agreement.</desc><rect width="600" height="648" fill="#171516"/>${groups}</svg>\n`;
}
