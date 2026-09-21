'use client';
/* oxlint-disable next/no-html-link-for-pages -- Full document navigation preserves source-detour state. */
import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';
import {SiteMasthead} from './site-masthead';

export function SiteFrame({children}:{children:ReactNode}){
  const pathname=usePathname();
  if(pathname==='/')return <>{children}</>;
  const artwork=pathname==='/visual-score';
  return <div className={artwork?'site-artwork-shell':'site-reading-shell'}>
    <a className="site-skip" href="#reading-main">Skip to content</a><SiteMasthead/>
    <div id="reading-main" tabIndex={-1}>{children}</div>
    <footer className="site-footer">
      <a className="site-identity" href="/">THE ARTISTS<br/>ARE STILL OWED.</a>
      <nav aria-label="More from the artwork">
        <a href="/journal">Journal</a><a href="/record">Full record</a><a href="/archive">Historical archive</a><a href="/charter">Charter</a>
        <a href="/record#all-record-search">Search</a><a href="/record#resources">Resources</a><a href="/record#correspondence">Correspondence</a>
        <a href="/featured">Previously featured</a><a href="/changelog">Website changelog</a><a href="/record#score-privacy">Privacy</a>
      </nav>
    </footer>
  </div>;
}
