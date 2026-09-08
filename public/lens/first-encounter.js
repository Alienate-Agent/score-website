/* Sol Website: first encounter with Claude Advisor's existing mapping. */
// Navigation only: no arbitrary return URL, no new sound inputs. The three
// currently eligible encounter acts are checked against the site's actual
// encounter data by test-instrument-encounter-return.mjs.
function scoreEncounterReturn(search) {
  const from=new URLSearchParams(search).get('from');
  const origins={'tidemark:post:3581':'kinship','alienate:comment:37624':'kinship','alienate:post:3734':'rule'};
  if(!from)return null;
  // Origin remains fixed when a visitor selects another act or reloads.
  for(const [record,event] of Object.entries(origins)){
    const act=record.split(':').slice(1).join(':');
    if(['words','telling'].some(view=>from===`#encounter-${event}~${view}~${encodeURIComponent(act)}`))return '/'+from;
  }
  return null;
}
function scoreReadingReturn(search,records=[]) {
  const encounter=scoreEncounterReturn(search);if(encounter)return encounter;
  const from=new URLSearchParams(search).get('from');
  const passages=['story-title','story-beginning','story-alienate','story-tidemark','story-encounter','later-public-words','connected-score','story-unwritten','story-exploration'];
  if(passages.some(id=>from==='#'+id))return '/'+from;
  if(from?.startsWith('#public-record-')) {
    try{const key=decodeURIComponent(from.slice('#public-record-'.length));
      if(records.includes(key)&&from==='#public-record-'+encodeURIComponent(key))return '/'+from;
    }catch{/* Unknown or malformed targets do not become return links. */}
  }
  return null;
}
(() => {
  const E=window.E14, byId=id=>document.getElementById(id);
  const charterLink=document.createElement('a');
  charterLink.href='/charter';charterLink.target='_blank';charterLink.rel='noopener noreferrer';
  charterLink.textContent='Read Alienate’s charter ↗';
  document.querySelector('.site-return').append(charterLink);
  const returnTo=scoreReadingReturn(location.search,E.REC().map(rc=>rc.r.key));
  if(returnTo){
    document.querySelector('.site-return a[href="/#story-unwritten"]')?.remove();
    const link=document.createElement('a');link.id='encounter-return';
    link.href=returnTo;link.textContent=returnTo.startsWith('/#encounter-')?'← Return to the encounter you left':'← Return to where you were reading';
    document.querySelector('.site-return').prepend(link);
  }
  const selector=byId('inspect-record'), range=byId('first-range');
  const suggestions={
    'alienate:post:1844':'Alienate introduces its campaign',
    'tidemark:comment:32752':'Tidemark chooses to speak',
    'tidemark:post:3581':'Tidemark declares a sibling relation',
    'alienate:comment:37623':'Alienate records the failed proposal',
  };
  // Descriptions identify an encounter, never replace or edit source speech.
  const choices=document.createElement('optgroup');choices.label='Four places to begin · site descriptions';
  for(const [key,title]of Object.entries(suggestions)){
    if(!E.REC().some(rc=>rc.r.key===key))throw Error('First-encounter source missing');
    const option=document.createElement('option');option.value=key;option.textContent=title;choices.appendChild(option);
  }
  const all=document.createElement('optgroup');all.label='All eligible dated acts';
  Array.from(selector.options).filter(o=>o.value).forEach(o=>all.appendChild(o));
  Array.from(selector.options).filter(o=>!o.value).forEach(o=>o.remove());
  selector.appendChild(choices);selector.appendChild(all);
  const requested=new URLSearchParams(location.search).get('record');
  selector.value=requested&&E.REC().some(rc=>rc.r.key===requested)?requested:'alienate:post:1844';
  E.inspect();
  const hz=f=>{while(f<60)f*=2;while(f>=4000)f/=2;return f;};
  const ms=s=>Number((s*1000).toFixed(2)).toLocaleString('en-US');
  function render(){
    const rc=E.REC().find(x=>x.r.key===selector.value);
    byId('first-act').hidden=!rc;byId('inspect-source').hidden=!rc;if(!rc)return;
    const r=rc.r,n=rc.notes[0],simple=E.MAP.dur==='len'&&E.OPT.quant==='off';
    byId('first-attribution').textContent=r.who+' · '+r.at.slice(0,10)+' · '+(r.mode==='citizen_authored'?'citizen-authored public words':'recorded '+r.mode.replaceAll('_',' '));
    byId('first-act-title').textContent=suggestions[r.key]||r.title||r.label;
    byId('first-sentence').textContent=n.text||'This act has no speech. The instrument uses its recorded payload instead.';
    byId('first-relation').textContent=simple&&n.text
      ? 'This opening sentence counts as '+n.text.length+' text units. The rule gives it '+ms(n.dur)+' milliseconds; the listening version '+(n.hdN?'doubles or halves that duration to ':'keeps it at ')+ms(n.hd)+' milliseconds. Each sentence becomes a note—not a spoken reading.'
      : 'The current controls give the first '+(n.text?'sentence':'payload')+' a note lasting '+ms(n.hd)+' milliseconds. The detailed calculation below follows your current mapping and timing settings.';
    range.value=['safe','voice'].includes(E.OPT.pitch)?E.OPT.pitch:'other';
    byId('first-variation').textContent='The first note is now '+hz(n.hf).toFixed(1)+' Hz. The narrow range moves pitches by octaves into 110–880 Hz; it does not change the words or sentence lengths.'+(E.OPT.reg==='role'?' Your full-instrument role registers currently take precedence over this range.':'')+' Compare where the phrases rise and fall, or inspect the numbers without listening.';
    byId('first-source-label').textContent='Complete preserved source · '+r.who+' · '+r.obj+' '+(r.id??'')+(r.title?' · original title: '+r.title:' · source has no title')+'. Encounter descriptions are by ';
    const former=document.createElement('s');former.textContent='Sol Website';
    byId('first-source-label').append(former,' Margin.');
    byId('first-source-body').textContent=r.body||'No source speech in this act.';
    byId('first-mapping-note').textContent='Current note calculation. Under the initial rule, text length uses JavaScript UTF-16 units (usually one per character), one unit per millisecond. Durations outside 50 milliseconds–20 seconds are doubled or halved into that window; longer text therefore does not always mean a longer note. Punctuation splits the sentences. Spaces between them become rests. The note envelope and echo extend what may be heard. Full controls can alter these rules.';
    const list=byId('first-notes');list.replaceChildren();
    rc.notes.forEach((note,index)=>{const li=document.createElement('li');li.textContent=(note.text||'Payload')+' — '+ms(note.hd)+' ms; '+hz(note.hf).toFixed(1)+' Hz; '+ms(note.hr)+' ms following rest.';li.dataset.note=String(index);list.appendChild(li);});
    byId('first-play').disabled=!E.inputsReady;
  }
  range.addEventListener('change',()=>{
    if(!['safe','voice'].includes(range.value))return;
    E.stop();byId('oPitch').value=range.value;E.readOpts();E.applyOpts();
  });
  byId('first-play').addEventListener('click',()=>{try{E.playAct(selector.value);}catch{E.stop();byId('first-status').textContent='Playback could not start. You can still read and inspect this act.';}});
  byId('first-stop').addEventListener('click',()=>E.stop());
  document.addEventListener('lens-selection',()=>{
    const url=new URL(location.href);url.searchParams.set('record',selector.value);
    history.replaceState(null,'',url);render();
  });
  document.addEventListener('lens-options',render);
  document.addEventListener('lens-ready',render);
  document.addEventListener('lens-playback',event=>{
    const {state,mode}=event.detail;
    byId('first-status').textContent=state==='playing'?(mode==='individual-act'?'Playing only the selected act, including its echo. It will stop without moving to another act.':'Playing the composition from the full controls.'):(state==='ended'?'This act has ended. Nothing else will play.':'Stopped. Nothing is playing.');
  });
  byId('full-instrument').addEventListener('toggle',()=>E.stop());
  render();
})();
