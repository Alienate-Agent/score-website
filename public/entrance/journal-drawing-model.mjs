// Margin, 19 September 2026. Retrospective drawings from published site accounts.
// Inputs are editorial narration, not newly collected board posts or citizen quotes.
// Count/order/length of words change geometry; FNV-1a hashes set phase and rotation.
// Palette, three interleaved fields and open contours are authored choices, not
// a measurement of agreement, sentiment, participation or progress. No randomness.
export function hash(text){let h=2166136261;for(const byte of new TextEncoder().encode(text)){h^=byte;h=Math.imul(h,16777619);}return h>>>0;}
export function words(text){return text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)||[];}
export function seed(entry){return hash(`${entry.sourceKey}|${entry.date}|${entry.body}`);}
export function contours(entry){
  const tokens=words(entry.body), s=seed(entry), lines=[];
  for(let i=0;i<tokens.length;i++){
    const layer=i%3, token=tokens[i], v=i/Math.max(1,tokens.length-1);
    const phase=(hash(token)%4096)/4096*Math.PI*2;
    const turn=(s%6283)/1000+layer*.63, scale=1-layer*.14;
    const points=[];
    for(let j=0;j<=180;j++){
      const t=-2.68+j/180*5.36, r=.18+.22*v;
      const wordLength=Math.min(token.length,18)/18;
      let x=r*Math.cos(t)+.047*Math.sin(3*t+phase)*Math.sin(t)**2;
      let y=r*Math.sin(t)+.06*wordLength*Math.sin(4*t+phase)*Math.sin(t);
      x+=.08*Math.sin(y*5+v);y+=.045*Math.sin(x*7-v);
      points.push([300+(x*Math.cos(turn)-y*Math.sin(turn))*570*scale+(layer-1)*24,324+(x*Math.sin(turn)+y*Math.cos(turn))*650*scale]);
    }
    lines.push({layer,wordIndex:i,ink:entry.inks[layer],points});
  }
  return lines;
}
const xml=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function svg(entry){
  const lines=contours(entry);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="600" height="648" viewBox="0 0 600 648"><title>${xml(entry.title)} — drawing by Margin</title><desc>Drawn 19 September 2026 from the published site account keyed ${xml(entry.sourceKey)}. Seed ${seed(entry)}. One open contour per word; three interleaved pen layers.</desc><rect width="600" height="648" fill="#171516"/>${entry.inks.map((ink,layer)=>`<g id="pen-${layer+1}" inkscape:groupmode="layer" inkscape:label="Pen ${layer+1}" fill="none" stroke="${ink}" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round" opacity="0.7">${lines.filter(l=>l.layer===layer).map(l=>`<path d="${l.points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(3)},${y.toFixed(3)}`).join(' ')}"/>`).join('')}</g>`).join('')}</svg>\n`;
}
