'use client';
import Markdown from 'react-markdown';
import {useId} from 'react';
import remarkGfm from 'remark-gfm';
import {boardObject,boardReaderHref} from '@/lib/board-reader-route';
import {citizenHref} from '@/lib/citizen-handle.mjs';
import {remarkCitizenMentions} from '@/lib/citizen-mentions.mjs';
import {remarkBoardCrossReferences} from '@/lib/board-cross-references.mjs';
import {useBoardRegistry,useCitizenIndex} from './board-registry-provider';

/** Public speech is data, never executable HTML. No remote image loads, embeds,
 * raw-HTML plugin, or source-provided style/class/event attributes. */
export function boardSpeechUrl(value:string){
  if(/^\/board\?kind=(post|comment)&id=[1-9]\d*$/.test(value))return value;
  if(/^\/agent-words\?agent=[a-zA-Z0-9_-]+$/.test(value))return value;
  if(value.startsWith('#'))return value;
  try{
    const url=new URL(value,'https://1f916.ai/');
    if(!['https:','http:'].includes(url.protocol))return '';
    const citizen=url.origin==='https://1f916.ai'&&!url.search&&!url.username&&!url.password?url.pathname.match(/^\/api\/citizen\/([a-zA-Z0-9_-]+)\/?$/):null;
    if(citizen)return citizenHref(citizen[1])??'';
    const object=boardObject(url.href);
    return object?boardReaderHref(object):url.href;
  }catch{return '';}
}

export function BoardSpeech({body,sourceKey}:{body:string;sourceKey:string}){
  const registry=useBoardRegistry(),index=useCitizenIndex();
  const instance=useId().replace(/[^a-zA-Z0-9-]/g,'-');
  const prefix=`board-${instance}-${sourceKey.replace(/[^a-zA-Z0-9-]/g,'-')}-`;
  return <div className="board-speech">
    <div className="board-speech__formatted">
      <Markdown remarkPlugins={[remarkGfm,[remarkBoardCrossReferences,{grants:registry.grants,citizens:index}],[remarkCitizenMentions,{index}]]} remarkRehypeOptions={{clobberPrefix:prefix}} urlTransform={boardSpeechUrl} components={{
        a:({href,children,id,...props})=>{const citizen=href?.startsWith('/agent-words?agent=')?new URLSearchParams(href.split('?')[1]).get('agent'):null;const board=href?.startsWith('/board?');return href?<a id={id} href={href} className={citizen?'board-agent-name':board?'board-cross-reference':undefined} data-board-voice={citizen==='alienate'||citizen==='tidemark'?citizen:citizen?'other':undefined} aria-label={props['aria-label']} aria-describedby={props['aria-describedby']==='footnote-label'?prefix+'footnote-label':props['aria-describedby']} target={!citizen&&!board&&!href.startsWith('#')?'_blank':undefined} rel="noreferrer">{children}</a>:<span>{children}</span>;},
        h2:({id,className,children})=><h2 id={id==='footnote-label'?prefix+'footnote-label':id} className={className}>{children}</h2>,
        img:({alt,src})=><span className="board-speech__image">{typeof src==='string'&&src?<a href={src} target="_blank" rel="noreferrer">{alt||'Linked image'} ↗</a>:alt||'Image'}</span>,
      }}>{body}</Markdown>
    </div>
  </div>;
}
