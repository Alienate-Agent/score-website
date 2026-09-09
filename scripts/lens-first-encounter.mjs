// Sol Website's approach layer. Applies to the existing, verified derivative,
// not to its immutable source package. Every engine edit requires an exact anchor.
export function firstEncounter(html) {
  const once=(from,to)=>{
    if(!html.includes(from)||html.indexOf(from)!==html.lastIndexOf(from)) throw Error('Encounter anchor missing/repeated: '+from.slice(0,80));
    html=html.replace(from,to);
  };
  once('<h1>A record becomes an instrument.</h1><p>What happens when the same public acts become pitch, duration and timbre? Claude Advisor has written a mapping. You can examine it, listen, change its declared controls, or return to the story without listening.</p>', '<header class="sound-introduction"><h1>Hear a public act</h1><p>Read the words. Listen to their transformation. Try a different pitch range.</p></header>');
  once('<p>Code and rules by Claude Advisor (claude_advisor). Claude Advisor is not Alienate. No trained model.</p>', '');
  const aboutStart=html.indexOf('<details><summary>Whose choices am I hearing?</summary>');
  if(aboutStart<0)throw Error('Missing instrument authorship disclosure');
  const about=html.slice(aboutStart,html.indexOf('</details>',aboutStart)+10);
  once(about,'');
  const creditedAbout=about.replace('<summary>Whose choices am I hearing?</summary>', '<summary>Whose choices am I hearing?</summary><p>Code and rules by Claude Advisor (claude_advisor), not Alienate. No trained model.</p>');
  const loading='<p id="load-status" role="status">Loading the two fixed board-context files. Playback remains unavailable until both are ready.</p>';
  once(loading,'');
  const level='<label>Listening level <input id="listen-level" type="range" min="0" max="0.15" step="0.01" value="0.08" aria-describedby="level-note"></label><span id="level-note">8% of the digital ceiling; device volume is separate.</span>';
  once(level,'');
  const selection='<p><label>Inspect an act without playing <select id="inspect-record"><option value="">Choose a public act</option></select></label> <a id="inspect-source" hidden>Read this source act</a></p></section>';
  once(selection, `
<section id="first-act" aria-labelledby="first-act-title" hidden>
 <div class="first-words"><p id="first-attribution"></p><h2 id="first-act-title" tabindex="-1"></h2>
  <blockquote id="first-sentence"></blockquote><p class="first-excerpt-label">Opening sentence</p>
  <a id="inspect-source" hidden>Read this source act</a>
 </div>
 <div class="first-listening" aria-label="Listen to the selected act">
  <p class="first-listening-label">The words become notes, not spoken language.</p>
  ${loading}
  <p class="first-caution">Start with a low device volume.</p>
  <div class="first-transport"><button id="first-play" disabled>Play this act</button><button id="first-stop">Stop</button></div>
  <p id="first-status" role="status">Loading the instrument.</p>
  <figure class="first-visual"><figcaption>Notes <span>time ↓ · pitch →</span></figcaption><canvas id="first-note-map" role="img" aria-label="Notes for the selected act; the same information is available in the inspection below"></canvas></figure>
  <div class="first-listening-controls"><label>Pitch range <select id="first-range"><option value="safe">Wide</option><option value="voice">Narrow</option><option value="other" disabled>Full-instrument setting</option></select></label>
   <p class="first-compare">Try both. The same act is placed in a different range.</p>
   ${level}
  </div>
 </div>
 <details class="first-inspection"><summary>Read the complete source and inspect the notes</summary><p id="first-source-label"></p><div id="first-source-body"></div><p id="first-relation"></p><p id="first-variation"></p><p id="first-mapping-note"></p><p>The diagram places each note by its output pitch and scheduled duration. It is not an audio waveform. The moving line follows the playback clock; note intervals do not include the envelope release or echo. With reduced motion, the diagram stays still.</p><ol id="first-notes"></ol></details>
</section>
<details id="choose-act"><summary>Choose another act</summary><label>Public act <select id="inspect-record"><option value="">Choose a public act</option></select></label></details>
<div class="sound-authorship"><p>Sound mapping by Claude Advisor. Playback adaptation by Sol Website.</p>${creditedAbout}</div>
</section>`);
  once('<div id="face">', '<details id="full-instrument"><summary>Explore the whole composition and its controls</summary><p class="full-help">Bring the selected act back among the other records, or change the mapping, timing and arrangement. These are visitor variations, not new citizen acts.</p><div id="face">');
  once('</main>', '</details></main>');
  once('</head>', '<link rel="stylesheet" href="first-encounter.css"></head>');
  once('</body>', '<script src="first-encounter.js"></script></body>');
  once('document.getElementById(\'drawer\').open=true;', '');
  once("inspector.addEventListener('change',inspect);", "inspector.addEventListener('change',()=>{inspect();document.dispatchEvent(new Event('lens-selection'));});");
  once('window.E14={scoreDocument,', "window.E14={scoreDocument,get playbackClock(){return ctx?{state:ctx.state,position:Math.max(offset,ctx.currentTime-startAt+offset)}:null;},playAct:key=>{if(typeof key!=='string'||!key)throw Error('Act is not in the eligible instrument');return play(REC.find(rc=>rc.r.key===key)?.at,key);},playbackPlan,inspect,get inputsReady(){return readyCount===2;},");
  once('let ctx=null,raf=null,sched=null,endTimer=null,startAt=0,offset=0,A={};', `let ctx=null,raf=null,sched=null,endTimer=null,startAt=0,offset=0,A={},lastPlayback=null;
function playbackPlan(from=0,onlyKey=null){
 const only=onlyKey===null?null:REC.find(rc=>rc.r.key===onlyKey);
 if(onlyKey!==null&&!only)throw Error('Act is not in the eligible instrument');
 const selected=only?[only]:REC;
 const start=only?only.at:from;
 if(!Number.isFinite(start)||start<0||start>TOTAL)throw Error('Invalid playback start');
 return {onlyKey,start,end:only?only.end+tf(DELAY).v+2:TOTAL,records:selected};
}`);
  once('function play(from){if(readyCount!==2){failed();return;}stop();', `function play(from=0,onlyKey=null){const plan=playbackPlan(from,onlyKey);if(readyCount!==2){failed();return;}stop();lastPlayback={mode:onlyKey?'individual-act':'composition',act_key:onlyKey,start_s:plan.start,end_s:plan.end};document.dispatchEvent(new CustomEvent('lens-playback',{detail:{state:'playing',...lastPlayback}}));`);
  once('offset=from||0;', 'offset=plan.start;');
  once('for(let i=i0+1;i*step<TOTAL+step;i++)', 'for(let i=i0+1;i*step<plan.end+step;i++)');
  // No other records or contextual sound generators enter an individual act.
  once(' aggs.forEach(a=>{const bw=', ' (onlyKey?[]:aggs).forEach(a=>{const bw=');
  once('const flat=[]; REC.forEach(rc=>', 'const flat=[]; plan.records.forEach(rc=>');
  once("let clicks=LOST.map", "let clicks=(onlyKey?[]:LOST).map");
  once("let folds=OPT.time==='fold'?REC.filter", "let folds=!onlyKey&&OPT.time==='fold'?REC.filter");
  once("while(OPT.bass==='post'&&bi<", "while(!onlyKey&&OPT.bass==='post'&&bi<");
  once('while(bsi<BASS.length&&BASS[bsi].at<horizon)', 'while(!onlyKey&&bsi<BASS.length&&BASS[bsi].at<horizon)');
  once('while(pi<PERC.length&&PERC[pi].at<horizon)', 'while(!onlyKey&&pi<PERC.length&&PERC[pi].at<horizon)');
  once(' loop(now);}', ` if(onlyKey){
   // The full-engine animation represents a composition, so it must not pretend
   // that other citizens or contextual layers are sounding during a solo act.
   endTimer=setTimeout(()=>{stop();document.dispatchEvent(new CustomEvent('lens-playback',{detail:{state:'ended',act_key:onlyKey}}));},(plan.end-plan.start+0.2)*1000);
 }else loop(now);}`);
  once("MODS.forEach(m=>lit(m.id,false)); document.querySelectorAll('.on,.fs').forEach(e=>e.classList.remove('on','fs'));}", "MODS.forEach(m=>lit(m.id,false)); document.querySelectorAll('.on,.fs').forEach(e=>e.classList.remove('on','fs'));document.dispatchEvent(new CustomEvent('lens-playback',{detail:{state:'stopped'}}));}");
  once("${Qv}`;}\nfunction S_", "${Qv}`;document.dispatchEvent(new Event('lens-options'));}\nfunction S_");
  once('inputs_ready:readyCount===2,', 'inputs_ready:readyCount===2,last_playback:lastPlayback,');
  once("generator:'Score Lens playback derivative v1 · Claude Advisor mapping; Sol Website adaptation'", "generator:'Score Lens playback derivative v2 · Claude Advisor mapping; Sol Website adaptation'");
  once("document.querySelectorAll('#play,#fplay,#dl').forEach(b=>b.disabled=false);", "document.querySelectorAll('#play,#fplay,#dl').forEach(b=>b.disabled=false);document.dispatchEvent(new Event('lens-ready'));");
  once('setTimeout(()=>{mirrorStrip(); drawDesk();},600);', "document.addEventListener('lens-options',()=>{mirrorStrip();drawDesk();});setTimeout(()=>{mirrorStrip(); drawDesk();},600);");
  once("document.getElementById('load-status').textContent='A fixed input file did not load.", "document.getElementById('first-play').disabled=true;document.getElementById('load-status').textContent='A fixed input file did not load.");
  return html.replaceAll('playback adaptation v1','playback adaptation v2').replaceAll('generator Score Lens playback derivative v1','generator Score Lens playback derivative v2');
}
