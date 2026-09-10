'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {correspondenceNotice,correspondenceNoticeVersion,correspondencePermission} from '@/lib/correspondence-notice';
import styles from './correspondence-form.module.css';

type Turnstile={render:(el:HTMLElement,options:{sitekey:string;action:string;size:string;callback:(token:string)=>void;'expired-callback':()=>void;'error-callback':()=>void})=>string;reset:(id:string)=>void;remove:(id:string)=>void};
declare global {interface Window {turnstile?:Turnstile}}
type Configuration={enabled:boolean;local:boolean;siteKey:string|null};
const isObject=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
export function CorrespondenceForm(){
 const [open,setOpen]=useState(false),[config,setConfig]=useState<Configuration|null>(null);
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[subject,setSubject]=useState(''),[message,setMessage]=useState(''),[website,setWebsite]=useState('');
 const [token,setToken]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState('');
 const challenge=useRef<HTMLDivElement>(null),widget=useRef<string|null>(null),status=useRef<HTMLDivElement>(null);
 const attempt=useRef<{payload:string;id:string}|null>(null);
 useEffect(()=>{
  if(!open||config)return;
  let active=true;
  fetch('/api/correspondence',{cache:'no-store',signal:AbortSignal.timeout(10000)}).then(r=>r.json()).then(v=>{
   if(active&&isObject(v))setConfig({enabled:v.enabled===true,local:v.local===true,siteKey:typeof v.siteKey==='string'?v.siteKey:null});
  }).catch(()=>{if(active)setConfig({enabled:false,local:false,siteKey:null});});
  return()=>{active=false;};
 },[open,config]);
 useEffect(()=>{
  if(!open||!config?.siteKey||sent)return;
  let active=true;let script=document.querySelector<HTMLScriptElement>('script[data-correspondence-turnstile]');
  const start=()=>{if(active&&window.turnstile&&challenge.current&&widget.current===null)widget.current=window.turnstile.render(challenge.current,{sitekey:config.siteKey!,action:'correspondence',size:'flexible',callback:setToken,'expired-callback':()=>setToken(''),'error-callback':()=>{setToken('');setError('The spam check is unavailable. Please retry it below.');}});};
  const failed=()=>{if(active)setError('The spam check could not load. Please try again later.');};
  if(window.turnstile)start();
  else if(script){script.addEventListener('load',start);script.addEventListener('error',failed);}
  else{script=document.createElement('script');script.dataset.correspondenceTurnstile='true';script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.addEventListener('load',start);script.addEventListener('error',failed);document.head.appendChild(script);}
  return()=>{active=false;script?.removeEventListener('load',start);script?.removeEventListener('error',failed);if(widget.current!==null){window.turnstile?.remove(widget.current);widget.current=null;}setToken('');};
 },[open,config,sent]);
 async function submit(e:FormEvent){
  e.preventDefault();if(busy||!config?.enabled)return;
  if(!config.local&&!token){setError('Please complete the spam check.');return;}
  setBusy(true);setError('');
  const fields={name:name.trim(),email:email.trim(),subject:subject.trim(),message,allowExcerpt:true,noticeVersion:correspondenceNoticeVersion,website};
  const payload=JSON.stringify(fields);if(attempt.current?.payload!==payload)attempt.current={payload,id:crypto.randomUUID()};
  try{
   const response=await fetch('/api/correspondence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...fields,id:attempt.current.id,token}),signal:AbortSignal.timeout(12000)});
   const result=await response.json();
   if(!isObject(result)||!response.ok||result.ok!==true||typeof result.id!=='string')throw Error(isObject(result)&&typeof result.error==='string'?result.error:'The message could not be confirmed. Please retry.');
   setSent(result.id);setName('');setEmail('');setSubject('');setMessage('');
  }catch(caught){setError(caught instanceof Error&&caught.name!=='TimeoutError'?caught.message:'The message could not be confirmed. Your text is still here; you can retry.');if(widget.current!==null)window.turnstile?.reset(widget.current);setToken('');}
  finally{setBusy(false);requestAnimationFrame(()=>status.current?.focus());}
 }
 return <details id="correspondence" data-reading-label="Correspondence" className={styles.correspondence} onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary><h2>Correspondence</h2><span>Questions, responses, ideas or something that isn’t working.</span></summary>
  <div className={styles.content}>
   <div className={styles.intro}><p>Write to the artist and the AI collaborators making this site.</p></div>
   <div>
   {sent?<div ref={status} tabIndex={-1} role="status" className={styles.receipt}><h3>{config?.local?'Saved in the local test inbox.':'Your message has been received.'}</h3><p>Thank you. Nothing has been published.</p><p className={styles.small}>Reference: {sent}</p><button type="button" onClick={()=>{setSent('');attempt.current=null;}}>Write another message</button></div>:
   <form onSubmit={submit}>
    {config?.local&&<p className={styles.preview}>Local preview: submissions stay in the local test inbox, not the public site's inbox.</p>}
    <fieldset disabled={busy}>
    <label htmlFor="correspondence-message">Message</label><textarea id="correspondence-message" required maxLength={6000} rows={7} value={message} onChange={e=>setMessage(e.target.value)} aria-describedby="correspondence-limit" />
    <p id="correspondence-limit" className={styles.small}>Up to 6,000 characters. Please leave out sensitive information about yourself or others.</p>
    <div className={styles.fields}>
     <label>Name or pseudonym <span>(optional)</span><input maxLength={80} value={name} onChange={e=>setName(e.target.value)} autoComplete="off"/></label>
     <label>Email for a reply <span>(optional)</span><input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
    </div>
    <p className={styles.small}>The name you provide may be credited. Leave it blank to remain anonymous. Your email is only for a reply and will not be published.</p>
    <label>Page or subject <span>(optional)</span><input maxLength={160} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="For example, the story or the sound instrument"/></label>
    <div className={styles.trap} aria-hidden="true"><label>Leave empty<input value={website} onChange={e=>setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"/></label></div>
    <div ref={challenge} className={styles.challenge}/>
    <div ref={status} tabIndex={-1}>{error&&<p role="alert">{error}</p>}{config&&!config.enabled&&<p role="status">The form is temporarily unavailable. Please try again later.</p>}</div>
    </fieldset>
    {error&&widget.current!==null&&<button type="button" onClick={()=>{setError('');if(widget.current!==null)window.turnstile?.reset(widget.current);}}>Retry spam check</button>}
    <p id="correspondence-notice" className={styles.notice}>{correspondenceNotice}</p>
    <button type="submit" aria-describedby="correspondence-notice" disabled={busy||!config?.enabled||(!config.local&&!token)}>{busy?'Sending…':config?correspondencePermission:'Loading form…'}</button>
    <noscript>This form needs JavaScript to submit securely.</noscript>
   </form>}
   </div>
  </div>
 </details>;
}
