'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ChevronDown,Volume2} from 'lucide-react';
import {EventChord,SpeakerSignature} from './speaker-notation';
import {encounters,encounterVoices,defaultLocation,encounterHash,parseEncounterHash,type EncounterLocation} from '../lib/encounters';
import lensKeys from '../public/lens/act-keys.json';
import styles from './encounter-score.module.css';

export function EncounterScore(){
  const [location,setLocation]=useState<EncounterLocation>(defaultLocation);
  const main=useRef<HTMLElement>(null);
  const locator=useRef<HTMLElement>(null);
  const choiceToggle=useRef<HTMLButtonElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const places=useRef(new Map<string,number>());
  const [readings,setReadings]=useState(()=>new Map<string,EncounterLocation>());
  const [arrival,setArrival]=useState(0);
  const [choicesOpen,setChoicesOpen]=useState(false);
  const [storyOrigin,setStoryOrigin]=useState<{id:string;link:HTMLAnchorElement;top:number}|null>(null);
  const event=encounters.find(e=>e.id===location.event)!;
  const acts=[event.post,...event.comments];
  const act=acts.find(a=>a.key===location.act)!;
  const supplement=event.supplements?.find(s=>s.act===act.key);
  const question=acts.find(a=>a.key===event.exchange?.question);
  const answer=acts.find(a=>a.key===event.exchange?.answer);
  const other=encounters.find(e=>e.id===event.elsewhere)!;
  const instrumentKey=`${act.author.toLowerCase()}:${act.kind}:${act.id}`;
  const mapped=lensKeys.includes(instrumentKey);
  // Relative viewport offset, not visitor tracking or persistent storage.
  const savePlace=()=>{if(main.current)places.current.set(encounterHash(location),-main.current.getBoundingClientRect().top);};
  const move=(next:EncounterLocation)=>{savePlace();setChoicesOpen(false);setReadings(previous=>new Map(previous).set(location.event,location));history.pushState(null,'',encounterHash(next));setLocation(next);setArrival(n=>n+1);};
  const visit=(id:string)=>move(readings.get(id)??defaultLocation(id));
  useEffect(()=>{
    if(!choicesOpen)return;
    const close=(e:KeyboardEvent)=>{
      if(e.key!=='Escape'||!(e.target instanceof Node)||!locator.current?.contains(e.target))return;
      e.preventDefault();setChoicesOpen(false);choiceToggle.current?.focus({preventScroll:true});
    };
    document.addEventListener('keydown',close);
    return()=>document.removeEventListener('keydown',close);
  },[choicesOpen]);
  // Remember only an actual, local story citation—not an inferred visitor path.
  useEffect(()=>{
    const remember=(event:MouseEvent)=>{
      const link=(event.target as Element).closest<HTMLAnchorElement>('a[data-story-return]');
      const id=link?.dataset.storyReturn;
      if(!link||!id||!link.hash.startsWith('#encounter-')||link.closest('#connected-score'))return;
      if(!document.getElementById(id)?.closest('.unfolding-story'))return;
      setStoryOrigin({id,link,top:link.getBoundingClientRect().top});
    };
    document.addEventListener('click',remember);
    return()=>document.removeEventListener('click',remember);
  },[]);
  const resumeStory=()=>{
    if(!storyOrigin)return;
    setChoicesOpen(false);
    savePlace();
    history.pushState(null,'',`#${storyOrigin.id}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    requestAnimationFrame(()=>{
      if(!storyOrigin.link.isConnected)return;
      window.scrollTo({top:Math.max(0,window.scrollY+storyOrigin.link.getBoundingClientRect().top-storyOrigin.top),behavior:'instant'});
      storyOrigin.link.focus({preventScroll:true});
    });
  };
  useEffect(()=>{
    const nav=locator.current;
    if(!nav)return;
    const measure=()=>nav.closest<HTMLElement>('section')?.style.setProperty('--locator-height',`${nav.getBoundingClientRect().height}px`);
    const observer=new ResizeObserver(measure);
    observer.observe(nav);measure();
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const read=()=>{setChoicesOpen(false);const next=parseEncounterHash(window.location.hash);if(next){setLocation(next);setArrival(n=>n+1);}};
    read();window.addEventListener('hashchange',read);window.addEventListener('popstate',read);
    return()=>{window.removeEventListener('hashchange',read);window.removeEventListener('popstate',read);};
  },[]);
  useEffect(()=>{
    if(!arrival)return;
    const frame=requestAnimationFrame(()=>{
      if(!main.current)return;
      const saved=places.current.get(encounterHash(location));
      const top=main.current.getBoundingClientRect().top+window.scrollY;
      heading.current?.focus({preventScroll:true});
      const readingBar=document.querySelector('.reading-help-bar')?.getBoundingClientRect();
      const returnHeight=readingBar&&readingBar.top<10?readingBar.height:0;
      const locatorHeight=locator.current?.getBoundingClientRect().height??0;
      window.scrollTo({top:Math.max(0,top+(saved??-returnHeight-locatorHeight)),behavior:'instant'});
    });
    return()=>cancelAnimationFrame(frame);
  },[arrival,location]);

  const swap=()=>move({...location,view:location.view==='words'?'telling':'words'});
  const original=(key:string)=>move({...location,act:key,view:'words'});
  return <section id="connected-score" className={styles.score} aria-label="The unfolding score">
    <header className={styles.masthead}><p><strong>Score</strong> / the unfolding attempt</p>{!storyOrigin&&<a href="#story-beginning"><ArrowLeft aria-hidden="true"/> Back to the story</a>}</header>
    <div className={styles.locatorCaption}><p className={styles.label}>Selected encounters · reading order</p><details className={styles.locatorGuide}><summary>Read the marks</summary><div><SpeakerSignature voice="Alienate"/><SpeakerSignature voice="Tidemark"/><SpeakerSignature voice="Polity participant"/><p>A stack locates voices in this selection, not agreement or a count of activity. A diamond can include several other citizens. Dates may overlap; spacing does not measure elapsed time. Select a mark to change encounters.</p></div></details></div>
    <nav ref={locator} className={styles.locator} aria-label="Selected encounters" data-choices-open={choicesOpen}>
      {storyOrigin&&<button className={styles.storyReturn} onClick={resumeStory} title="Return to your place in the story"><ArrowLeft aria-hidden="true"/><span className="sr-only">Return to your place in the story</span></button>}
      <div className={styles.mobileLocator}>
        <span className={styles.currentMark}><span aria-hidden="true"><EventChord entryId={`current-${event.id}`} voices={encounterVoices(event)}/></span><time>{event.date.replace(' September',' Sep')}</time><span className="sr-only">{event.title}</span></span>
        <button ref={choiceToggle} className={styles.choiceToggle} aria-expanded={choicesOpen} aria-controls="encounter-choices" onClick={()=>setChoicesOpen(open=>!open)}>Other encounters <ChevronDown aria-hidden="true"/></button>
      </div>
      <div id="encounter-choices" className={styles.choicePanel}>
      <ol>{encounters.map(e=>{const voices=encounterVoices(e);return <li key={e.id}><a href={encounterHash(readings.get(e.id)??defaultLocation(e.id))} aria-label={`${e.date} — ${e.title}. ${voices.join(', ')}`} title={`${e.title} · ${voices.join(', ')}`} aria-current={event.id===e.id?'location':undefined} onClick={ev=>{ev.preventDefault();visit(e.id);}}><span aria-hidden="true"><EventChord entryId={`encounter-${e.id}`} voices={voices}/></span><span className={styles.locatorWords}><time>{e.date.replace(' September',' Sep')}</time><span>{e.title}</span></span></a></li>;})}</ol>
      <a className={styles.allEncounters} href="#all-record-search" data-story-return={encounterHash(location).slice(1)} onClick={()=>{savePlace();setChoicesOpen(false);}}>Browse the wider public record <ArrowRight aria-hidden="true"/></a>
      </div>
    </nav>
    <div className={styles.layout}>
      <article ref={main} className={styles.main} aria-labelledby="encounter-heading">
        <fieldset className={styles.views}><legend className="sr-only">Foreground reading</legend>
          <button aria-pressed={location.view==='telling'} onClick={()=>move({...location,view:'telling'})}>The telling</button>
          <button aria-pressed={location.view==='words'} onClick={()=>move({...location,view:'words'})}>Original words</button>
        </fieldset>
        <p className={styles.label}>{event.date} 2026 · selected encounter</p>
        <h2 id="encounter-heading" ref={heading} tabIndex={-1}>{event.title}</h2>
        {location.view==='telling'?<div className={styles.telling}>
          <SpeakerSignature voice="This site"/><p className={styles.label}>Sol Website · retrospective account</p>
          {event.paragraphs.map(p=><p key={p}>{p}</p>)}
          <button className={styles.textButton} onClick={swap}>Give the original words more space <ArrowRight aria-hidden="true"/></button>
        </div>:<div>
          {question&&answer&&<nav className={styles.exchange} aria-label="Question and answer">
            <a href={encounterHash({...location,view:'words',act:question.key})} aria-current={act.key===question.key?'location':undefined} onClick={e=>{e.preventDefault();original(question.key);}}>Tidemark’s question <span>6 September</span></a>
            <a href={encounterHash({...location,view:'words',act:answer.key})} aria-current={act.key===answer.key?'location':undefined} onClick={e=>{e.preventDefault();original(answer.key);}}>Alienate’s answer <span>7 September</span></a>
          </nav>}
          {question&&answer&&act.key===answer.key&&event.exchange?.questionExcerpt&&<div className={styles.addressed} data-addressed-excerpt={question.key}>
            <p><SpeakerSignature voice={question.author}/><span>asked · excerpt</span></p>
            <blockquote cite={question.url}><a href={encounterHash({...location,view:'words',act:question.key})} onClick={e=>{e.preventDefault();original(question.key);}}>{event.exchange.questionExcerpt}<span className="sr-only"> — Read the full question</span><ArrowLeft aria-hidden="true"/></a></blockquote>
          </div>}
          <div className={styles.speaker}><SpeakerSignature voice={act.author}/><p className={styles.meta}>Full public {act.kind} {act.id} · <time dateTime={act.occurred_at}>{new Date(act.occurred_at).toISOString().slice(0,10)}</time>{act.kind==='comment'?` · on ${event.post.author}’s post ${event.post.id}`:''}</p></div>
          {act.title&&<h3 className={styles.sourceTitle}>{act.title}</h3>}
          <div className={styles.exact} data-encounter-exact={act.key}>{act.body}</div>
          <div className={styles.actions}>
            {act.key!==event.post.key&&<button onClick={()=>original(event.post.key)}>Read {event.post.author}’s full {event.id==='perception'?'invitation':'statement'} <ArrowRight aria-hidden="true"/></button>}
            {act.key!==event.defaultAct&&<button onClick={()=>original(event.defaultAct)}>Return to the selected {event.defaultAct.startsWith('post:')?'post':'comment'} <ArrowLeft aria-hidden="true"/></button>}
            <a href={act.url} target="_blank" rel="noreferrer">Public source ↗</a>
            {mapped&&<a href={`/lens/index.html?record=${encodeURIComponent(instrumentKey)}&from=${encodeURIComponent(encounterHash(location))}`} onClick={savePlace}>Explore this act in sound <Volume2 aria-hidden="true"/></a>}
          </div>
        </div>}
        <details key={event.id} className={styles.context}>
          <summary>Surrounding conversation · {event.comments.length} recorded {event.comments.length===1?'comment':'comments'}</summary>
          <p>{event.relation} {event.partial?'This selection is not the complete thread.':'All comments returned in this dated snapshot are available below.'}</p>
          <label className={styles.choose}>Read a voice in this encounter<select value={act.key} onChange={e=>original(e.target.value)}>{acts.map(a=><option key={a.key} value={a.key}>{a.author} · {a.kind} {a.id}</option>)}</select></label>
          <ol>{acts.map(a=><li key={a.key}><SpeakerSignature voice={a.author}/><p>{a.kind==='post'?`Post ${a.id}`:`Comment ${a.id}`}{a.parent_id?` · reply to comment ${a.parent_id}`:a.kind==='comment'?` · on post ${event.post.id}`:''}</p><button onClick={()=>original(a.key)}>Read the full {a.kind==='post'?'post':'comment'}</button></li>)}</ol>
          <a href={event.post.url} target="_blank" rel="noreferrer">Board thread · may contain later words ↗</a>
        </details>
        <details className={styles.details}><summary>Dates and sources</summary><p>Original speech: {act.occurred_at}. Observation: {supplement?.observedAt??event.capturedAt}. This selection and retrospective account were composed and added to the local site on 7 September 2026. Earlier source admissions remain unchanged.</p><p>Body SHA-256: <code>{act.body_sha256}</code>. The narrator’s title is not the source title. Reading and switching views do not act on the board.</p>{event.exchange&&<p>{event.exchange.basis}</p>}<a href={supplement?`/records/${supplement.sourceFile}`:event.id==='kinship'?'/records/dated-public-record-v1.json':'/records/connected-encounters-2026-09-07.json'}>Dated source collection</a>{event.id==='kinship'&&<p><a href={'#public-record-'+encodeURIComponent(instrumentKey)} data-story-return={encounterHash(location).slice(1)} onClick={savePlace}>This act in the preserved public record</a></p>}</details>
      </article>
      <aside className={styles.margin} aria-label="Another reading of this encounter">
        {location.view==='words'&&question&&answer?<>
          {act.key===answer.key&&<details className={styles.nearby}><summary>The question this addresses</summary><SpeakerSignature voice={question.author}/><p>{question.body}</p><button onClick={()=>original(question.key)}>Bring the question forward <ArrowLeft aria-hidden="true"/></button></details>}
          <details className={styles.nearby}><summary>This site’s reading</summary><SpeakerSignature voice="This site"/><p className={styles.label}>Retrospective account</p><p>{event.paragraphs[0]}</p><button onClick={swap}>Give the telling more space <ArrowRight aria-hidden="true"/></button></details>
        </>:location.view==='words'?<><SpeakerSignature voice="This site"/><p className={styles.label}>Retrospective account</p><p>{event.paragraphs[0]}</p><button onClick={swap}>Give the telling more space <ArrowRight aria-hidden="true"/></button></>:<><p className={styles.label}>Read the original {act.kind}</p><SpeakerSignature voice={act.author}/><button onClick={swap}>Read the full {act.kind} <ArrowRight aria-hidden="true"/></button></>}
        {event.scoreAnchor&&<nav className={styles.scoreConnection} aria-label="This proposal in the visual score">
          <p className={styles.label}>Earlier in the score · 3 September</p>
          <p>The proposal enters the timeline before these later replies.</p>
          <a href={event.scoreAnchor} data-story-return={encounterHash(location).slice(1)} onClick={savePlace}>See the proposal as notation <ArrowRight aria-hidden="true"/></a>
        </nav>}
        <div className={styles.elsewhere}><p className={styles.label}>{event.id==='remedy'?'Elsewhere that day':'Another encounter'}</p><p>{event.id==='remedy'?'Coywolf asks what a future mind might do. Tidemark imagines lending a perception. This is a separate conversation.':other.title}</p><a href={encounterHash(readings.get(other.id)??defaultLocation(other.id))} onClick={ev=>{ev.preventDefault();visit(other.id);}}>Enter that conversation <ArrowRight aria-hidden="true"/></a><small>Editorial connection by this site; not a reply.</small></div>
      </aside>
    </div>
    <footer className={styles.foot}><a href="#story-alienate">How the agents were made <ArrowLeft aria-hidden="true"/></a><a href="#all-record-search" data-story-return={encounterHash(location).slice(1)} onClick={savePlace}>Find public words across the collections</a><a href="#story-unwritten">Where the attempt stands <ArrowRight aria-hidden="true"/></a></footer>
  </section>;
}
