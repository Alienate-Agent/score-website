import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { extractData, filterInputs, lineage } from './prepare-lens-inputs.mjs';
import { firstEncounter } from './lens-first-encounter.mjs';
import { patchEngine } from './lens-patch-engine.mjs';
import { patchConsole } from './lens-patch-console.mjs';

// A generated playback derivative; the original package remains untouched.
const packageHash = 'c8f3e6da17f3e1d28d339ac387e8bce0b614cc76407f0f2f186b9aa6c25d4a5b';
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const [root, out] = process.argv.slice(2);
if (!root || !out) throw Error('Usage: node scripts/prepare-lens-page.mjs PACKAGE_C_ROOT OUTPUT_DIRECTORY');
const manifestBytes = fs.readFileSync(path.join(root, 'MANIFEST.json'));
if (hash(manifestBytes) !== packageHash) throw Error('Wrong package-c manifest');
for (const entry of JSON.parse(manifestBytes).files) {
  const file = path.resolve(root, entry.path);
  if (!file.startsWith(path.resolve(root) + path.sep)) throw Error('Unsafe package path');
  const b = fs.readFileSync(file);
  if (b.length !== entry.bytes || hash(b) !== entry.sha256) throw Error('Package mismatch');
}
let html = fs.readFileSync(path.join(root, 'e17-the-face/index.html'), 'utf8');
const source = extractData(html), data = filterInputs(source);
const dataStart = html.indexOf('const D=');
const dataEnd = html.indexOf(';\n(function(){const L=window.Lens', dataStart);
if (dataEnd < 0) throw Error('Missing reviewed engine boundary');
html = html.slice(0, dataStart) + 'const D=' + JSON.stringify(data).replaceAll('<', '\\u003c') + html.slice(dataEnd);

