import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AudioLines, Square, Repeat2, Undo2, RotateCcw, ArrowLeft, X, ChevronDown} from 'lucide-react';

const icon=Component=>renderToStaticMarkup(createElement(Component,{size:22,'aria-hidden':true,focusable:false,strokeWidth:2}));
export function patchConsole(html) {
  const start=html.indexOf('<nav class="site-return">'), end=html.indexOf('<details id="full-instrument">');
  if(start<0||end<start)throw Error('Patch console surface boundary absent');
  const aboutStart=html.indexOf('<div class="sound-authorship">',start);
  const about=html.slice(aboutStart,html.indexOf('</section>',aboutStart));
  const sockets=(values,type)=>values.map(([key,label])=>'<button class="patch-jack" data-'+type+'="'+key+'" aria-label="'+(type==='src'?'Source: ':'Destination: ')+label+'" title="'+label+'"><span class="jack-label">'+label+'</span><img class="jack-image" src="patch-jack.png" alt="" draggable="false"></button>').join('');
  const sources=[['id','Record ID'],['post_id','Thread ID'],['hour','Time of day'],['len','Text length'],['first','First byte'],['cid','Citizen number'],['day','Day'],['cap','Daily limit']];
  const destinations=[['pitch','Base pitch'],['spitch','Sentence pitch'],['dur','Note length'],['gain','Level'],['pan','Pan']];
  const markup=[
    '<section id="patch-console" aria-label="Score sound instrument">',
    '<header class="patch-top"><a class="patch-brand" href="/#story-title">Score</a><span class="patch-subtitle">SENTENCE → SOUND</span>',
    '<label class="patch-select">Source<select id="inspect-record" aria-label="Source act"><option value="">Choose a public act</option></select></label>',
    '<div class="patch-transport"><button id="first-play" disabled>'+icon(AudioLines)+'<span>Play</span></button><button id="first-stop">'+icon(Square)+'<span>Stop</span></button><button id="patch-loop" aria-pressed="false" title="Repeat the phrase">'+icon(Repeat2)+'<span>Loop</span></button><button id="patch-echo" aria-pressed="false" title="The original data-derived delay"><span>Echo</span></button></div>',
    '<div class="patch-master"><label for="listen-level">Level</label><canvas id="patch-meter" aria-hidden="true"></canvas><input id="listen-level" aria-label="Listening level" type="range" min="0" max="0.15" step="0.01" value="0.08"><output id="patch-level">8%</output></div>',
    '<a id="encounter-return" class="patch-return" aria-label="Return to story" href="/#story-unwritten">'+icon(ArrowLeft)+'<span>Return to story</span></a></header>',
    '<div id="load-status" role="status">Loading the instrument. Playback is unavailable until the fixed inputs arrive.</div>',
    '<section id="first-act" class="patch-source" data-speaker="tidemark" aria-label="Source sentence"><div class="patch-source-meta"><span id="first-attribution"></span><span id="first-note-index"></span></div>',
    '<blockquote id="first-sentence" tabindex="-1"></blockquote><button id="patch-inspect" aria-haspopup="dialog">Inspect</button></section>',
    '<section id="patch-bay" aria-labelledby="patch-heading"><h1 id="patch-heading">PATCH</h1><p class="bank-caption bank-left" id="source-bank-title">SOURCE</p><p class="bank-caption bank-right">SOUND</p>',
    '<div id="patch-field" role="img" aria-label="Generative strand field: pitch spaces the strands; measured output bends them."></div><canvas id="patch-cables" aria-hidden="true"></canvas><div class="patch-bank sources">'+sockets(sources,'src')+'</div><div class="patch-bank destinations">'+sockets(destinations,'dest')+'</div>',
    '<output id="patch-route" aria-live="polite">Move either plug. Hear the change.</output></section>',
    '<div class="patch-displays"><figure class="patch-notes"><figcaption><span>NOTES</span><output id="first-status" role="status">Ready when you are.</output></figcaption><canvas id="first-note-map" role="img" aria-label="Notes for the selected act"></canvas></figure>',
    '<figure class="patch-output"><figcaption>OUTPUT <span>STEREO</span></figcaption><canvas id="patch-wave" role="img" aria-label="Live output waveform; silent until Play"></canvas></figure></div>',
    '<div class="patch-controls"><div class="patch-control"><label for="patch-range">PITCH RANGE</label><div class="rotary-row"><div id="patch-range" class="patch-rotary" role="slider" tabindex="0" aria-label="Pitch range" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0"><img src="patch-knob.png" alt="" draggable="false"></div><select id="first-range" aria-label="Pitch range"><option value="safe">Wide</option><option value="voice">Narrow</option></select></div></div>',
    '<div class="patch-control timing"><label for="patch-rhythm">RHYTHM</label><input id="patch-rhythm" type="range" min="0" max="2" step="1" value="0" aria-label="Rhythm quantization"><output id="patch-rhythm-value">Free</output></div>',
    '<div class="patch-control"><label for="patch-tuning">TUNING</label><div class="rotary-row"><div id="patch-tuning" class="patch-rotary" role="slider" tabindex="0" aria-label="Tuning" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0"><img src="patch-knob.png" alt="" draggable="false"></div><output id="patch-tuning-value">Unsnapped</output></div></div>',
    '<div class="patch-actions"><div><button id="patch-undo" disabled>'+icon(Undo2)+'Undo</button><button id="patch-original">'+icon(RotateCcw)+'Original</button></div><small>Low volume first.</small></div></div>',
    '<dialog id="patch-inspection" aria-labelledby="patch-inspection-title"><header><h2 id="patch-inspection-title">Source & sound</h2><button id="patch-inspection-close" aria-label="Close inspection">'+icon(X)+'</button></header>',
    '<p id="first-act-title"></p><a id="inspect-source">Read this source act</a><h3 id="first-source-label"></h3><div id="first-source-body"></div>',
    '<details><summary>Notes and connections</summary><p>Each sentence becomes a note. A live remap changes the next unscheduled sentence; sounding notes and their echo keep their previous settings. The note display follows that performance. Cables connect source features to authored calculations, not audio outputs to audio inputs.</p><div id="patch-mapping-list"></div><ol id="first-notes"></ol></details>',
    '<details><summary>Controls and playback</summary><p>Move either plug to another socket on its own side. The other end stays connected. Occupied sound inputs swap connections; an empty drop or Escape leaves them unchanged. Click, tap or Enter on a source and then a sound input also makes a connection. Escape otherwise stops playback. Undo reverses the last patch or front-panel control change. Original restores the five original connections and front-panel listening defaults. The full composition has its own additional controls.</p><p>Loop repeats the phrase without the echo gap. Switch it off to finish the scheduled pass; Stop cuts playback immediately. Echo is separate and initially off in this patch bay. It restores the original mapped delay—10.288 seconds in this edition—which can sound like the phrase playing again. Turning Echo off mutes its tail. Neither control starts playback, and reloading never starts a loop. The full composition and embedded margin player retain their original echo.</p><p>Range folds pitch by octaves. Rhythm uses the existing cap-derived grid. Tuning snaps pitches to twelve equal steps per octave. The output monitor reads the actual left and right signal after the listening-level control. Note marks describe scheduled notes, not their longer release and echo.</p><p id="level-note">8% of the digital ceiling; device volume is separate.</p></details>',
    '<details><summary>Generated field</summary><p>Margin’s p5.js sketch translates the current note into strands: pitch sets their spacing, a seed from the sentence sets the weave, and measured stereo output bends it. A new sentence leaves a brief trace. This is an interpretation, not another sound source. Stop holds a still form; reduced motion removes vibration and trails.</p><p><a href="https://p5js.org/" target="_blank" rel="noopener noreferrer">p5.js</a>, from the Processing ecosystem, is served locally with this instrument. <a href="p5-LICENSE.txt">Library license</a>.</p></details>',
    about,
    '<p><a href="/charter" target="_blank" rel="noopener noreferrer">Alienate’s public charter</a> · <a href="/#dated-record-reader-title">Public records</a></p></dialog>',
    '</section>',
    '<p class="patch-full-label">'+icon(ChevronDown)+' More of the instrument</p>'
  ].join('\n');
  html=html.slice(0,start)+markup+html.slice(end);
  html=html.replace('</head>','<link rel="stylesheet" href="patch-console.css"></head>');
  html=html.replace('<script src="first-encounter.js"></script>','<script src="first-encounter.js"></script><script src="patch-console.js"></script><script src="p5.min.js"></script><script src="patch-field.js"></script>');
  return html;
}
