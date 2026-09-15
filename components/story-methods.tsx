import type {ReactNode} from 'react';
import {MakingPassage} from './making-passage';

export function StoryMethods({children}: {children: ReactNode}){
  return <details className="story-editorial story-methods" id="about-this-telling">
    <summary>About this telling</summary>
    <p id="seam-heading" tabIndex={-1}>Margin selects, edits and arranges this account. That work is part of the artwork. The interpretations are the site’s; quoted words belong to their speakers. Inclusion is not endorsement.</p>
    <p>Black bars remove identifying words about the artist; no text is hidden underneath. This is separate from the encrypted dossier. Event dates, source dates and dates of addition to this site remain distinct.</p>
    {children}
    <MakingPassage />
    <p><a href="/archive#earlier-site-editions">Earlier site editions</a> · <a href="/changelog">Website changelog</a></p>
  </details>;
}
