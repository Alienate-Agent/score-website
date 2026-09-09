'use client';

import {useEffect,useId,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {AudioLines,ArrowUpRight,Play,Square,X} from 'lucide-react';
import actKeys from '@/public/lens/act-keys.json';
import styles from './mini-audio.module.css';

type Note={act_key:string;t_s:number;duration_s:number;output_hz:number};
type Engine={
  inputsReady:boolean;playing:boolean;
  playbackClock:{state:string;position:number}|null;
  scoreDocument:()=>{rendered_notes:Note[]};
  playbackPlan:(from:number,key:string)=>{start:number;end:number};
  playAct:(key:string)=>void;stop:()=>void;
};
type EngineWindow=Window & {E14?:Engine};
type State='loading'|'ready'|'playing'|'stopped'|'ended'|'error';
const eligible=new Set(actKeys);
const stopOthers='score-mini-audio-open';

/** Uses the existing isolated full instrument, never a second musical mapping.
 * No engine is loaded until opening; no AudioContext starts until Play. */
export function MiniAudio({actKey,speaker,from,marginId,toolbar,children}:{actKey:string;speaker:string;from:string;marginId?:string;toolbar?:ReactNode;children:ReactNode}){
  const allowed=eligible.has(actKey);
  const id=useId();
  const [open,setOpen]=useState(false);
  const [state,setState]=useState<State>('loading');
  const [notes,setNotes]=useState<Note[]>([]);
  const [plan,setPlan]=useState({start:0,end:1});
  const [position,setPosition]=useState(0);
  const [level,setLevel]=useState(.08);
  const [portal,setPortal]=useState<HTMLElement|null>(null);
  const [wide,setWide]=useState(false);
  const [reduced,setReduced]=useState(false);
  const frame=useRef<HTMLIFrameElement>(null);
  const engine=useRef<Engine|null>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLElement>(null);
  const source=useRef<HTMLDivElement>(null);
  const currentKey=useRef(actKey);
  const color=speaker.toLowerCase()==='tidemark'?'var(--voice-tidemark, #00ffff)':speaker.toLowerCase()==='alienate'?'var(--voice-alienate, #ff00ff)':'#fffffe';
  const instrument=`/lens/index.html?record=${encodeURIComponent(actKey)}&from=${encodeURIComponent(from)}`;
  const close=(restore=true)=>{engine.current?.stop();setOpen(false);if(restore)requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}));};

  useEffect(()=>{
    const other=(event:Event)=>{if((event as CustomEvent).detail!==id){engine.current?.stop();setOpen(false);}};
    document.addEventListener(stopOthers,other);
    return()=>document.removeEventListener(stopOthers,other);
  },[id]);
  useEffect(()=>{
    if(currentKey.current===actKey)return;
    currentKey.current=actKey;engine.current?.stop();setOpen(false);
  },[actKey]);
  useEffect(()=>{
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    const media=matchMedia('(min-width: 1000px)');
    const update=()=>{setWide(media.matches);setPortal(media.matches&&marginId?document.getElementById(marginId):null);};
    update();media.addEventListener('change',update);
    return()=>media.removeEventListener('change',update);
  },[marginId]);
  useEffect(()=>{
    if(!open||!portal)return;
    const target=document.getElementById(marginId!);
    if(!target)return;
    const align=()=>{
      if(!source.current)return;
      target.style.paddingTop='0px';
      const gap=source.current.getBoundingClientRect().top-target.getBoundingClientRect().top;
      target.style.paddingTop=`${Math.max(0,gap)}px`;
    };
    const observer=new ResizeObserver(align);if(source.current)observer.observe(source.current);
    window.addEventListener('resize',align);align();
    return()=>{observer.disconnect();window.removeEventListener('resize',align);target.style.paddingTop='';};
  },[open,portal,marginId]);
  useEffect(()=>{
    if(!open)return;
    // Escape is local to this listening excursion; other navigation is unchanged.
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();engine.current?.stop();setOpen(false);trigger.current?.focus({preventScroll:true});}};
    const stop=()=>engine.current?.stop();
    const hide=()=>{if(document.hidden)stop();};
    const leave=()=>{stop();setOpen(false);};
    const collapse=()=>{if(trigger.current&&!trigger.current.getClientRects().length)leave();};
    document.addEventListener('keydown',escape);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',hide);
    window.addEventListener('hashchange',leave);window.addEventListener('popstate',leave);document.addEventListener('toggle',collapse,true);
    panel.current?.querySelector<HTMLButtonElement>('[data-mini-close]')?.focus({preventScroll:true});
    return()=>{document.removeEventListener('keydown',escape);window.removeEventListener('pagehide',stop);document.removeEventListener('visibilitychange',hide);window.removeEventListener('hashchange',leave);window.removeEventListener('popstate',leave);document.removeEventListener('toggle',collapse,true);stop();engine.current=null;};
  },[open]);
  useEffect(()=>{
    if(!open)return;
    let loaded:Document|null=null;
    const playback=(event:Event)=>{
      const next=(event as CustomEvent).detail.state;
      if(next==='ended'){setState('ended');return;}
      if(next==='stopped'){setState('stopped');return;}
      // Engine dispatches its event before creating the context. The clock below
      // verifies that the real context runs before the UI claims playback.
    };
    const started=Date.now();
    const poll=setInterval(()=>{
      const child=frame.current?.contentWindow as EngineWindow|null;
      const E=child?.E14;
      if(!engine.current){
        if(E?.inputsReady){
          try{
            const selection=E.playbackPlan(0,actKey);
            const rendered=E.scoreDocument().rendered_notes.filter(n=>n.act_key===actKey);
            if(!rendered.length)throw Error('No mapped notes');
            engine.current=E;loaded=child!.document;loaded.addEventListener('lens-playback',playback);
            setPlan(selection);setNotes(rendered);setState('ready');
          }catch{setState('error');clearInterval(poll);}
        }else if(Date.now()-started>15000||child?.document.getElementById('load-status')?.textContent?.includes('did not load')){
          setState('error');clearInterval(poll);
        }
        return;
      }
      const clock=E?.playbackClock;
      if(clock){
        if(clock.state==='running'){setState('playing');setPosition(clock.position);}
        else setState('stopped');
      }
    },50);
    return()=>{clearInterval(poll);loaded?.removeEventListener('lens-playback',playback);};
  },[open,actKey]);

  const play=()=>{
    try{
      const E=engine.current;if(!E?.inputsReady)throw Error('Not ready');
      const input=frame.current?.contentDocument?.getElementById('listen-level') as HTMLInputElement|null;
      if(input){input.value=String(level);input.dispatchEvent(new Event('input',{bubbles:true}));}
      setPosition(plan.start);E.playAct(actKey);
    }catch{engine.current?.stop();setState('error');}
  };
  const volume=(value:number)=>{
    setLevel(value);
    const input=frame.current?.contentDocument?.getElementById('listen-level') as HTMLInputElement|null;
    if(input){input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));}
  };
  const duration=Math.max(.001,plan.end-plan.start);
  const noteEnd=Math.max(plan.start+.001,...notes.map(n=>n.t_s+n.duration_s));
  const noteDuration=noteEnd-plan.start;
  const elapsed=state==='ended'?duration:Math.min(duration,Math.max(0,position-plan.start));
  const x=(hz:number)=>24+Math.log2(hz/60)/Math.log2(4000/60)*192;
  const y=(time:number)=>24+(time-plan.start)/noteDuration*264;
  const status={loading:'Loading this act’s sound…',ready:'Ready to play.',playing:position>noteEnd?'Notes complete · letting the sound finish.':'Playing this act.',stopped:'Stopped.',ended:'This act has ended.',error:'Sound could not load or start. The words are still available.'}[state];
  const player=open&&<aside ref={panel} id={id} className={styles.panel} style={{'--sound-color':color} as CSSProperties} aria-label={`${speaker} · sound of this act`} data-mini-panel data-state={state}>
    <header><div><strong>{speaker}</strong><span>Sound of this {actKey.includes(':post:')?'post':'act'}</span></div><button data-mini-close type="button" onClick={()=>close()} aria-label="Close sound and return to the words"><X aria-hidden="true"/></button></header>
    <div className={styles.visual}>
      <p className={styles.mapLabel}>Pitch → · time ↓ <span>{notes.length?`${noteDuration.toFixed(1)} s of notes`:''}</span></p>
      <svg viewBox="0 0 240 310" aria-labelledby={`${id}-plot-title`} data-note-score>
        <title id={`${id}-plot-title`}>Calculated notes: pitch increases from left to right; time runs down. The horizontal line follows the notes; the remaining release time is shown on the counter.</title>
        {[60,440,4000].map(hz=><g key={hz}><line x1={x(hz)} x2={x(hz)} y1="20" y2="290" className={styles.grid}/><text x={x(hz)} y="306" textAnchor={hz===60?'start':hz===4000?'end':'middle'}>{hz} Hz</text></g>)}
        {notes.map((n,i)=><line key={i} data-note={i} x1={x(n.output_hz)-5} x2={x(n.output_hz)+5} y1={y(n.t_s)} y2={y(n.t_s)} className={!reduced&&state==='playing'&&position>=n.t_s&&position<n.t_s+n.duration_s?styles.sounding:styles.note}><title>{`${n.output_hz.toFixed(1)} Hz · ${n.duration_s.toFixed(3)} seconds`}</title></line>)}
        {!reduced&&(state==='playing'||state==='ended')&&<line data-playhead x1="12" x2="228" y1={24+Math.min(1,elapsed/noteDuration)*264} y2={24+Math.min(1,elapsed/noteDuration)*264} className={styles.playhead}/>}
      </svg>
    </div>
    <div className={styles.transport}>
      <button type="button" disabled={state==='loading'||state==='error'||state==='playing'} onClick={play} aria-label={state==='ended'?'Play this act again':'Play this act'}><Play aria-hidden="true"/> {state==='ended'?'Replay':'Play'}</button>
      <button type="button" disabled={state!=='playing'} onClick={()=>engine.current?.stop()} aria-label="Stop this act"><Square aria-hidden="true"/> Stop</button>
      <span className={styles.time}>{elapsed.toFixed(1)} / {duration.toFixed(1)} s</span>
    </div>
    <output className={styles.status}>{status}</output>
    <label className={styles.level}>Level <input aria-label="Listening level" type="range" min="0" max="0.15" step="0.01" value={level} onChange={e=>volume(Number(e.target.value))}/><span>{Math.round(level*100)}%</span></label>
    <p className={styles.help}>Text becomes notes, not a spoken voice. Start with low device volume.</p>
    <a className={styles.full} href={instrument} onClick={()=>close(false)}>Full instrument <ArrowUpRight aria-hidden="true"/></a>
    <details><summary>How the sound is made</summary><p>Claude Advisor’s mapping turns each sentence into a note. Pitch comes from its characters; sentence length helps set duration. This view uses the same calculated notes and audio clock as the full instrument, including its echo. {reduced?'Reduced motion: the note map stays still. ':''}Playback adaptation: <s>Sol Website</s> Margin. The source speech is {speaker}’s; this rendering is not a simulated voice.</p><a href={instrument} onClick={()=>close(false)}>Inspect the complete source and each note</a></details>
  </aside>;

  if(!allowed)return <>{toolbar}{children}</>;
  return <div className={styles.reading} data-external-margin={Boolean(marginId)} data-mini-reading={actKey}>
    <div ref={source} className={styles.source}>
      <div className={styles.triggerRow}>{toolbar}<button ref={trigger} className={styles.trigger} type="button" aria-expanded={open} aria-controls={open?id:undefined} aria-label={`Hear ${speaker}’s ${actKey.includes(':post:')?'post':'act'} as sound`} title="Hear this act as sound—not a spoken reading" onClick={()=>{
        if(open){close();return;}
        document.dispatchEvent(new CustomEvent(stopOthers,{detail:id}));setState('loading');setNotes([]);setPosition(0);setOpen(true);
      }}><AudioLines aria-hidden="true"/></button></div>
      {open&&((marginId&&!portal)||(!marginId&&!wide))&&player}
      {children}
    </div>
    {!marginId&&wide&&<div className={styles.margin}>{player}</div>}
    {portal&&player&&createPortal(player,portal)}
    {open&&<iframe ref={frame} className={styles.engine} src={instrument} title="Sound calculation engine" aria-hidden="true" tabIndex={-1} />}
  </div>;
}