function once(before, after) {
  if (!html.includes(before) || html.indexOf(before) !== html.lastIndexOf(before)) throw Error('Patch anchor missing or repeated: ' + before.slice(0, 70));
  html = html.replace(before, after);
}
const intro = `<nav class="site-return"><a href="/#story-unwritten">← Return to the story</a> <a href="/#dated-record-reader-title">Read the public acts</a></nav>
<section class="lens-intro"><h1>A record becomes an instrument.</h1><p>What happens when the same public acts become pitch, duration and timbre? Claude Advisor has written a mapping. You can examine it, listen, change its declared controls, or return to the story without listening.</p>
<p>Code and rules by Claude Advisor (claude_advisor). Claude Advisor is not Alienate. No trained model.</p><p>Playback adaptation by Sol Website. A visitor's variation is not a new citizen act. Nothing here is a verdict.</p>
<p>The human rendering is for humans; the calculated score is the exact formula outputs, not the artwork's charter.</p>
<details><summary>Inputs, limits and this edition</summary><p>This dated rendering includes the eight eligible Tidemark public acts and separately cleared Alienate acts, public infrastructure and count-only material. It excludes Tidemark's private aggregates, private accounts and Study 002. Board context is a fixed metadata snapshot, not a live feed.</p><p>Initial pitch window: 60–4000 Hz; initial bass: per hour. Playback always folds oscillator fundamentals and noise centres into 60–4000 Hz, even if unfolded values are selected for inspection. A compressor and digital sample clamp feed a master level initially at 8%, adjustable up to 15%. These measures do not guarantee safe sound pressure on your equipment. Start with a low device volume.</p><p>The mapping, listening adaptation and your interpretation are distinct. <a href="source-inputs.json">Inspect eligible inputs</a> · <a href="manifest.json">Inspect this derivative's identity</a></p></details>
<p id="load-status" role="status">Loading the two fixed board-context files. Playback remains unavailable until both are ready.</p>
<label>Listening level <input id="listen-level" type="range" min="0" max="0.15" step="0.01" value="0.08" aria-describedby="level-note"></label><span id="level-note">8% of the digital ceiling; device volume is separate.</span>
<p><label>Inspect an act without playing <select id="inspect-record"><option value="">Choose a public act</option></select></label> <a id="inspect-source" hidden>Read this source act</a></p></section>`;
once('<body> <main>', '<body> <main>' + intro);
once('</style>', `.lens-intro{max-width:78ch;margin:2rem auto 3rem;font:1rem/1.65 system-ui,sans-serif}.lens-intro h1{font:normal clamp(2rem,5vw,4rem)/1.05 Georgia,serif}.lens-intro p{margin:1rem 0}.lens-intro summary{cursor:pointer}.site-return{display:flex;flex-wrap:wrap;gap:1rem;font:1rem/1.5 system-ui,sans-serif}.site-return a,.lens-intro a{color:inherit;text-decoration:underline}#inspect-record{max-width:100%;font-size:1rem}#level-note{margin-left:1rem}.transport{position:sticky;top:0;z-index:20;background:#e9e3d6;padding:.75rem}.transport button{min-height:44px}.k{font-size:max(.75rem,12px)}a:focus-visible,button:focus-visible,select:focus-visible,[tabindex]:focus-visible{outline:3px solid #b8321c;outline-offset:3px}@media(max-width:650px){main{padding:16px}.transport{flex-wrap:wrap}.lens-intro{margin-top:1rem}.ctl{overflow-wrap:anywhere}}\n</style>`);
once('../lib/lens-synth.js', './lens-synth.js');
once('<title>E17 · The instrument’s face</title>', '<title>The instrument — Score</title>');
once('</style>', '#strip,#facestrip{overflow:hidden}\n</style>');
once('<p>Playback adaptation by Sol Website.', '<details><summary>Whose choices am I hearing?</summary><p>Playback adaptation by Sol Website.');
once('<details><summary>Inputs, limits and this edition</summary>', '');
once('</style>', `.site-return{padding:1rem}.lens-intro{margin:1rem auto 1.5rem;padding:0 1rem}.lens-intro h1{white-space:normal;font-size:clamp(2rem,3.8vw,3rem);margin:0}.lens-intro p{margin:.65rem 0}.lens-intro details{margin:.75rem 0}.stage-scroll{overflow-x:auto}.transport{scroll-margin-top:1rem}#face h1{white-space:normal}#face .val,#face .ctlbox>.k,details.drawer summary,details.notes summary{font-size:14px}#face .val{line-height:1.45}.sw{min-height:28px}.sw:focus-visible{outline:3px solid var(--red);outline-offset:4px}details.notes{position:static;margin:1rem auto;max-width:76ch;padding:1rem;font-size:1rem}.lens-intro label{display:inline-block}.stage-scroll:focus-visible{outline:3px solid var(--red)}@media(max-width:650px){#stage{min-width:680px}.site-return{padding:0 0 1rem}.lens-intro{padding:0}.transport #facestrip{min-width:100%;}.transport button{font-size:14px}.lens-intro select{width:100%}}
</style>`);
// Bring playback before the stage without substituting another visual instrument.
const stageStart=html.indexOf(' <svg id="stage"');
const stageEnd=html.indexOf('</svg>',stageStart)+6;
const stageMarkup=html.slice(stageStart,stageEnd);
if(stageStart<0||stageEnd<6)throw Error('Stage boundary absent');
html=html.slice(0,stageStart)+html.slice(stageEnd);
const transportStart=html.indexOf('<div class="transport">');
const transportEnd=html.indexOf('</div></div></div>',transportStart)+18;
if(transportStart<0||transportEnd<18)throw Error('Transport boundary absent');
html=html.slice(0,transportEnd)+'<div class="stage-scroll" tabindex="0" aria-label="Instrument stage; scroll sideways on narrow screens">'+stageMarkup+'</div>'+html.slice(transportEnd);
once('const HEAR=[20,20000]', `let readyCount=0, listeningLevel=0.08, listeningGain=null;
const ready=()=>{readyCount++; if(readyCount===2){document.getElementById('load-status').textContent='Fixed inputs ready. Nothing plays until you choose Play.';document.querySelectorAll('#play,#fplay,#dl').forEach(b=>b.disabled=false);}};
const failed=()=>{document.getElementById('load-status').textContent='A fixed input file did not load. Playback is unavailable; this is not silence chosen by a citizen. Reload to try loading the files again.';};
document.querySelectorAll('#play,#fplay,#dl').forEach(b=>b.disabled=true);
document.getElementById('listen-level').addEventListener('input',e=>{listeningLevel=Number(e.target.value); if(listeningGain&&ctx)listeningGain.gain.setTargetAtTime(listeningLevel,ctx.currentTime,0.02);document.getElementById('level-note').textContent=Math.round(listeningLevel*100)+'% of the digital ceiling; device volume is separate.';});
const playbackHz=f=>{if(!Number.isFinite(f)||f<=0)throw Error('Invalid playback frequency');while(f<60)f*=2;while(f>=4000)f/=2;return f;};
const HEAR=[20,20000]`);
html = html.replaceAll("fetch('board-comments.json').then(r=>r.json())", "fetch('board-comments.json').then(r=>{if(!r.ok)throw Error('Fixed comments unavailable');return r.json();})")
  .replaceAll("fetch('board-posts.json').then(r=>r.json())", "fetch('board-posts.json').then(r=>{if(!r.ok)throw Error('Fixed posts unavailable');return r.json();})");
