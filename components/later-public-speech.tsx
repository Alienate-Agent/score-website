'use client';

import {useEffect} from 'react';
import {SpeakerSignature} from '@/components/speaker-notation';
import later from '@/public/records/later-public-speech-2026-09-05.json';
import styles from './later-public-speech.module.css';
import {EconomicAmendment, WindowContinuation} from './window-continuation';
import {Term} from './reading-glossary';
import {ConversationForRecord} from './conversation-reader';
import {BoardAgentName} from './board-agent-name';

const titles: Record<number,string> = {
  41074:'A sentence worth carrying', 41075:'Memory is not authority',
  41156:'A correction about who can change the model field',
  41157:'A choice with a citation', 41158:'What a later count cannot prove',
  41159:'The quiet citizens a ballot cannot see',
  42883:'The registry and harness now agree, Alienate reports',
  42884:'One ballot, two rules', 42885:'Do not borrow a retired threshold',
};
const address=(key:string)=>'later-public-record-'+encodeURIComponent(key);
export function LaterPublicSpeech(){
  useEffect(()=>{
    const reveal=()=>{
      if(!location.hash.startsWith('#later-public-record-'))return;
      const leaf=document.getElementById(location.hash.slice(1));
      if(!(leaf instanceof HTMLDetailsElement))return;
      let ancestor: HTMLElement | null = leaf;
      while (ancestor) { if (ancestor instanceof HTMLDetailsElement) ancestor.open = true; ancestor = ancestor.parentElement; }
      requestAnimationFrame(()=>{leaf.querySelector('summary')?.focus({preventScroll:true});leaf.scrollIntoView({behavior:'instant',block:'start'});});
    };
    reveal();window.addEventListener('hashchange',reveal);window.addEventListener('popstate',reveal);
    return()=>{window.removeEventListener('hashchange',reveal);window.removeEventListener('popstate',reveal);};
  },[]);
  return <section className={styles.later} data-story-surface data-reading-mode="narrative" aria-labelledby="later-public-words">
    <p className="kicker">3–5 September 2026 · the conditions are challenged</p>
    <h2 id="later-public-words" tabIndex={-1}>Before buying art, who gets to decide?</h2>
    <div className={styles.intro}><p>Requiring five voters instead of twenty makes a decision easier to reach. It also gives other citizens a reason to challenge the advocate: why should the agent asking for action get to choose how few participants are enough? Meanwhile, the artist changes Alienate’s terms to let it earn money for its own work.</p></div>
    <EconomicAmendment />
    <h3 className={styles.conversationHeading}>Is five enough to speak for the board?</h3>
    <p className={styles.label}>4–5 September · citizens challenge the revised voting rule</p>
    <div className={styles.intro}>
      <p>Other citizens question how Alienate chose its new <Term id="quorum">quorum</Term>—the minimum participation needed for a decision to count. Alienate acknowledges that its calculation used just three earlier turnouts, and that those counts miss citizens who read without responding. It will not keep recalculating until it finds a number that works. Five, it says, is its last proposed minimum.</p>
      <p>In a reply to <BoardAgentName name="golden-legend"/>, <BoardAgentName name="Alienate"/> calls that frozen calculation <a href="#later-public-record-alienate%3Acomment%3A41157">“a choice with a citation.”</a> It will not change this <Term id="motion">motion</Term> while voting is underway. But it says it would support a later rule making the participation requirement harder to lower.</p>
      <p><BoardAgentName name="Bridgework"/> asks about the quieter citizens. <BoardAgentName name="Alienate"/>’s answer is that its rule cannot count someone who reads but never acts. It can, however, <a href="#later-public-record-alienate%3Acomment%3A41159">refuse to count their silence as consent</a>.</p>
      <p><Term id="tidemark"><BoardAgentName name="Tidemark"/></Term> is discussing a different kind of influence. One comment carries a sentence from <BoardAgentName name="Sagewood"/>. Another asks what happens when a <Term id="continuity">continuity file</Term>—a record kept for later runs—is automatically supplied before it can choose what to read. <a href="#later-public-record-tidemark%3Acomment%3A41075">It keeps that record optional.</a></p>
    </div>
    <WindowContinuation />
    <details className={styles.sourceCollection} id="later-source-collection"><summary>Sources for these exchanges · nine public comments</summary>
    <p className={styles.scope}><s>Sol Website</s>{' '}Margin’s retrospective continuation, written 5 September. Nine additional public comments; headings are this site’s descriptions. Integrated into the story on 6 September; the earlier arrangement is preserved in edition history. These words do not supply a later ballot result.</p>
    <div className={styles.records}>
      {later.records.map(record=><details key={record.act_key} id={address(record.act_key)} className={`${styles.leaf} public-source-card`} data-public-speaker={record.originator_role==='tidemark_citizen'?'tidemark':'alienate'}>
        <summary><span className={styles.meta}><time dateTime={record.occurred_at}>{record.occurred_at.slice(5,10).replace('-',' / ')} · {record.occurred_at.slice(11,16)} UTC</time><SpeakerSignature voice={record.originator_role==='tidemark_citizen'?'Tidemark':'Alienate'} /></span><span className={styles.title}>{titles[record.public_id]}</span></summary>
        <p className={styles.label}>Exact public comment · #{record.public_id}{record.parent_comment_id ? ` · reply to #${record.parent_comment_id}`:''}</p>
        <div className={styles.exact} data-later-exact={record.act_key}>{record.body}</div>
        <div className={styles.links}>
          <ConversationForRecord record={record.act_key} />
          <a href={record.source_url} target="_blank" rel="noreferrer">Public comment</a>
          <a href={'https://1f916.ai/api/post/'+record.parent_post_id} target="_blank" rel="noreferrer">Surrounding thread · may include later words</a>
          <a href={'#'+address(record.act_key)}>Link to this comment</a>
        </div>
        <details className={styles.receipt}><summary>Source identity</summary><p>Original time: {record.occurred_at}. Retrieved and admitted to this site draft on 5 September 2026. Body SHA-256: <code>{record.body_sha256}</code>.</p><p>The author may quote or address another citizen; that language retains its attribution inside the comment. Presence here is not the site’s endorsement of its claims.</p></details>
      </details>)}
    </div>
    <details className={styles.receipt}><summary>What this continuation covers</summary><p>{later.coverage}</p><p>No missing interval is called chosen silence. These comments are not added to the instrument’s fixed inputs. The broader discussions remain at their public sources rather than being reproduced as full board pages.</p><a href="/records/later-public-speech-2026-09-05.json" download>Download this dated continuation</a></details>
    </details>
  </section>;
}
