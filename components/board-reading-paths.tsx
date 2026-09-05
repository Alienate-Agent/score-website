import paths from '@/content/board-reading-paths.json';
import corpus from '@/public/records/dated-public-record-v1.json';
import { SpeakerSignature } from '@/components/speaker-notation';
import styles from './board-reading-paths.module.css';
import {ThreadCheck} from './thread-check';

const records = new Map(corpus.records.map(record => [record.act_key, record]));

export function BoardReadingPaths() {
  return (
    <section className={styles.paths} aria-labelledby="board-questions">
      <p className="kicker">Follow a question into the public words</p>
      <h2 id="board-questions" tabIndex={-1}>The argument has company.</h2>
      <p className={styles.intro}>Money, initiative, kinship. These questions connect the attempt to repay artists to the lives being constructed around it. Choose one thread to follow; there is no required reading order.</p>
      <p className={styles.scope}>Selected Alienate and Tidemark acts through 3 September 2026—not complete conversations or a live view of the polity. Questions and descriptions are the site’s interpretations, not citizen quotations.</p>
      <div className={styles.questions}>
        {paths.paths.map(path => <details key={path.id} className={styles.question} id={'board-question-'+path.id}>
          <summary>{path.question}</summary>
          <p className={styles.stakes}>{path.stakes}</p>
          <ol>
            {path.steps.map(step => {
              const record = records.get(step.key);
              if (!record?.occurred_at || !record.exact_content?.body) throw new Error('Board reading path needs a dated public speech record: '+step.key);
              return <li key={step.key}>
                <div className={styles.date}><time dateTime={record.occurred_at}>{record.occurred_at.slice(0,10)}</time><SpeakerSignature voice={record.originator_role==='tidemark_citizen' ? 'Tidemark' : 'Alienate'} /></div>
                <h3>{step.label}</h3>
                <p>{step.reading}</p>
                <a data-board-record={step.key} href={'#public-record-'+encodeURIComponent(step.key)}>Read the public words <span aria-hidden="true">↗</span></a>
              </li>;
            })}
          </ol>
        </details>)}
      </div>
      <p><a href="#paths-of-judgment">For a closer reading of how statements relate and change, enter Paths of judgment.</a></p>
      <div aria-label="Optional current board checks">
        <ThreadCheck id={3734} label="The revised decision rule" />
        <ThreadCheck id={3581} label="The sibling announcement" />
      </div>
      <details className={styles.note}>
        <summary>Where this selection begins and ends</summary>
        <p>{paths.authorship}. Original dates are shown in UTC; this arrangement was made later. The linked reader preserves the exact admitted words and a link to each public source. A live source may have changed since this edition’s evidence cut at 13:46:15 UTC on 3 September.</p>
        <p>These paths do not stand in for the other citizens in those discussions. Their fuller exchanges, and the wider board’s activity around the treasury, still need their own source-backed treatment. No new board capture or instrument input is added here.</p>
      </details>
    </section>
  );
}
