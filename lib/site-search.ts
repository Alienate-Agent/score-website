import {searchTerms} from './search-excerpt';

export type SiteResult={href:string;page:string;title:string;body:string};
export const siteSearchStarts=['/','/visual-score','/charter','/agent-guide','/archive','/archive/earlier-present','/archive/conversations','/changelog','/featured','/studio/tidemark/index.html','/lens/index.html'];
const core=new Set(siteSearchStarts);
// Only public reading pages. Never crawl APIs, query-driven board readers,
// source downloads, private studies, external hosts or arbitrary local paths.
export function sitePagePath(href:string,base:string):string|null{
  try{const url=new URL(href,base);if(url.origin!==new URL(base).origin||url.search||url.username||url.password)return null;
    return core.has(url.pathname)||/^\/studio\/tidemark\/[a-z0-9-]+\.html$/.test(url.pathname)?url.pathname:null;
  }catch{return null;}
}
const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
const fold=(s:string)=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ');

/** Detached served HTML only: no scripts, attributes, inputs, hidden source
 * material or redactions become searchable. Collapsed public prose is retained. */
export function extractSitePage(doc:Document,path:string):SiteResult[]{
  const page=clean(doc.title).replace(/\s*[—|]\s*Score\s*$/i,'')||'Site';
  doc.querySelectorAll('script,style,template,noscript,nav,footer,button,input,select,textarea,canvas,svg,[hidden],[aria-hidden="true"],.sr-only,[data-redaction-id],.withheld-pronoun,.withheld-account,.withheld-quotation,#all-record-search,[data-site-search-ignore]').forEach(el=>el.remove());
  const root=doc.querySelector('main')||doc.body;
  const groups:SiteResult[]=[];
  let current:SiteResult={href:path,page,title:page,body:''};
  const commit=()=>{if(current.body||current.title!==page)groups.push(current);};
  for(const el of root.querySelectorAll('h1,h2,h3,h4,p,li,dt,dd,blockquote,pre,summary')){
    // Count nested prose once, and separate block boundaries with whitespace.
    if(!/^H[1-4]$/.test(el.tagName)&&el.querySelector('p,li,dt,dd,blockquote,pre'))continue;
    const text=clean(el.textContent||'');if(!text)continue;
    if(/^H[1-4]$/.test(el.tagName)){
      commit();
      const section=el.closest('section,article,details');
      const id=el.id||section?.id||section?.getAttribute('aria-labelledby')?.split(' ')[0];
      const anchor=id&&doc.getElementById(id)?'#'+encodeURIComponent(id):'';
      current={href:path+anchor,page,title:text,body:''};
    }else current.body+=(current.body?' ':'')+text;
  }
  commit();return groups;
}
export function searchSite(records:SiteResult[],query:string):SiteResult[]{
  const terms=searchTerms(query);if(!terms.length)return [];
  return records.filter(r=>terms.every(term=>fold(`${r.page} ${r.title} ${r.body}`).includes(term)))
    .sort((a,b)=>Number(terms.every(t=>fold(b.title).includes(t)))-Number(terms.every(t=>fold(a.title).includes(t))));
}
