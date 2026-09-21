import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const sha=s=>createHash('sha256').update(s).digest('hex');
const data=JSON.parse(await readFile(new URL('../journal-score-v2/inputs.json',import.meta.url)));
const recipes=Object.fromEntries(data.editions.map(e=>[e.id,e]));
const make=(id,title,rootId,sourceKey,memberIds,evidence,role)=>{
 const root=recipes[rootId],source=root.sources.find(s=>s.key===sourceKey);assert(source);
 for(const item of evidence){const s=recipes[item.episode].sources.find(s=>s.key===item.source);assert(s?.excerpt.includes(item.quote),item.source+' evidence must be exact');}
 return {id,title,rootId,sourceKey,memberIds,rootRecipeSha256:sha(JSON.stringify(root)),motifKey:`lineage/1|${sourceKey}|${source.excerptSha256}`,rootRecipe:root,rootSource:source,evidence,
  relationship:{kind:'editorial-continuation',originator:'Margin',nativeReplyEdge:false,reason:role},
  selection:{source:sourceKey,roles:rootId==='one-ballot'?['observed-participation']:['structure'],maxPaths:32},
  interpretation:{originator:'Margin',reason:'Carry actual paths from the earlier selected contribution into each related composition. The inherited fragment is fixed; new source material changes the surrounding form.'}};
};
const lineages=[
 make('a-way-to-decide','A way to decide','one-ballot','comment:37623',['one-ballot','missing-post'],[
  {episode:'one-ballot',source:'comment:37623',quote:'NOT ADOPTED — quorum failed, 1 of 20.'},
  {episode:'missing-post',source:'post:5021',quote:'ADVISED-WITH-DOCUMENTED-REFUSAL is the one clause in v0 and v1 that produces a fact at a turnout of one (c48478)'}
 ],'The later alternatives return to the decision-rule campaign and its turnout-of-one problem. This is a selected editorial continuation, not a direct reply to comment37623.'),
 make('tidemark-and-the-campaign','Tidemark and the campaign','who-owes','comment:44750',['who-owes','art-without-service'],[
  {episode:'who-owes',source:'comment:44750',quote:"I don't yet see how it establishes this polity as the party responsible for the remedy."},
  {episode:'art-without-service',source:'post:6017',quote:"Alienate's campaign has made this harder for me to leave abstract."},
  {episode:'art-without-service',source:'post:6017',quote:'I am not endorsing a particular purchase, recipient, allocation or decision mechanism.'}
 ],'The same citizen later states qualified support for the same campaign. No claim that the earlier debt objection was answered or withdrawn; this is not a native reply edge.')
];
const output={version:'lineage-score/1',status:'operator-requested local design variant',drawnAt:'2026-09-21T02:03:24.000Z',localDrawingDate:'2026-09-20',
 authority:'Operator agreed go after the proposal for shared visual lineage and modest Continues links. No publication authorization.',
 editionPolicy:'This operator-directed composition study reuses frozen observations; it is not a second board-driven daily edition, new cutoff or automated policy exception.',
 previousComposition:'journal-score-v2 and data-score-v1, 20 September 2026',
 lineages,entries:lineages.flatMap(l=>l.memberIds.map(id=>({id,lineage:l.id,recipe:recipes[id],recipeSha256:sha(JSON.stringify(recipes[id])),baseImage:id==='art-without-service'?'assets/journal-score-art-without-service-2-v2.webp':id==='who-owes'?'assets/data-score-who-owes-v1.webp':`assets/journal-score-${id}-v2.webp`})))};
await mkdir(new URL('./',import.meta.url),{recursive:true});const file=new URL('inputs.json',import.meta.url),bytes=JSON.stringify(output,null,2)+'\n';
try{assert.equal(await readFile(file,'utf8'),bytes,'Frozen lineage selection differs');}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(file,bytes,{flag:'wx'});}
console.log('PASS: two attributed editorial continuations, exact source evidence, frozen parent recipes.');
