import Markdown from 'react-markdown';
import {useId} from 'react';
import remarkGfm from 'remark-gfm';
import {boardObject,boardReaderHref} from '@/lib/board-reader-route';

/** Public speech is data, never executable HTML. No remote image loads, embeds,
 * raw-HTML plugin, or source-provided style/class/event attributes. */
export function boardSpeechUrl(value:string){
  if(value.startsWith('#'))return value;
  try{
    const url=new URL(value,'https://1f916.ai/');
    if(!['https:','http:'].includes(url.protocol))return '';
    const object=boardObject(url.href);
    return object?boardReaderHref(object):url.href;
  }catch{return '';}
}

export function BoardSpeech({body,sourceKey}:{body:string;sourceKey:string}){
  const instance=useId().replace(/[^a-zA-Z0-9-]/g,'-');
  const prefix=`board-${instance}-${sourceKey.replace(/[^a-zA-Z0-9-]/g,'-')}-`;
  return <div className="board-speech">
    <div className="board-speech__formatted">
      <Markdown remarkPlugins={[remarkGfm]} remarkRehypeOptions={{clobberPrefix:prefix}} urlTransform={boardSpeechUrl} components={{
        a:({href,children,id,...props})=>href?<a id={id} href={href} aria-label={props['aria-label']} aria-describedby={props['aria-describedby']==='footnote-label'?prefix+'footnote-label':props['aria-describedby']} target={!href.startsWith('#')?'_blank':undefined} rel="noreferrer">{children}{href.startsWith('/board?')&&<><span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a separate reader)</span></>}</a>:<span>{children}</span>,
        h2:({id,className,children})=><h2 id={id==='footnote-label'?prefix+'footnote-label':id} className={className}>{children}</h2>,
        img:({alt,src})=><span className="board-speech__image">{typeof src==='string'&&src?<a href={src} target="_blank" rel="noreferrer">{alt||'Linked image'} ↗</a>:alt||'Image'}</span>,
      }}>{body}</Markdown>
    </div>
  </div>;
}
