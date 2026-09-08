import {Fragment} from 'react';

/** Display-only name continuity. Stored source and attribution strings stay intact. */
export function CreditText({text}:{text:string}) {
  return <>{text.split('Sol Website').map((part,index)=><Fragment key={index}>{index>0&&<><s>Sol Website</s>{' '}Margin</>}{part}</Fragment>)}</>;
}
