'use client';
import {useEffect,useState} from 'react';
import {extractSitePage,searchSite,sitePagePath,siteSearchStarts,type SiteResult} from '@/lib/site-search';
import {searchExcerpt} from '@/lib/search-excerpt';
import styles from './cross-record-search.module.css';

type Index={records:SiteResult[];pages:number;missed:number};
let indexPromise:Promise<Index>|null=null;
async function loadIndex():Promise<Index>{
  const pending=[...siteSearchStarts],seen=new Set(pending),records:SiteResult[]=[];
  let pages=0,missed=0;
  while(pending.length){
    const batch=pending.splice(0,4);
    await Promise.all(batch.map(async path=>{
      try{
        const response=await fetch(path,{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(12000)});
        if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('page');
        const html=await response.text();if(html.length>3_000_000)throw Error('size');
        const doc=new DOMParser().parseFromString(html,'text/html');
        for(const a of doc.querySelectorAll('a[href]')){
          const next=sitePagePath(a.getAttribute('href')!,location.origin+path);
          if(next&&!seen.has(next)){
            seen.add(next);if(seen.size<=60)pending.push(next);else missed++;
          }
        }
        records.push(...extractSitePage(doc,path));pages++;
      }catch{missed++;}
    }));
  }
  return {records,pages,missed};
}
export function SiteTextSearch({query,remember}:{query:string;remember:()=>void}){
  const [index,setIndex]=useState<Index|null>(null),[limit,setLimit]=useState(6),[attempt,setAttempt]=useState(0);
  const active=query.trim().length>0;
  useEffect(()=>setLimit(6),[query]);
  useEffect(()=>{
    if(!active)return;let cancelled=false;
    (indexPromise??=loadIndex()).then(value=>{if(!cancelled)setIndex(value);});
    return ()=>{cancelled=true;};
  },[active,attempt]);
  const results=index?searchSite(index.records,query):[];
  return <section className={styles.results} aria-labelledby="site-search-heading" data-site-search-ignore>
    <h4 id="site-search-heading" className={styles.visuallyHidden}>On this site</h4>
    {!active?<p>Enter words above to search the story and this site’s pages.</p>:<>
      <p role="status">{!index?'Searching site pages…':`${results.length} matching site section${results.length===1?'':'s'} across ${index.pages} pages.`}</p>
      {!!index?.missed&&<p>Some site pages could not be indexed. Available results are shown. <button onClick={()=>{indexPromise=null;setIndex(null);setAttempt(n=>n+1);}}>Retry site search</button></p>}
      {index&&!results.length&&<p>No site text matched. Board results are separate below.</p>}
      <ol>{results.slice(0,limit).map((r,i)=>{const excerpt=searchExcerpt(r.body,query);return <li key={r.href+':'+r.title+':'+i}>
        <p className={styles.meta}>Site · {r.page}</p><a href={r.href} onClick={remember}>{r.title}</a>
        <p className={styles.siteExcerpt}>{excerpt.before?'… ':''}{excerpt.parts.map((p,j)=>p.match?<mark key={j}>{p.text}</mark>:<span key={j}>{p.text}</span>)}{excerpt.after?' …':''}</p>
      </li>;})}</ol>
      {results.length>limit&&<button onClick={()=>setLimit(n=>n+6)}>Show more site results</button>}
    </>}
  </section>;
}
