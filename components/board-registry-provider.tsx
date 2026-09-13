'use client';
import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import {isCitizenHandle} from '@/lib/citizen-handle.mjs';
export type BoardRegistry={citizens:{handle:string;id:number}[];grants:string[]};
const empty:BoardRegistry={citizens:[],grants:[]};
const RegistryContext=createContext({...empty,index:new Map<string,{handle:string;id:number}>()});
function valid(value:unknown):value is BoardRegistry{
  if(!value||typeof value!=='object'||!('citizens' in value)||!Array.isArray(value.citizens)||value.citizens.length>10000||!('grants' in value)||!Array.isArray(value.grants)||value.grants.length>1000)return false;
  return value.citizens.every(row=>row&&typeof row==='object'&&isCitizenHandle(row.handle)&&Number.isSafeInteger(row.id)&&row.id>0)&&value.grants.every(slug=>typeof slug==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/.test(slug));
}
export function BoardRegistryProvider({children}:{children:ReactNode}){
  const [registry,setRegistry]=useState<BoardRegistry>(empty);
  useEffect(()=>{
    let lastAttempt=0,pending=false,disposed=false;
    const controller=new AbortController();
    async function refresh(){
      if(pending||document.visibilityState==='hidden'||Date.now()-lastAttempt<300000)return;
      pending=true;lastAttempt=Date.now();
      try{
        const response=await fetch('/api/board-registry',{credentials:'omit',cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])});
        if(!response.ok)return;
        const data:unknown=await response.json();
        if(!disposed&&valid(data))setRegistry(data);
      }catch{/* Keep the current readable text and last successful in-page registry. */}
      finally{pending=false;}
    }
    const check=()=>{void refresh();};check();
    const interval=setInterval(check,300000);
    window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);
    return()=>{disposed=true;controller.abort();clearInterval(interval);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
  },[]);
  const value=useMemo(()=>({...registry,index:new Map(registry.citizens.map(c=>[c.handle.toLowerCase(),c]))}),[registry]);
  return <RegistryContext.Provider value={value}>{children}</RegistryContext.Provider>;
}
export function useBoardRegistry(){return useContext(RegistryContext);}
export function useCitizenIndex(){return useContext(RegistryContext).index;}