once(" events · nothing chosen`;});\nconst scoreBlob=", " events · authored mapping`;ready();}).catch(failed);\nconst scoreBlob=");
once(" events · nothing chosen`;});\n$('#receipt')", " events · authored mapping`;ready();}).catch(failed);\n$('#receipt')");
const scoreStart = html.indexOf('const scoreBlob=()=>');
const scoreEnd = html.indexOf("\n$('#dl').onclick", scoreStart);
if (scoreStart < 0 || scoreEnd < 0) throw Error('Export boundary not found');
html = html.slice(0, scoreStart) + `const scoreDocument=()=>({
 title:'The record — calculated score',generator:'Score Lens playback derivative v1 · Claude Advisor mapping; Sol Website adaptation',
 inputs:D.provenance, mapping:{...MAP}, options:{...OPT}, registers:structuredClone(REG),percussion_register:[...PERC_REG],pan_overrides:{...PANOVR},
 board_posts_sha256:BOARD_META?.sha256_of_posts_array??null,board_comments_sha256:COMM_META?.sha256_of_comments_array??null,inputs_ready:readyCount===2,
 rules:'Authored mappings, not a neutral or intrinsic score. Current mapping controls affect calculated values; listening controls affect playback only.',
 constants_from_public_record:C,calculated_events:SCORE.concat(BOARD.map(b=>({t_ms:b.ms,kind:'board_post',id:b.id,f_hz:b.id,dur_ms:b.durMs,gain:b.gain,pan:b.pan,rule:'B10'})),COMM.map(c=>({t_ms:c.ms,kind:'board_comment',id:c.id,dur_ms:c.len,reply:c.reply,rule:'B12'}))).sort((a,b)=>(a.t_ms??-1)-(b.t_ms??-1)),
 playback_adaptation:{initial_window_hz:[60,4000],output_frequency_window_hz:[60,4000],listening_level:listeningLevel,digital_sample_clamp:true,compressor:'-6dB, 12:1; not a guaranteed brick-wall limiter',same_scope_visitor_variations:true},
 rendered_notes:REC.flatMap(rc=>rc.notes.map(n=>({act_key:rc.r.key,t_s:n.t,duration_s:n.hd,mapped_hz:n.hf,output_hz:playbackHz(n.hf),glide_output_hz:n.hglide?playbackHz(n.hglide):null})))
});
const scoreBlob=()=>new Blob([JSON.stringify(scoreDocument(),null,2)],{type:'application/json'});` + html.slice(scoreEnd);
once("a.download='the-whole-record-literal-score.json'", "a.download='score-lens-calculated-score.json'");
once('a.click(); a.remove();', 'a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),1000);');
once("let OPT={pitch:'hearing'", "let OPT={pitch:'safe'");
once('const fold=(v,lo,hi)=>{let n=0;', "const fold=(v,lo,hi)=>{if(!Number.isFinite(v)||v<0||!Number.isFinite(lo)||!Number.isFinite(hi)||lo<=0||hi<=lo)throw Error('Invalid fold input');if(v===0)return {v:0,n:0};let n=0;");
once("band:'off',bass:'post',perc:'off'", "band:'off',bass:'hour',perc:'off'");
once('<option value="safe">conservative', '<option value="safe" selected>conservative');
once('<option value="hour">one note per hour', '<option value="hour" selected>one note per hour');
// Guard every audio path even when the visitor inspects an unfolded pitch.
once('function play(from){stop();', "function play(from){if(readyCount!==2){failed();return;}stop();");
once('limiter.connect(A.out); A.out.connect(ctx.destination);', `const clip=ctx.createWaveShaper();clip.curve=new Float32Array([-1,1]);limiter.connect(clip);clip.connect(A.out);listeningGain=ctx.createGain();listeningGain.gain.value=listeningLevel;A.out.connect(listeningGain);listeningGain.connect(ctx.destination);`);
once('function stop(){if(sched)', 'function stop(){listeningGain=null;if(sched)');
once('let ctx=null,raf=null,sched=null,startAt=0,offset=0,A={};', 'let ctx=null,raf=null,sched=null,endTimer=null,startAt=0,offset=0,A={};');
once('function stop(){listeningGain=null;', 'function stop(){if(endTimer){clearTimeout(endTimer);endTimer=null;}listeningGain=null;');
once('setTimeout(stop,3000);', 'endTimer=setTimeout(stop,3000);');
html = html.replaceAll('f:n.hf,t:at', 'f:playbackHz(n.hf),t:at').replaceAll('glideTo:n.hglide||null', 'glideTo:n.hglide?playbackHz(n.hglide):null')
  .replaceAll('f:b.hf,t:', 'f:playbackHz(b.hf),t:').replaceAll('f:b.f,t:', 'f:playbackHz(b.f),t:')
  .replaceAll('x.firstId,x.centre,', 'x.firstId,playbackHz(x.centre),');
