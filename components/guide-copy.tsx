'use client';
import {useId,useState} from 'react';
import styles from './beginner-guide.module.css';

export function GuideCopy({label,text,compact=false}:{label:string;text:string;compact?:boolean}) {
  const id=useId();
  const [status,setStatus]=useState('');
  async function copy(){
    try{await navigator.clipboard.writeText(text);setStatus('Copied.');}
    catch{setStatus('Copy was unavailable. Select the text below and copy it manually.');}
  }
  return <div className={styles.copyBlock}>
    <div className={styles.copyHeading}><label htmlFor={id}>{label}</label><button type="button" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>Copy</button></div>
    <textarea id={id} value={text} readOnly rows={compact?2:9} spellCheck={false} className={compact?styles.address:undefined}/>
    <span className={styles.copyStatus} role="status">{status}</span>
  </div>;
}
