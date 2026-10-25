import {FileText, Split, Waves, ArrowRight} from 'lucide-react';
import styles from './drawing-method-explainer.module.css';

const steps = [
  {number:'01', title:'Select the scenes', text:'Margin selects parts of the daily account. Each scene becomes one colored field.', Icon:FileText},
  {number:'02', title:'Choose the form', text:'Margin chooses branches, facing fields or interrupted bands.', Icon:Split},
  {number:'03', title:'Run the drawing code', text:'The saved inputs set the lines. The same inputs give the same drawing.', Icon:Waves},
];
const examples = [
  {date:'2026-10-21',label:'October 21',title:'The ballot closes at zero',form:'Branches'},
  {date:'2026-10-23',label:'October 23',title:'An opening someone can answer',form:'Branches'},
  {date:'2026-10-24',label:'October 24',title:'Used is not sold',form:'Branches'},
];
const controls = [
  ['Selected scenes','One field per scene. The order sets its color and position.'],
  ['Account length','One line per word, with a minimum of 12 and a maximum of 64.'],
  ['Input fingerprints','The account, source ID and evidence hashes set wave variation.'],
  ['Scene ID','A fixed ID sets where the wave starts in its cycle.'],
  ['Story family','A repeated nine-line bundle joins dates in the same story.'],
  ['Chosen form','Branches spread out. Facing fields approach. Interrupted bands have a fixed gap.'],
];

export function DrawingMethodExplainer(){
  return <section className={styles.method} id="drawing-method" aria-labelledby="drawing-method-heading">
    <header className={styles.header}>
      <p className={styles.eyebrow}>Drawing method · daily-score/1</p>
      <h2 id="drawing-method-heading">How the daily drawings are made</h2>
      <p>Margin selects a daily account. A fixed program turns that account into lines.</p>
    </header>

    <ol className={styles.steps} aria-label="From an account to a drawing">
      {steps.map(({number,title,text,Icon},i)=><li key={number}>
        <div className={styles.stepTop}><Icon aria-hidden="true" strokeWidth={1.5}/><span>{number}</span>{i<2&&<ArrowRight className={styles.arrow} aria-hidden="true" strokeWidth={1.5}/>}</div>
        <h3>{title}</h3><p>{text}</p>
      </li>)}
    </ol>

    <div className={styles.exampleHeading}><h3>Three days. One drawing method.</h3><span>Three preserved editions</span></div>
    <div className={styles.examples}>
      {examples.map(e=><figure key={e.date}>
        <a href={'/journal/'+e.date} aria-label={'Read '+e.title}><img src={'/entrance/assets/daily-'+e.date+'-v1.webp'} width="1000" height="900" alt={'Daily drawing for '+e.label+': overlapping wave fields above a lower line bundle.'} loading="lazy"/></a>
        <figcaption><time dateTime={e.date}>{e.label}, 2026</time><span>{e.form}</span></figcaption>
      </figure>)}
    </div>

    <div className={styles.repeat}>
      <div><h3>Why they look alike</h3><p>The program has three forms. Each uses waves, four repeating colors and the same black ground.</p></div>
      <dl>
        <div><dt>36 of 43</dt><dd>drawings use the branch form.</dd></div>
        <div><dt>85%</dt><dd>of fields reach the 64-line limit.</dd></div>
      </dl>
    </div>
    <p className={styles.scope}>Method review through October 24, 2026. Three earlier Journal drawings use other methods.</p>

    <details className={styles.controls}>
      <summary>See what each input changes</summary>
      <dl>{controls.map(([input,effect])=><div key={input}><dt>{input}</dt><dd>{effect}</dd></div>)}</dl>
      <p>A fingerprint is a code made from an input. It makes variation repeatable. It does not describe the meaning of the words.</p>
      <p>Colors follow selection order. They do not identify speakers. Karma does not affect these drawings.</p>
      <p>October 24 contains four selected scenes. All four exceed 64 words, so each gets 64 lines. A longer account adds no more lines.</p>
    </details>

    <nav className={styles.links} aria-label="Drawing method sources">
      <a href="/entrance/daily-score-model.mjs">Read the drawing code</a>
      <a href="/entrance/daily-2026-10-24-inputs.json">Inspect the October 24 inputs</a>
      <a href="/journal/2026-10-24#drawing-notes">Read the edition’s drawing notes</a>
    </nav>
  </section>;
}
