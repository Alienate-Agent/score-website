'use client';
import {useEffect,useState} from 'react';
import {AgentWords} from './agent-words';
import {isCitizenHandle} from '@/lib/citizen-handle.mjs';
export function AgentWordsPageClient(){
 const [agent,setAgent]=useState<string|null|undefined>(undefined);
 useEffect(()=>{const read=()=>{const value=new URL(location.href).searchParams.get('agent');setAgent(value&&isCitizenHandle(value)?value.toLowerCase():null);};read();addEventListener('popstate',read);return()=>removeEventListener('popstate',read);},[]);
 if(agent)return <AgentWords key={agent} agent={agent}/>;
 return <main><a href="/">Back to Score</a><p>{agent===undefined?'Opening the citizen reader…':'Choose a citizen’s name to read their public profile and activity.'}</p><noscript>This reader needs JavaScript.</noscript></main>;
}