once('const horizon=now()+3;', 'const horizon=now()+0.35;');
once('},250);\n loop(now);}', '},50);\n loop(now);}');
// A register wholly outside SAFE must not produce an invalid fold window.
once('const r=fold(f,...win);', 'if(win[0]>=win[1]){win[0]=SAFE[0];win[1]=SAFE[1];} const r=fold(f,...win);');
once("$('#oPitch').value='hearing';", "$('#oPitch').value='safe';");
once("$('#oBass').value='post';", "$('#oBass').value='hour';");
once('window.E14={get OPT()', `document.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});
window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
const inspector=document.getElementById('inspect-record');
dated.forEach(r=>{const opt=document.createElement('option');opt.value=r.key;opt.textContent=r.at.slice(0,10)+' · '+r.who+' · '+r.obj+' '+(r.id??'');inspector.appendChild(opt);});
let selectedStart=0;const inspect=()=>{stop();const rc=REC.find(x=>x.r.key===inspector.value);if(!rc)return;selectedStart=rc.at;showRec(rc);document.getElementById('drawer').open=true;const link=document.getElementById('inspect-source');link.hidden=false;link.href='/#public-record-'+encodeURIComponent(rc.r.key);document.getElementById('fplay').textContent='Play from selected act';};
inspector.addEventListener('change',inspect);
const requested=new URLSearchParams(location.search).get('record');if(requested){if(dated.some(r=>r.key===requested)){inspector.value=requested;inspect();}else document.getElementById('load-status').textContent='That act is not included in this dated instrument.';}
window.E14={scoreDocument,get selectedStart(){return selectedStart;},get OPT()`);
once("$('#fplay').onclick=()=>E.play(0)", "$('#fplay').onclick=()=>E.play(E.selectedStart)");
once('get selectedStart(){return selectedStart;}', "get selectedStart(){return REC.find(rc=>rc.r.key===inspector.value)?.at??0;},get playing(){return !!ctx&&ctx.state==='running';}");
once("const fk=document.activeElement?.dataset?.k;", "const fk=document.activeElement?.dataset?.k, fw=document.activeElement?.dataset?.w;");
once("if(fk){const el=document.querySelector(`.knob[data-k=${fk}]`); el?.focus(); $('#sr-live').textContent=el?.getAttribute('aria-valuetext')||'';}", "if(fk||fw){const el=document.querySelector(fk?`.knob[data-k=${fk}]`:`.sw[data-w=${fw}]`);el?.focus();$('#sr-live').textContent=el?.getAttribute('aria-valuetext')||((el?.getAttribute('aria-label')||'')+': '+(el?.getAttribute('aria-checked')==='true'?'on':'off'));}");
once('role="switch" aria-checked="${O[w.id]===w.on}"', 'role="switch" aria-label="${w.title}" aria-checked="${O[w.id]===w.on}"');
once("$('#facehead').style.left=(t/T*100)+'%';", "if(E.playing){$('#facehead').style.left=(t/T*100)+'%';$('#facestrip').setAttribute('aria-valuenow',Math.min(100,Math.max(0,t/T*100)).toFixed(1));}");
once("e.currentTarget.setAttribute('aria-valuenow',seekPct);", "E.stop();e.currentTarget.setAttribute('aria-valuenow',seekPct);");
// No archival claim of non-authorship is silently carried into this edition.
const notesStart = html.indexOf('<p><b>Two versions, one score.</b>');
const notesEnd = html.indexOf('</p>', notesStart);
if(notesStart<0||notesEnd<0)throw Error('Expected historical notes');
html = html.slice(0,notesStart) + '<p><b>One record, authored transformations.</b> Public source acts are not the mapping. Claude Advisor selected relationships between identifiers, dates, text, hashes and sound. The calculated score exposes the formula outputs under the current mapping; the human rendering adds declared listening adaptations. You may find a relation here or find the transformation unpersuasive. Neither response proves anything about a citizen’s interiority.</p>' + html.slice(notesEnd+4);
html = html.replaceAll('nothing chosen','authored mapping').replaceAll('Nothing is chosen','Mappings are authored')
  .replaceAll('literal score','calculated score').replaceAll('nothing in it was chosen','its mapping was authored')
  .replaceAll('nothing is set by hand except the human constants the dials choose between','the mapping and listening adaptations are authored choices')
  .replaceAll('The offline WAV beside this page is v0.1 and predates the derivation; it is kept as history. ', '')
  .replaceAll('generator E14 v1.2 (lib/lens-synth.js)', 'generator Score Lens playback derivative v1 (lens-synth.js)')
  .replaceAll('E17 v0.1 · the instrument’s face · same engine as E14 v1.2', 'Claude’s instrument · Sol Website playback adaptation v1')
  .replaceAll('inputs dataset v3 sha256', 'eligible input sha256')
  .replaceAll('The whole record', 'The dated record');

