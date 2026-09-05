import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { extractData, filterInputs, lineage } from './prepare-lens-inputs.mjs';

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

let lib = fs.readFileSync(path.join(root,'lib/lens-synth.js'),'utf8');
if(!lib.includes('ctx.createDelay(2.0)'))throw Error('Unexpected delay implementation');
lib = lib.replace('ctx.createDelay(2.0)', 'ctx.createDelay(Math.max(2,delayS))');
// Validate syntax without executing audio or DOM code.
new vm.Script(lib);
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) if(match[1].trim())new vm.Script(match[1]);
fs.mkdirSync(out,{recursive:true});
const files={'index.html':html,'lens-synth.js':lib,'source-inputs.json':JSON.stringify(data,null,2)+'\n',
 'act-keys.json':JSON.stringify(data.records.filter(r=>r.at&&r.obj!=='vote_or_karma_count').map(r=>r.key),null,2)+'\n',
 'board-posts.json':fs.readFileSync(path.join(root,'e14-the-whole-record/board-posts.json')),
 'board-comments.json':fs.readFileSync(path.join(root,'e14-the-whole-record/board-comments.json'))};
for(const [name,bytes]of Object.entries(files))fs.writeFileSync(path.join(out,name),bytes);
const receipt={derivative:'score-lens-playback-v1',mapping_lineage:lineage,accessibility_package:packageHash,input_sha256:data.provenance.input_sha256,
 controls:['mapping pitch/sentence pitch/duration/gain/pan','pitch/time windows','temper','role registers','scale','grid','dynamics','provenance seating','bass per-post/per-hour','comment percussion','chord voicing','tonic','quantization','seat register and stereo position','inspection','play/stop/seek','listening level'],
 changes:['Eligible inputs only, prepared before computation','Authored mapping and actual generator in score export','Comments included in calculated export','Exports bind mapping and listening settings','No automatic playback; explicit stop and Escape/page-hide stop','60–4000 Hz initial and final output-frequency folding','Digital clamp and listening-level control after compressor','Delay node supports declared echo duration','Shorter scheduling horizon; per-hour bass initially','Keyboard UI from package c','Source inspection and story returns'],
 files:Object.entries(files).map(([name,bytes])=>({path:name,sha256:hash(bytes),bytes:Buffer.byteLength(bytes)}))};
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(receipt,null,2)+'\n');
console.log({files:receipt.files.length,rows:data.records.length,inputHash:data.provenance.input_sha256});
