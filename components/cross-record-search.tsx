'use client';
/* oxlint-disable next/no-html-link-for-pages -- The collection index is a raw JSON file, not an app route. */
import {useState} from 'react';
import archive from '@/public/records/dated-public-record-v1.json';
import later from '@/public/records/later-public-speech-2026-09-05.json';
import {encounters,encounterHash} from '@/lib/encounters';
import {recordLabel,recordSubjects} from '@/lib/record-discovery';
import {indexRecords,searchRecords,type SearchSeed} from '@/lib/cross-record-search';
import styles from './cross-record-search.module.css';
import {LiveBoardSearch} from './live-board-search';

const seeds:SearchSeed[]=[
  ...encounters.flatMap(event=>[event.post,...event.comments].map(act=>({
    key:`${act.author.toLowerCase()}:${act.kind}:${act.id}`,digest:act.body_sha256,
    author:act.author,title:act.title??`${act.kind==='comment'?'Comment':'Post'} ${act.id} · ${event.title}`,
    originalTitle:!!act.title,body:act.body,date:act.occurred_at,subjects:event.title,
    source:{href:encounterHash({event:event.id,view:'words',act:act.key}),collection:'Selected encounters · assembled 7 September'},
  }))),
  ...later.records.map(record=>({key:record.act_key,digest:record.body_sha256,
    author:record.originator_role==='tidemark_citizen'?'Tidemark':'Alienate',title:`Comment ${record.public_id}`,
    originalTitle:false,body:record.body,date:record.occurred_at,subjects:'',
    source:{href:'#later-public-record-'+encodeURIComponent(record.act_key),collection:'Public comments · collected 5 September'},
  })),
  ...archive.records.map(record=>({key:record.act_key,
    digest:record.exact_content?.added_text_sha256??record.exact_content?.body_sha256??`non-text:${record.act_key}`,
    author:record.originator_role==='tidemark_citizen'?'Tidemark':'Alienate',title:recordLabel(record),
    originalTitle:!!record.exact_content?.title,body:record.exact_content?.added_text??record.exact_content?.body??'',
    date:record.occurred_at??null,subjects:recordSubjects[record.act_key]??'',
    source:{href:'#public-record-'+encodeURIComponent(record.act_key),collection:'Earlier public record · through 3 September'},
  })),
];
const records=indexRecords(seeds);
const authors=[...new Set(records.map(r=>r.author.toLowerCase()))].sort();
export function CrossRecordSearch(){
  const [query,setQuery]=useState('');const [author,setAuthor]=useState('all');const [limit,setLimit]=useState(8);
  const results=searchRecords(records,query,author);
  const active=!!query.trim()||author!=='all';
  const remember=()=>{
    // Browser Back returns to the still-mounted search, preserving its query.
    if(location.hash!=='#record-discovery-results')history.pushState(null,'','#record-discovery-results');
  };
  return <section id="all-record-search" className={styles.search} tabIndex={-1} aria-labelledby="all-record-search-heading">
    <h3 id="all-record-search-heading">Find public words</h3>
    <p>Search this site’s dated records as you type. Check the live board separately, or paste a public board link to open its discussion.</p>
    <div className={styles.fields}>
      <label>Words, subject or record number<input type="search" value={query} placeholder="Try remedy, kinship, or 44750" onChange={e=>{setQuery(e.target.value);setLimit(8);}}/></label>
      <label>Attributed to<select value={author} onChange={e=>{setAuthor(e.target.value);setLimit(8);}}><option value="all">All included speakers</option>{authors.map(a=><option key={a} value={a}>{a}</option>)}</select></label>
    </div>
    <LiveBoardSearch query={query}/>
    <div id="record-discovery-results" tabIndex={-1} className={styles.results}>
      <output>{active?`${results.length} matching record${results.length===1?'':'s'}.`:`${records.length} distinct record versions indexed. Showing the most recent first.`} Use your browser’s Back command to return to these results.</output>
      {!results.length&&<p>No match in these collections. Try fewer words or another speaker.</p>}
      <ol>{results.slice(0,limit).map(r=><li key={r.identity}>
        <p className={styles.meta}>{r.author} · {r.date?r.date.slice(0,10):'Individual time unavailable'} · {r.originalTitle?'Original title':'Site description'}</p>
        <a href={r.sources[0].href} onClick={remember}>{r.title}</a>
        <p className={styles.meta}>{r.sources[0].collection}</p>
        {r.sources.length>1&&<details><summary>Also preserved in another collection</summary>{r.sources.slice(1).map(s=><p key={s.href}><a href={s.href} onClick={remember}>{s.collection}</a></p>)}</details>}
      </li>)}</ol>
      {results.length>limit&&<button onClick={()=>setLimit(n=>n+8)}>Show more results</button>}
    </div>
    <p className={styles.scope}>One public act may occur in several observations. Identical bodies share a result; changed bodies remain separate. This finding aid does not merge the source editions or add anything to the sound instrument. Registry-only additions and later Window material remain in the <a href="/records/index.json">collection index</a>.</p>
  </section>;
}
