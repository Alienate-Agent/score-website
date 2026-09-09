/* Margin · Processing-family sketch. A visual reading of the selected note,
   never another sound source. p5 is pinned and served alongside this file. */
(() => {
  const host=document.getElementById('patch-field');
  if(!host||!window.p5||!window.scorePatchVisual)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,lastKey='',previous=null,trace=null,traceAt=0;
  let painter=null;
  const hash=text=>Array.from(text||'').reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619)>>>0,2166136261);
  function synchronize(){
    if(!painter)return;
    const s=window.scorePatchVisual();
    if(visible&&!document.hidden&&s.playing&&!reduced.matches)painter.loop();
    else{painter.noLoop();painter.redraw();}
  }
  const sketch=new p5(p=>{
    p.setup=()=>{
      const canvas=p.createCanvas(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight));
      canvas.elt.setAttribute('aria-hidden','true');
      p.pixelDensity(Math.min(2,devicePixelRatio||1));p.frameRate(30);p.noFill();p.noLoop();
      painter=p;host.dataset.renderer='p5.js 1.11.11';
    };
    function strands(s,opacity,isTrace=false){
      const note=s.note;if(!note)return;
      const pitch=Math.max(0,Math.min(1,Math.log(note.output_hz/60)/Math.log(4000/60)));
      const count=Math.round(16+pitch*25),weave=1+(hash(note.text)%7)/7;
      const motion=!isTrace&&s.playing&&!s.reduced;
      const phase=motion?(s.position-note.t_s)*Math.PI*2:0;
      const signal=motion?s.signal:null;
      const amplitude=motion?Math.min(1,Math.sqrt(s.peak)*3):0;
      const tint=p.color(s.color);tint.setAlpha(opacity);
      p.stroke(tint);p.strokeWeight(isTrace ? .65 : .9);
      for(let strand=0;strand<count;strand++){
        const lane=(strand/(count-1)-.5)*2;
        p.beginShape();
        for(let step=0;step<=80;step++){
          const x=step/80,arch=Math.sin(x*Math.PI);
          const envelope=Math.pow(arch,.7);
          const sample=signal?.[Math.min(127,Math.floor(x*127))]||0;
          const folded=Math.sin(x*Math.PI*weave+lane*1.8+phase*.4);
          const wave=sample/Math.max(.02,s.peak)*amplitude;
          const y=p.height*.5 + envelope*(lane*p.height*(.17+pitch*.16)
            +folded*p.height*.055 + wave*p.height*.085*Math.cos(lane*2));
          p.vertex(8+x*(p.width-16),y);
        }
        p.endShape();
      }
    }
    p.draw=()=>{
      p.clear();const s=window.scorePatchVisual();
      if(!s.note)return;
      const key=s.act+':'+s.noteIndex+':'+s.note.output_hz;
      if(key!==lastKey){
        trace=s.playing&&!s.reduced&&previous?previous:null;traceAt=s.position;
        lastKey=key;previous={...s,note:{...s.note},signal:null};
      }
      if(trace&&s.playing&&!s.reduced){
        const remaining=1-(s.position-traceAt)/1.2;
        if(remaining>0)strands(trace,remaining*42,true);else trace=null;
      }else trace=null;
      strands(s,s.playing&&!s.reduced?90+Math.min(60,s.peak*300):80);
      host.dataset.mode=s.reduced?'reduced-motion':s.playing?'measured-response':'still';
      host.dataset.note=String(s.noteIndex);host.dataset.hz=String(s.note.output_hz);
      host.dataset.frames=String((Number(host.dataset.frames)||0)+1);
    };
  },host);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;synchronize();});
  observer.observe(host);
  const resize=new ResizeObserver(()=>{
    if(!painter)return;
    painter.resizeCanvas(Math.max(1,host.clientWidth),Math.max(1,host.clientHeight),true);
    synchronize();
  });resize.observe(host);
  for(const event of ['lens-playback','lens-selection','lens-patch','lens-ready','lens-options','patch-visual-change'])
    document.addEventListener(event,()=>requestAnimationFrame(synchronize));
  document.addEventListener('visibilitychange',synchronize);
  reduced.addEventListener('change',synchronize);
  window.addEventListener('pagehide',()=>{sketch.noLoop();});
  window.addEventListener('pageshow',synchronize);
})();