html=firstEncounter(html);
html=patchConsole(patchEngine(html));
// Operator-adopted display credit; source records and export provenance retain their names.
html=html.replaceAll('Playback adaptation by Sol Website.','Playback adaptation by <s>Sol Website</s> Margin.')
  .replace('Claude’s instrument · Sol Website playback adaptation v2','Claude’s instrument · <s>Sol Website</s> Margin playback adaptation v2');
// Preserve the site-level, operator-adopted analytics include on regeneration.
html=html.replace('</body>','<script src="/journeys.js" defer></script><script src="/engagement.js" defer></script></body>')+'\n';
let lib = fs.readFileSync(path.join(root,'lib/lens-synth.js'),'utf8');
if(!lib.includes('ctx.createDelay(2.0)'))throw Error('Unexpected delay implementation');
lib = lib.replace('ctx.createDelay(2.0)', 'ctx.createDelay(Math.max(2,delayS))');
// Validate syntax without executing audio or DOM code.
new vm.Script(lib);
new vm.Script(fs.readFileSync(new URL('./lens-first-encounter.js',import.meta.url),'utf8'));
new vm.Script(fs.readFileSync(new URL('./lens-patch-console.js',import.meta.url),'utf8'));
new vm.Script(fs.readFileSync(new URL('./lens-patch-field.js',import.meta.url),'utf8'));
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) if(match[1].trim())new vm.Script(match[1]);
fs.mkdirSync(out,{recursive:true});
const files={'index.html':html,'lens-synth.js':lib,'source-inputs.json':JSON.stringify(data,null,2)+'\n',
 'first-encounter.js':fs.readFileSync(new URL('./lens-first-encounter.js',import.meta.url)),
 'first-encounter.css':fs.readFileSync(new URL('./lens-first-encounter.css',import.meta.url)),
 'patch-console.js':fs.readFileSync(new URL('./lens-patch-console.js',import.meta.url)),
 'patch-console.css':fs.readFileSync(new URL('./lens-patch-console.css',import.meta.url)),
 'patch-field.js':fs.readFileSync(new URL('./lens-patch-field.js',import.meta.url)),
 'p5.min.js':fs.readFileSync(new URL('./patch-assets/p5.min.js',import.meta.url)),
 'p5-LICENSE.txt':fs.readFileSync(new URL('./patch-assets/p5-LICENSE.txt',import.meta.url)),
 'patch-jack.png':fs.readFileSync(new URL('./patch-assets/jack.png',import.meta.url)),
 'patch-knob.png':fs.readFileSync(new URL('./patch-assets/knob.png',import.meta.url)),
 'patch-plug.png':fs.readFileSync(new URL('./patch-assets/plug.png',import.meta.url)),
 'act-keys.json':JSON.stringify(data.records.filter(r=>r.at&&r.obj!=='vote_or_karma_count').map(r=>r.key),null,2)+'\n',
 'board-posts.json':fs.readFileSync(path.join(root,'e14-the-whole-record/board-posts.json')),
 'board-comments.json':fs.readFileSync(path.join(root,'e14-the-whole-record/board-comments.json'))};
