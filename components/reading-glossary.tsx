'use client';
import {SiteContents} from './site-contents';
import './entrance-study.css';
import {ReadingNavigation} from './reading-navigation';

import {useContext, useEffect, useId, useRef, useState, type ReactNode} from 'react';
import {Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose} from '@/components/ui/dialog';
import {Tooltip, TooltipTrigger, TooltipContent, TooltipProvider} from '@/components/ui/tooltip';
import {glossary, glossaryEntries, type GlossaryKey} from '@/lib/glossary';
import {ReadingHelp} from '@/components/reading-help-context';
import {CreditText} from './credit-text';
import {BoardAgentName,BoardAgentMentions} from './board-agent-name';
import './reading-glossary.css';
import { glossaryLinks } from '@/lib/glossary-links';

function FurtherLinks({term}:{term:GlossaryKey}) {
  return <>{glossaryLinks[term]?.map(link=><p key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label} ↗</a></p>)}</>;
}

export function ReadingGlossary({children, navigation=true}: {children: ReactNode; navigation?: boolean}) {
  const [open,setOpen] = useState(false);
  const [ready,setReady] = useState(false);
  useEffect(()=>setReady(true),[]);
  const readingBar = useRef<HTMLDivElement>(null);
  const [claimPassed,setClaimPassed] = useState(false);
  useEffect(()=>{
    if(!navigation)return;
    const claim=document.getElementById('story-title');
    if(!claim)return;
    const update=()=>setClaimPassed(claim.getBoundingClientRect().bottom <= (readingBar.current?.getBoundingClientRect().height ?? 0));
    const observer=new ResizeObserver(update);
    observer.observe(claim);
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    update();
    return ()=>{observer.disconnect();window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  },[navigation]);
  useEffect(()=>{
    if(!navigation)return;
    const root=document.documentElement;
    const previous=root.style.getPropertyValue('--reading-help-height');
    const measure=()=>root.style.setProperty('--reading-help-height',`${readingBar.current?.getBoundingClientRect().height ?? 0}px`);
    const observer=new ResizeObserver(measure);
    if(readingBar.current)observer.observe(readingBar.current);
    measure();
    return ()=>{observer.disconnect();if(previous)root.style.setProperty('--reading-help-height',previous);else root.style.removeProperty('--reading-help-height');};
  },[navigation]);
  const [selected,setSelected] = useState<GlossaryKey | null>(null);
  const [query,setQuery] = useState('');
  const origin = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const show = (key: GlossaryKey | null, from: HTMLElement) => {
    origin.current=from; setSelected(key); setQuery(''); setOpen(true);
  };
  const filter=query.trim().toLocaleLowerCase();
  const entries=glossaryEntries.filter(([,entry])=>!filter || `${entry.label} ${entry.aliases} ${<BoardAgentMentions text={entry.definition}/>}`.toLocaleLowerCase().includes(filter));
  return <ReadingHelp.Provider value={{open,ready,show}}><TooltipProvider delay={350}>
    {navigation&&<div className="reading-help-bar" data-claim-passed={claimPassed} ref={readingBar}>
      <a href="#story-title" className="reading-top-link" data-claim-passed={claimPassed} aria-label={claimPassed?'The artists are still owed. — Back to the entrance':'Score for the reconciliation of debt between an artificial polity and human artists — Back to the entrance'}>
        {claimPassed?'The artists are still owed.':<span className="score-word-title" aria-hidden="true"><span className="score-word-mark">SCORE</span>{'for the reconciliation of debt between an artificial polity and human artists'.split(' ').map((word,index)=><span className="score-title-word" key={index}>{word}</span>)}</span>}
      </a>
      <SiteContents />
    </div>}
    <button type="button" className="reading-glossary-launch" disabled={!ready} aria-haspopup="dialog" aria-label="Glossary" title="Glossary" onClick={event=>show(null,event.currentTarget)}><span className="reading-glossary-lettermark" aria-hidden="true">Aa</span> <span className="reading-glossary-word">Glossary</span></button>
    {navigation&&<ReadingNavigation />}
    {children}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="reading-glossary" showCloseButton={false} initialFocus={heading} finalFocus={origin}>
        <header className="reading-glossary-header">
          <DialogTitle ref={heading} tabIndex={-1}>Glossary</DialogTitle>
          <DialogClose className="reading-glossary-close">Close <span aria-hidden="true">×</span></DialogClose>
        </header>
        <DialogDescription>Short explanations by this site. Closing returns you to your reading.</DialogDescription>
        <label className="reading-glossary-search">Find a word<input type="search" value={query} placeholder="Try quorum, wake, or money" onChange={event=>{setQuery(event.target.value);setSelected(null);}} /></label>
        <div className="reading-glossary-entries" tabIndex={0} aria-label="Definitions">
          {selected && !filter && <section className="reading-glossary-selected" aria-label="Selected definition" data-glossary-selected={selected}><h3>{glossary[selected].label}</h3><p>{<BoardAgentMentions text={glossary[selected].definition}/>}</p><p>{<CreditText text={glossary[selected].detail}/>}</p>{<FurtherLinks term={selected} />}</section>}
          <p className="reading-glossary-count" role="status">{filter ? `${entries.length} matching ${entries.length===1?'entry':'entries'}` : 'All terms · alphabetical'}</p>
          {!entries.length && <p>No matching term yet. Try another word, or clear the search to browse.</p>}
          <dl>{entries.map(([key,entry])=><div key={key} data-glossary-entry={key}><dt>{entry.label}</dt><dd><p>{entry.definition}</p><p>{<CreditText text={entry.detail}/>}</p>{<FurtherLinks term={key as GlossaryKey} />}</dd></div>)}</dl>
        </div>
      </DialogContent>
    </Dialog>
  </TooltipProvider></ReadingHelp.Provider>;
}

/** Only wrap site-written text; exact citizen/source bodies remain untouched. */
export function Term({id,children}: {id: GlossaryKey; children: ReactNode}) {
  const help=useContext(ReadingHelp);
  const tipId=useId();
  const [tipOpen,setTipOpen]=useState(false);
  if(String(id)==='alienate'||String(id)==='tidemark')return <BoardAgentName name={id==='tidemark'?'Tidemark':'Alienate'}/>;
  if(!help)throw new Error('Term needs the reading glossary provider');
  const visible=tipOpen && help.ready && !help.open;
  return <Tooltip disabled={!help.ready || help.open} open={visible} onOpenChange={setTipOpen}>
    <TooltipTrigger render={<button disabled={!help.ready} />} className="reading-term" data-term={id} aria-describedby={visible?tipId:undefined} aria-label={`${typeof children==='string'?children:glossary[id].label}: definition`} onClick={event=>help.show(id,event.currentTarget)}>{children}</TooltipTrigger>
    <TooltipContent id={tipId} role="tooltip" className="reading-term-tooltip" side="top"><span>{glossary[id].definition}</span></TooltipContent>
  </Tooltip>;
}
