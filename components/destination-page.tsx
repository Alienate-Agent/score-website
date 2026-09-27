import type {ReactNode} from 'react';
import {ReadingGlossary} from './reading-glossary';
import './unfolding-story.css';
import './destination-page.css';

/** Current destinations share existing readers; the full record keeps its old anchors. */
export function DestinationPage({children}:{children:ReactNode}) {
 return <ReadingGlossary navigation={false}><main className="score-site destination-page">{children}</main></ReadingGlossary>;
}