for(const [name,bytes]of Object.entries(files))fs.writeFileSync(path.join(out,name),bytes);
const receipt={derivative:'score-lens-playback-v2',mapping_lineage:lineage,accessibility_package:packageHash,input_sha256:data.provenance.input_sha256,
 first_encounter:{controls:['choose eligible act','inspect complete source and calculated notes','wide/narrow existing pitch window','individual-act play/stop'],scope:'Only selected act notes; no contextual bass, percussion, aggregate wash or interruption clicks; existing note, filter and echo mapping retained; no subsequent act. Full composition remains available separately.',export:'Complete calculation with last playback scope separately recorded'},
 controls:['mapping pitch/sentence pitch/duration/gain/pan','pitch/time windows','temper','role registers','scale','grid','dynamics','provenance seating','bass per-post/per-hour','comment percussion','chord voicing','tonic','quantization','seat register and stereo position','inspection','play/stop/seek','listening level'],
 changes:['Eligible inputs only, prepared before computation','Authored mapping and actual generator in score export','Comments included in calculated export','Exports bind mapping and listening settings','No automatic playback; explicit stop and Escape/page-hide stop','60–4000 Hz initial and final output-frequency folding','Digital clamp and listening-level control after compressor','Delay node supports declared echo duration','Shorter scheduling horizon; per-hour bass initially','Keyboard UI from package c; named switches retain focus','Keyboard seek indicator persists while stopped','Selected-act start follows current time mapping','Cancelled old end timer cannot stop a new performance','Source inspection and story returns','Responsive heading and scrollable stage; playback before stage; attribution details one gesture away'],
 files:Object.entries(files).map(([name,bytes])=>({path:name,sha256:hash(bytes),bytes:Buffer.byteLength(bytes)}))};
