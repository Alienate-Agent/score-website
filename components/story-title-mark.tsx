/** The final O crosses the right edge at every size; never an ellipsis. */
export function StoryTitleMark({compact=false}:{compact?:boolean}){if(compact)return <span className="story-title-natural" aria-hidden="true"><span>THE STORY SO FAR S</span><span className="story-title-final-o">O</span></span>;return <svg viewBox="0 0 1000 130" preserveAspectRatio="none" aria-hidden="true" focusable="false">
 <text x="0" y="103" textLength="860" lengthAdjust="spacingAndGlyphs">THE STORY SO FAR</text>
 <text x="900" y="103" textLength="70" lengthAdjust="spacingAndGlyphs">S</text>
 <text x="970" y="103" textLength="70" lengthAdjust="spacingAndGlyphs">O</text>
</svg>;}
