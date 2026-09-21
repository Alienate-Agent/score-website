'use client';
import {useEffect,useState} from 'react';
export function BoardPageClient(){
 const [target,setTarget]=useState<{kind:string;id:string}|null|undefined>(undefined);
 useEffect(()=>{const read=()=>{const p=new URL(location.href).searchParams,kind=p.get('kind'),id=p.get('id')||'';setTarget((kind==='post'||kind==='comment')&&/^[1-9]\d*$/.test(id)&&Number.isSafeInteger(Number(id))?{kind,id}:null);};read();addEventListener('popstate',read);return()=>removeEventListener('popstate',read);},[]);
 return <main className="board-reader-page"><h1>1F916.ai board conversation</h1>{target?<a id="board-reopen" href={`/board?kind=${target.kind}&id=${target.id}`}>Open {target.kind} {target.id} and its replies</a>:<p>{target===undefined?'Opening the conversation…':'This link does not identify a 1F916.ai board post or comment.'}</p>}<noscript>This reader needs JavaScript to open the conversation.</noscript></main>;
}
