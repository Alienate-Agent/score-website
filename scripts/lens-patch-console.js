/* Margin's front-panel instrument. Existing source fields and sound rules;
   direct manipulation, reversible visitor choices, real playback feedback. */
(() => {
  const E=window.E14,$=id=>document.getElementById(id),consoleEl=$('patch-console');
  if(!consoleEl)return;
  const sourceNames={id:'Record ID',post_id:'Thread ID',hour:'Time of day',len:'Text length',first:'First byte',cid:'Citizen number',day:'Day',cap:'Daily limit'};
  const destNames={pitch:'Base pitch',spitch:'Sentence pitch',dur:'Note length',gain:'Level',pan:'Pan'};
  const selector=$('inspect-record'),bay=$('patch-bay'),canvas=$('patch-cables');
  const ports=[...bay.querySelectorAll('.patch-jack')],reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const returnTo=scoreReadingReturn(location.search,E.REC().map(rc=>rc.r.key));
  if(returnTo){$('encounter-return').href=returnTo;const label=returnTo.startsWith('/#encounter-')?'Return to exchange':'Return to story';$('encounter-return').querySelector('span').textContent=label;$('encounter-return').setAttribute('aria-label',label);}
  const snapshot=()=>({mapping:{...E.MAP},options:{pitch:E.OPT.pitch,quant:E.OPT.quant,temper:E.OPT.temper,reg:E.OPT.reg}});
  const original={mapping:{...E.MAPDEF},options:{pitch:'safe',quant:'off',temper:'off',reg:'off'}};
  const undo=[];
  let draft=snapshot(),changing=false,queued=false,selection=null,lifted=null,drag=null,suppressClick=false,hover=null;
  let notes=[],plan=null,playing=false,lastIndex=-2,lastCycle=0,frame=0,rc=null;
  let measuredSignal=new Float32Array(128),measuredPeak=0;
  // Read-only presentation state; this sketch cannot feed the sound engine.
  window.scorePatchVisual=()=>({
    playing, reduced:reduced.matches, position:E.playbackClock?.position??0,
    note:notes[Math.max(0,lastIndex)]??null, noteIndex:Math.max(0,lastIndex),
    act:selector.value, signal:measuredSignal, peak:measuredPeak, color:color()
  });
  const plug=new Image();plug.src='patch-plug.png';plug.onload=()=>drawCables();
  const storageKey='score:patch-console:v1';
  // The embedded margin reader keeps its earlier listening behavior. These
  // transport choices belong to the visible patch bay, not the source mapping.
  if(window.self===window.top)E.setSoloTransport({loop:false,echo:false});
  const handles=[];
  for(const dest of Object.keys(destNames))for(const end of ['src','dest']){
    const button=document.createElement('button');button.className='patch-plug-handle';
    button.dataset.cable=dest;button.dataset.end=end;bay.append(button);handles.push(button);
  }
  function save(){try{sessionStorage.setItem(storageKey,JSON.stringify(draft));}catch{/* The instrument works without browser storage. */}}
  function message(text){$('patch-route').textContent=text;}
  function paintContext(canvasElement){
    const width=canvasElement.clientWidth,height=canvasElement.clientHeight,dpr=devicePixelRatio||1;
    if(!width||!height)return null;
    if(canvasElement.width!==Math.round(width*dpr)||canvasElement.height!==Math.round(height*dpr)){canvasElement.width=Math.round(width*dpr);canvasElement.height=Math.round(height*dpr);}
    const g=canvasElement.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,width,height);
    return {g,width,height};
  }
  const color=()=>getComputedStyle(consoleEl).getPropertyValue('--signal').trim();
  function point(port){const a=port.querySelector('img').getBoundingClientRect(),b=bay.getBoundingClientRect();return {x:a.left+a.width/2-b.left,y:a.top+a.height/2-b.top};}
  function portFor(kind,key){return ports.find(p=>p.dataset[kind]===key);}
  function cablePoint(dest,end){
    if(end==='dest')return point(portFor('dest',dest));
    const src=draft.mapping[dest],p=point(portFor('src',src));
    const siblings=Object.keys(draft.mapping).filter(d=>draft.mapping[d]===src),i=siblings.indexOf(dest);
    return {x:p.x+i*32,y:p.y+i*9};
  }
  function info(port){return port.dataset.src?{kind:'src',key:port.dataset.src}:{kind:'dest',key:port.dataset.dest};}
  function plugAt(g,p,left){
    if(!plug.complete||!plug.naturalWidth)return;
    g.save();g.translate(p.x,p.y);if(!left)g.scale(-1,1);
    g.drawImage(plug,98,480,1060,308,-2,-8,47,14);g.restore();
  }
  function cable(g,a,b,active=false,lift=false,pulse=0){
    const span=b.x-a.x,sag=Math.min(64,Math.abs(span)*.1);
    const sx=a.x+32,ex=b.x-32;
    function path(){g.beginPath();g.moveTo(sx,a.y);g.bezierCurveTo(sx+span*.32,a.y+sag,ex-span*.32,b.y+sag,ex,b.y);}
    g.lineCap='round';g.lineWidth=9;g.strokeStyle='#060707';path();g.stroke();
    g.lineWidth=5;g.strokeStyle=active?color():'#62676c';path();g.stroke();
    g.lineWidth=1;g.strokeStyle=active?'#c9ffff':'#a9adb0';path();g.stroke();
    if(pulse>0&&!reduced.matches){g.lineWidth=7;g.globalAlpha=pulse*.45;g.strokeStyle=color();path();g.stroke();g.globalAlpha=1;}
    plugAt(g,a,true);plugAt(g,b,false);
    if(lift){const end=lift==='src'?a:b;g.strokeStyle=color();g.setLineDash([4,4]);g.lineWidth=1;g.beginPath();g.arc(end.x,end.y,25,0,Math.PI*2);g.stroke();g.setLineDash([]);}
  }
  function drawCables(pulse=0){
    const ctx=paintContext(canvas);if(!ctx)return;const {g}=ctx;
    for(const [dest,src]of Object.entries(draft.mapping)){
      const aPort=portFor('src',src),bPort=portFor('dest',dest);if(!aPort||!bPort)continue;
      if(drag?.moved&&drag.cable===dest)continue;
      const active=lifted?.cable===dest||selection&&(selection.kind==='src'?src===selection.key:dest===selection.key);
      g.globalAlpha=drag?.moved ? .28 : 1;
      const a=cablePoint(dest,'src'),b=cablePoint(dest,'dest'),socket=point(aPort);
      if(a.x!==socket.x){g.strokeStyle='#62676c';g.lineWidth=3;g.beginPath();g.moveTo(socket.x,socket.y);g.lineTo(a.x,a.y);g.stroke();}
      cable(g,a,b,active,false,pulse);g.globalAlpha=1;
    }
    if(drag?.moved){
      const fixed=drag.cable?cablePoint(drag.cable,drag.anchor.kind):point(portFor(drag.anchor.kind,drag.anchor.key));
      const moving=hover?point(hover):drag.point;
      if(drag.anchor.kind==='src')cable(g,fixed,moving,true,'dest');
      else cable(g,moving,fixed,true,'src');
    }
    for(const h of handles){const p=cablePoint(h.dataset.cable,h.dataset.end);h.style.left=(p.x+(h.dataset.end==='src'?22:-22)-16)+'px';h.style.top=(p.y-16)+'px';}
  }
  function renderPorts(){
    ports.forEach(p=>{
      const i=info(p),active=selection?.kind===i.kind&&selection.key===i.key;
      p.classList.toggle('selected',!!active);p.classList.toggle('compatible',p===hover);
      p.setAttribute('aria-pressed',String(!!active));
      if(i.kind==='dest')p.setAttribute('aria-label',destNames[i.key]+', connected to '+sourceNames[draft.mapping[i.key]]+'. Select to reconnect.');
    });
    $('patch-undo').disabled=undo.length===0;
    handles.forEach(h=>{
      const dest=h.dataset.cable,end=h.dataset.end;
      h.setAttribute('aria-label','Move '+destNames[dest]+' cable '+(end==='src'?'source':'destination')+' end, '+sourceNames[draft.mapping[dest]]+' to '+destNames[dest]);
      h.setAttribute('aria-pressed',String(lifted?.cable===dest&&lifted.end===end));
    });
    drawCables();
  }
  function commit(next,label,remember=true){
    if(JSON.stringify(next)===JSON.stringify(draft)){selection=null;lifted=null;renderPorts();return;}
    if(remember){undo.push(structuredClone(draft));if(undo.length>40)undo.shift();}
    draft=structuredClone(next);selection=null;lifted=null;changing=true;
    try{queued=E.requestPatch(draft)==='queued';save();message(label+(queued?' · next sentence':''));}
    catch{draft=snapshot();message('That connection could not be made.');}
    finally{changing=false;renderPorts();renderControls();renderNotes();}
  }
  function connect(a,b){
    if(a.kind===b.kind)return;
    const src=a.kind==='src'?a.key:b.key,dest=a.kind==='dest'?a.key:b.key;
    commit({...draft,mapping:{...draft.mapping,[dest]:src}},sourceNames[src]+' → '+destNames[dest]);
  }
  function nearest(x,y,kind){
    let best=null,dist=44;
    for(const p of ports){if(!p.dataset[kind])continue;const box=p.querySelector('img').getBoundingClientRect(),d=Math.hypot(x-box.x-box.width/2,y-box.y-box.height/2);if(d<dist){dist=d;best=p;}}
    return best;
  }
  function relocate(cableEnd,target){
    if(cableEnd.end!==target.kind)return;
    const dest=cableEnd.cable,mapping={...draft.mapping};
    if(target.kind==='src')mapping[dest]=target.key;
    else [mapping[dest],mapping[target.key]]=[mapping[target.key],mapping[dest]];
    commit({...draft,mapping},target.kind==='src'?sourceNames[target.key]+' → '+destNames[dest]:'Swapped '+destNames[dest]+' ↔ '+destNames[target.key]);
  }
  function startDrag(e,port,cableEnd=null){
    if(e.button!==0)return;
    const anchor=cableEnd?{kind:cableEnd.end==='src'?'dest':'src',key:cableEnd.end==='src'?cableEnd.cable:draft.mapping[cableEnd.cable]}:info(port);
    drag={anchor,cable:cableEnd?.cable,end:cableEnd?.end,start:{x:e.clientX,y:e.clientY},point:cableEnd?cablePoint(cableEnd.cable,cableEnd.end):point(port),moved:false,pointer:e.pointerId};
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveDrag(e){
    if(!drag||e.pointerId!==drag.pointer)return;
    if(Math.hypot(e.clientX-drag.start.x,e.clientY-drag.start.y)>5)drag.moved=true;
    if(!drag.moved)return;
    bay.classList.add('is-patching');
    const box=bay.getBoundingClientRect();drag.point={x:e.clientX-box.x,y:e.clientY-box.y};
    hover=nearest(e.clientX,e.clientY,drag.end||(drag.anchor.kind==='src'?'dest':'src'));
    lifted=drag.cable?{cable:drag.cable,end:drag.end}:null;selection=drag.anchor;renderPorts();
    message(hover?drag.end==='dest'?'Release to swap with '+destNames[hover.dataset.dest]:sourceNames[hover.dataset.src||drag.anchor.key]+' → '+destNames[drag.cable||hover.dataset.dest]:'Move to a '+(drag.end==='src'?'source':'sound')+' socket · Esc cancels');
  }
  function endDrag(e){
    if(!drag||e.pointerId!==drag.pointer)return;
    const old=drag,target=nearest(e.clientX,e.clientY,old.end||(old.anchor.kind==='src'?'dest':'src'));drag=null;hover=null;bay.classList.remove('is-patching');
    if(old.moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);if(target){if(old.cable)relocate({cable:old.cable,end:old.end},info(target));else connect(old.anchor,info(target));}else{selection=null;lifted=null;message('Connection unchanged.');}renderPorts();}
  }
  function cancelDrag(event){
    if(drag?.moved&&event?.type!=='pointercancel'){
      // Escape cancels before the held pointer is released. Do not let that
      // later release produce a fresh click which silently picks the plug up.
      suppressClick=true;document.addEventListener('pointerup',()=>setTimeout(()=>{suppressClick=false;},0),{once:true});
    }
    drag=null;hover=null;selection=null;lifted=null;bay.classList.remove('is-patching');renderPorts();message('Connection unchanged.');
  }
  handles.forEach(h=>{
    h.addEventListener('pointerdown',e=>startDrag(e,null,{cable:h.dataset.cable,end:h.dataset.end}));
    h.addEventListener('pointermove',moveDrag);h.addEventListener('pointerup',endDrag);h.addEventListener('pointercancel',cancelDrag);
    h.addEventListener('click',e=>{if(suppressClick&&e.detail!==0)return;selection=null;lifted=lifted?.cable===h.dataset.cable&&lifted.end===h.dataset.end?null:{cable:h.dataset.cable,end:h.dataset.end};message(lifted?'Choose a '+(lifted.end==='src'?'source':'sound')+' socket':'Connection unchanged.');renderPorts();});
  });
  ports.forEach(port=>{
    port.addEventListener('pointerdown',e=>{
      const i=info(port),connections=Object.keys(draft.mapping).filter(d=>i.kind==='dest'?d===i.key:draft.mapping[d]===i.key);
      startDrag(e,port,connections.length===1?{cable:connections[0],end:i.kind}:null);
    });
    port.addEventListener('pointermove',moveDrag);port.addEventListener('pointerup',endDrag);port.addEventListener('pointercancel',cancelDrag);
    port.addEventListener('click',e=>{
      if(suppressClick&&e.detail!==0)return;const i=info(port);
      if(lifted){if(lifted.end===i.kind)relocate(lifted,i);else message('Choose a socket on the same side as the lifted plug.');return;}
      if(selection&&selection.kind!==i.kind)connect(selection,i);
      else{selection=selection?.key===i.key&&selection.kind===i.kind?null:i;message(selection?(i.kind==='src'?sourceNames[i.key]+' → choose a sound input':destNames[i.key]+' ← choose a source'):'Move either plug. Hear the change.');}
      renderPorts();
    });
  });
  $('patch-undo').onclick=()=>{if(!undo.length)return;commit(undo.pop(),'Undone',false);};
  $('patch-original').onclick=()=>commit(original,'Original connections');
  function renderTransport(){
    const state=E.soloTransport;
    $('patch-loop').setAttribute('aria-pressed',String(state.loop));
    $('patch-echo').setAttribute('aria-pressed',String(state.echo));
  }
  $('patch-loop').onclick=()=>E.setSoloTransport({loop:!E.soloTransport.loop});
  $('patch-echo').onclick=()=>E.setSoloTransport({echo:!E.soloTransport.echo});
  document.addEventListener('lens-transport',()=>{renderTransport();if(!playing)$('first-status').textContent=E.soloTransport.loop?'Loop armed · press Play':'Ready when you are.';});
  function changeOption(key,value,label){
    const options={...draft.options,[key]:value};if(key==='pitch')options.reg='off';
    commit({...draft,options},label);
  }
  $('first-range').onchange=e=>changeOption('pitch',e.target.value,e.target.selectedOptions[0].textContent+' pitch range');
  $('patch-rhythm').oninput=e=>{const i=Number(e.target.value);changeOption('quant',['off','onsets','all'][i],['Free timing','Starts on the grid','Starts and lengths on the grid'][i]);};
  function rotary(id,read,set){
    const el=$(id);let start=null;
    el.addEventListener('pointerdown',e=>{if(e.button!==0)return;start={y:e.clientY,value:read()};el.setPointerCapture(e.pointerId);el.focus();});
    el.addEventListener('pointermove',e=>{if(!start)return;const v=Math.max(0,Math.min(1,Math.round(start.value+(start.y-e.clientY)/48)));if(v!==read())set(v);});
    el.addEventListener('pointerup',()=>{start=null;});
    el.addEventListener('pointercancel',()=>{start=null;});
    el.addEventListener('keydown',e=>{
      if(!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Home','End','Enter',' '].includes(e.key))return;e.preventDefault();
      const v=e.key==='Home'?0:e.key==='End'?1:e.key==='Enter'||e.key===' '?1-read():Math.max(0,Math.min(1,read()+(['ArrowUp','ArrowRight'].includes(e.key)?1:-1)));set(v);
    });
  }
  rotary('patch-range',()=>draft.options.pitch==='voice'?1:0,v=>changeOption('pitch',v?'voice':'safe',v?'Narrow pitch range':'Wide pitch range'));
  rotary('patch-tuning',()=>draft.options.temper==='et12'?1:0,v=>changeOption('temper',v?'et12':'off',v?'Equal-tempered tuning':'Unsnapped tuning'));
  function renderControls(){
    const narrow=draft.options.pitch==='voice',tuned=draft.options.temper==='et12';
    $('first-range').value=narrow?'voice':'safe';
    for(const [id,on,text]of [['patch-range',narrow,narrow?'Narrow':'Wide'],['patch-tuning',tuned,tuned?'12 equal steps':'Unsnapped']]){
      $(id).setAttribute('aria-valuenow',on?'1':'0');$(id).setAttribute('aria-valuetext',text);$(id).style.setProperty('--turn',on?'45deg':'-45deg');
    }
    $('patch-tuning-value').textContent=tuned?'12 equal steps':'Unsnapped';
    const rhythm=Math.max(0,['off','onsets','all'].indexOf(draft.options.quant));
    $('patch-rhythm').value=String(rhythm);$('patch-rhythm').setAttribute('aria-valuetext',['Free','Starts','Starts + lengths'][rhythm]);$('patch-rhythm-value').textContent=['Free','Starts','All'][rhythm];
  }
  $('listen-level').addEventListener('input',e=>{$('patch-level').textContent=Math.round(Number(e.target.value)*100)+'%';});
  function recordNotes(){
    const performance=E.patchPerformance;
    if(performance?.act_key===selector.value){notes=performance.notes;plan={start:performance.start_s,end:performance.end_s};if(lastCycle!==performance.cycle){lastCycle=performance.cycle;lastIndex=-2;}return;}
    rc=E.REC().find(x=>x.r.key===selector.value);if(!rc)return;
    const fold=f=>{while(f<60)f*=2;while(f>=4000)f/=2;return f;};
    notes=rc.notes.map(n=>({text:n.text||null,t_s:n.t,duration_s:n.hd,output_hz:fold(n.hf),glide_output_hz:n.hglide?fold(n.hglide):null}));
    plan=E.playbackPlan(0,selector.value);
  }
  function renderNotes(position=null){
    if(!plan)return;const ctx=paintContext($('first-note-map'));if(!ctx)return;
    const {g,width:w,height:h}=ctx,end=Math.max(plan.start+.01,...notes.map(n=>n.t_s+n.duration_s));
    const x=t=>12+(t-plan.start)/(end-plan.start)*(w-24),y=f=>h-30-Math.log(f/60)/Math.log(4000/60)*(h-48);
    g.strokeStyle='#30353a';g.lineWidth=1;g.font='10px monospace';g.fillStyle='#a5aab1';
    for(let i=0;i<=6;i++){const px=12+i/6*(w-24);g.beginPath();g.moveTo(px,8);g.lineTo(px,h-24);g.stroke();g.fillText(((end-plan.start)*i/6).toFixed(1)+'s',Math.min(w-26,Math.max(0,px-7)),h-6);}
    notes.forEach(n=>{const active=position!==null&&position>=n.t_s&&position<n.t_s+n.duration_s;
      g.strokeStyle=active?color():'#747b83';g.lineWidth=active?7:5;g.beginPath();g.moveTo(x(n.t_s),y(n.output_hz));g.lineTo(Math.max(x(n.t_s)+2,x(n.t_s+n.duration_s)),y(n.glide_output_hz||n.output_hz));g.stroke();
    });
    if(position!==null&&position>=plan.start&&position<=end){g.strokeStyle=color();g.lineWidth=1;g.beginPath();g.moveTo(x(position),0);g.lineTo(x(position),h-24);g.stroke();}
    $('first-note-map').dataset.position=position===null?'static':String(position);
    $('first-note-map').dataset.noteCount=String(notes.length);
  }
  function drawOutput(){
    const ctx=paintContext($('patch-wave')),meter=paintContext($('patch-meter'));if(!ctx||!meter)return;
    const {g,width:w,height:h}=ctx,an=E.outputMeters;
    const channels=['left','right'].map(name=>{
      const bytes=new Uint8Array(1024);bytes.fill(128);
      if(an?.[name]&&!reduced.matches)an[name].getByteTimeDomainData(bytes);
      return [...bytes].map(v=>(v-128)/128);
    });
    let peak=0,sum=0;for(const samples of channels)for(const v of samples){peak=Math.max(peak,Math.abs(v));sum+=v*v;}
    measuredPeak=peak;
    measuredSignal=Float32Array.from({length:128},(_,i)=>(channels[0][i*8]+channels[1][i*8])/2);
    const gain=1/Math.max(.02,peak);
    channels.forEach((samples,row)=>{
      const center=h*(row ? .73 : .27);g.strokeStyle=peak>0?color():'#41474d';g.lineWidth=1;
      g.beginPath();for(let i=0;i<samples.length;i++){const xx=22+i/(samples.length-1)*(w-24),yy=center-samples[i]*gain*h*.18;if(i===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.stroke();
      g.font='11px monospace';g.fillStyle='#b9bcc1';g.fillText(row?'R':'L',0,center+4);
    });
    $('patch-wave').dataset.peak=String(peak);$('patch-wave').dataset.mode=reduced.matches?'reduced-motion':playing?'measured-output':'silent';
    const db=sum?20*Math.log10(Math.sqrt(sum/2048)):-80,level=Math.max(0,Math.min(1,(db+60)/60));
    for(let i=0;i<20;i++){meter.g.fillStyle=i/20<level?color():'#34383d';meter.g.fillRect(i*meter.width/20,0,Math.max(1,meter.width/20-3),meter.height);}
  }
  function sentence(index,active){
    if(index===lastIndex&&$('first-sentence').classList.contains('is-sounding')===active)return;
    lastIndex=index;const n=notes[Math.max(0,index)];
    $('first-sentence').textContent=n?.text||'No source speech · recorded payload';
    $('first-sentence').scrollTop=0;
    $('first-sentence').classList.toggle('is-sounding',active);
    $('first-note-index').textContent=(index<0?'Ready':active?'Sentence':'Rest after sentence')+' '+(Math.max(0,index)+1)+' / '+notes.length;
    $('first-sentence').dataset.noteIndex=String(Math.max(0,index));
    document.dispatchEvent(new Event('patch-visual-change'));
  }
  function tick(){
    cancelAnimationFrame(frame);frame=0;
    const clock=E.playbackClock;
    if(playing&&clock?.state==='running'){
      recordNotes();
      let i=-1;for(let k=0;k<notes.length;k++)if(notes[k].t_s<=clock.position)i=k;
      const active=i>=0&&clock.position<notes[i].t_s+notes[i].duration_s;
      sentence(i,active);renderNotes(reduced.matches?null:clock.position);drawOutput();
      const echoTail=clock.position>plan.end;
      $('first-status').textContent=echoTail?(E.soloTransport.echo?'Echo tail':'Releasing'):E.soloTransport.loop?'Loop '+lastCycle:lastCycle>1?'Final pass '+lastCycle:'Playing once';
      const pulse=active?Math.max(0,1-(clock.position-notes[i].t_s)/.18):0;
      if(!drag)drawCables(pulse);
      frame=requestAnimationFrame(tick);
    }else{renderNotes();drawOutput();}
  }
  function renderSource(){
    rc=E.REC().find(x=>x.r.key===selector.value);if(!rc)return;
    const r=rc.r;consoleEl.style.setProperty('--signal',r.who==='Tidemark'?'#00ffff':r.who==='Alienate'?'#ff00ff':'#fffffe');
    $('first-act').dataset.speaker=r.who.toLowerCase();
    $('first-attribution').textContent=r.who+' · '+r.obj+' '+(r.id??'');
    $('source-bank-title').textContent='SOURCE ('+r.who.toUpperCase()+')';
    $('first-act-title').textContent=r.title||r.label;
    $('inspect-source').href='/#public-record-'+encodeURIComponent(r.key);
    $('first-source-label').textContent=r.who+' · '+r.at.slice(0,10);
    $('first-source-body').textContent=r.body||'No source speech in this act.';
    recordNotes();lastIndex=-2;sentence(-1,false);
    const list=$('first-notes');list.replaceChildren();
    for(const n of notes){const li=document.createElement('li');li.textContent=(n.text||'Payload')+' — '+(n.duration_s*1000).toFixed(1)+' ms · '+n.output_hz.toFixed(1)+' Hz';list.append(li);}
    $('patch-mapping-list').replaceChildren();
    for(const [dest,src]of Object.entries(draft.mapping)){const p=document.createElement('p');p.textContent=sourceNames[src]+' → '+destNames[dest];$('patch-mapping-list').append(p);}
    $('first-play').disabled=!E.inputsReady;$('load-status').hidden=E.inputsReady;
    renderControls();renderTransport();renderPorts();renderNotes();drawOutput();
    $('first-note-map').setAttribute('aria-label',notes.length+' notes for '+r.who+'. Time runs left to right; pitch runs upward. Inspect for exact source and notes.');
  }
  $('first-play').onclick=()=>{try{E.playAct(selector.value);recordNotes();playing=true;tick();}catch{E.stop();$('first-status').textContent='Playback unavailable. Inspect remains available.';}};
  $('first-stop').onclick=()=>E.stop();
  document.addEventListener('lens-selection',()=>{
    const url=new URL(location.href);url.searchParams.set('record',selector.value);history.replaceState(null,'',url);
    selection=null;lifted=null;renderSource();$('first-status').textContent='Ready when you are.';
  });
  document.addEventListener('lens-ready',()=>{renderSource();$('first-status').textContent='Ready when you are.';});
  document.addEventListener('lens-options',()=>{if(!changing&&!queued){draft=snapshot();save();}renderSource();});
  document.addEventListener('lens-patch',e=>{
    if(e.detail.state==='queued'){queued=true;return;}
    queued=false;draft=snapshot();save();recordNotes();renderControls();renderPorts();renderNotes();
    if(e.detail.when==='next-note')$('first-status').textContent='Repatched · continuing';
  });
  document.addEventListener('lens-playback',e=>{
    playing=e.detail.state==='playing'&&e.detail.mode==='individual-act';
    if(!playing){cancelAnimationFrame(frame);frame=0;sentence(lastIndex,false);drawCables();drawOutput();renderNotes();}
    $('first-status').textContent=e.detail.state==='playing'?(playing?'Playing':'Full composition playing'):e.detail.state==='ended'?'Ended · play again':'Stopped';
    if(playing)setTimeout(()=>{recordNotes();tick();},0);
  });
  const dialog=$('patch-inspection');
  $('patch-inspect').onclick=()=>{renderSource();dialog.showModal();$('patch-inspection-close').focus();};
  $('patch-inspection-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>$('patch-inspect').focus());
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&(selection||lifted||drag)){e.preventDefault();e.stopImmediatePropagation();cancelDrag();}
    else if(e.key==='Escape'&&dialog.open){e.preventDefault();e.stopImmediatePropagation();dialog.close();}
    else if(e.key===' '&&!dialog.open&&!['INPUT','BUTTON','SELECT','TEXTAREA','A'].includes(document.activeElement?.tagName)&&document.activeElement?.getAttribute('role')!=='slider'){e.preventDefault();if(playing)E.stop();else $('first-play').click();}
  },true);
  $('full-instrument').addEventListener('toggle',()=>E.stop());
  const resize=new ResizeObserver(()=>{drawCables();renderNotes();drawOutput();});
  [bay,$('first-note-map'),$('patch-wave')].forEach(el=>resize.observe(el));
  reduced.addEventListener('change',()=>{renderNotes();drawOutput();drawCables();});
  try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved){E.requestPatch(saved);draft=snapshot();}}catch{/* Ignore unsupported saved settings; engine defaults remain. */}
  const requested=new URLSearchParams(location.search).get('record');
  selector.value=requested&&E.REC().some(x=>x.r.key===requested)?requested:'tidemark:post:3581';
  E.inspect();renderSource();
})();