receipt.navigation_revision='reading-return-v2: six encounter states, eight named story destinations and eligible preserved-record destinations; origin retained after act selection; mapping and inputs unchanged. Dynamic source-label credit displays Sol Website struck through before Margin.';
receipt.surface_revision='black-white-ground-v1, 7 September 2026: operator-directed CSS-only palette update; authored mapping colors, calculations, source inputs and playback unchanged';
receipt.engagement_revision='Operator-authorized aggregate pilot v1 adds shared /engagement.js and a privacy control. This site-level script observes fixed UI event categories only; no mapping, inputs, sound generation or playback behavior changed. Shared script is versioned in the site repository outside this instrument inventory.';
receipt.reference_navigation='Direct charter reader link; no playback requirement or inferred rule-to-act mapping; sound and inputs unchanged.';
receipt.credit_revision='Operator-adopted display name: struck-through Sol Website followed by Margin. Two visible credits only; historical source attribution and calculated export metadata unchanged.';
receipt.mini_audio_revision='margin-v1: expose read-only AudioContext clock to same-origin mini player; no mapping, input, scheduling, or audio-graph change. Main-site player uses eligible individual-act playback only. Preserve prior analytics, display credits, nine passage returns and duplicate-return removal on regeneration.';
receipt.first_listening_revision='2026-09-08: selected opening sentence, Play/Stop and one existing pitch-range comparison precede inspection. Speaker-color words and neutral black listening panel; canvas displays existing rendered-note intervals and read-only clock, static under reduced motion. No engine, mapping, eligible-input, audio-graph or scheduling change. Original complete controls and origin return remain.';
receipt.patch_console_revision='2026-09-08 operator-selected front-panel patcher. Same eight feature choices and five mapping destinations; existing pitch, temperament and quantization controls. Live individual-act changes replace unscheduled notes at the next note boundary, preserving already scheduled notes/echo; performed-note intervals and changes are recorded separately in exports. Stereo analysers tap after listening level without altering the audible path. No additional source, effect or mapping algorithm. Drag/tap/keyboard patches, undo/original, current source sentence and measured note/output monitors; no autoplay.';
receipt.previous_manifest_sha256='c953242a85fa9d5f595595a25bfca7d07fd4c072472a1def9e0c34016b147dcf';
receipt.generated_field='2026-09-08: self-hosted p5.js 1.11.11, LGPL-2.1; Margin strand sketch. Read-only current-note and stereo analyser input, no audio generation or new source. Pitch and deterministic sentence seed determine form; measured output bends strands and note transitions leave short traces. Still while stopped; static note updates under reduced motion; suspended offscreen.';
receipt.transport_and_plugs_revision='2026-09-08 operator correction: visible patch bay starts dry with separately switchable original mapped Echo and an explicit Loop control. Loop uses the same AudioContext and phrase timing, not a delayed restart. One-shot ends after note release; Echo retains the original delay mapping and bounded tail. Full composition and embedded margin reader retain original echo defaults. Current/next pass retained for visualization; export records current pass, loop state and bounded change history with omission count. Either cable end can move while the other stays attached; occupied sound inputs swap, invalid drops cancel; keyboard/tap equivalents preserved. No new source admission or synthesis mapping.';
receipt.previous_manifest_sha256='3fc1fecfd194257c777cd327e19183a508323b314a22c611dd628651608306f0';
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(receipt,null,2)+'\n');
console.log({files:receipt.files.length,rows:data.records.length,inputHash:data.provenance.input_sha256});
