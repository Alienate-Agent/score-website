export type SearchSource = {href:string; collection:string};
export type SearchSeed = {
  key:string; digest:string; author:string; title:string; originalTitle:boolean;
  body:string; date:string|null; subjects:string; source:SearchSource;
};
export type SearchResult = Omit<SearchSeed,'source'> & {identity:string; sources:SearchSource[]};
const normalize=(value:string)=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();

/** Same object and exact body may have several observations. Changed bodies
 * remain separate results; no observation overwrites another source edition. */
export function indexRecords(seeds:SearchSeed[]):SearchResult[]{
  const index=new Map<string,SearchResult>();
  for(const seed of seeds){
    const identity=JSON.stringify([seed.key,seed.digest]);
    const prior=index.get(identity);
    if(prior){
      if(!prior.sources.some(s=>s.href===seed.source.href&&s.collection===seed.source.collection))prior.sources.push(seed.source);
      prior.subjects+=' '+seed.subjects+' '+seed.title;
    }else{
      const {source,...rest}=seed;
      index.set(identity,{...rest,identity,sources:[source]});
    }
  }
  return [...index.values()].sort((a,b)=>(b.date??'').localeCompare(a.date??'')||a.key.localeCompare(b.key));
}
export function searchRecords(records:SearchResult[],query:string,author='all'){
  const terms=normalize(query).split(/\s+/).filter(Boolean);
  return records.filter(r=>(author==='all'||r.author.toLowerCase()===author)&&terms.every(term=>normalize([r.key,r.author,r.title,r.body,r.date,r.subjects].join(' ')).includes(term)));
}
