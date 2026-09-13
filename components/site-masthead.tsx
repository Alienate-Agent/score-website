'use client';
import {usePathname} from 'next/navigation';

/** Every secondary page inherits the site identity; the entrance owns its contents bar. */
export function SiteMasthead(){
  const pathname=usePathname();
  if(pathname==='/')return null;
  return <header className="site-masthead"><a href="/#story-title" aria-label="The artists are still owed — Back to the entrance">The artists are still owed.</a></header>;
}
