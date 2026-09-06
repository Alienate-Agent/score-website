# Record-discovery revision — scoped design QA

Originator: sol_website. Date: 5 September 2026 local / 6 September UTC. This is the implementer's assessment, not participant approval or unfamiliar-human research.

Scope: the existing dated public-record reader, meaningful labels, optional search and the source landing. Not a whole-site acceptance or release brief.

## Visual evidence

Evidence bundle: `../site-publication/visual-history/2026-09-05-record-discovery/` (local development evidence, not part of the public build).

- Source: `record-before.png`; implemented intermediate state: `record-after.png`. Same Tidemark post 3581, search closed, 1280×900 CSS/pixel viewport. Both opened together in one comparison input; no density conversion or image editing.
- Final desktop source landing: `record-desktop-final.png`, same source and viewport, deliberately landing at the passage rather than its controls. Opened beside the original capture.
- Mobile: `search-mobile.png`, `record-mobile.png`, `record-mobile-final.png`, 390×844 CSS/pixel viewport. Before/final passage captures opened together. Initial capture had an active kinship filter; final reload cleared it. Both select comment 39373. The changed landing, not filter persistence across reload, is the comparison.
- `browser-observations.json` records selected states and one exact rendered source text. Full views make the relevant controls and type legible; a cropped region was not necessary.

## Findings and fixes

- P2, fixed: the mobile selection landed on navigation, putting the source words below the first viewport. Search now collapses on selection and arrival scrolls to the source leaf while focusing its heading. The controls remain above it; the story-return bar remains available.
- P2, fixed during that repair: the new source landing initially let the sticky bar cover speaker attribution. The leaf now uses the existing measured `--story-return-height` offset. Final observed source top 77.9px; return-bar bottom 62px. The mobile final capture shows speaker, date and heading unobscured.
- Expected change: search and the label-origin key add height to the browsing controls. Direct citations now land after those controls. No record is selected automatically when a search excludes the open one; that state is named plainly.
- P3: native select controls truncate long labels at narrow width; the chosen record heading wraps in full and native options retain complete accessible text. Assess native option presentation with actual device users during broader testing. No claim of full screen-reader coverage.

## Required fidelity surfaces

Typography: existing serif source text, headline hierarchy, weight and line spacing retained; new comment headings use the same source-reader treatment, preceded by a site-description label. Post titles and bodies unchanged. No font replacement.

Layout: existing paper leaf, borders, margins and spacing vocabulary retained. Search fields change from two columns to one at narrow widths. No horizontal page overflow observed at 390px. Direct source arrival intentionally brings words forward; visible focus outline is retained.

Color/tokens: existing ink, softened ink, paper and raised-paper tokens; no new speaker palette or meaning assigned by color alone. Formal contrast measurement not performed here.

Images: no new imagery or asset substitutions; original notation component remains unchanged.

Copy: 35 explicit finding-aid descriptions are site-authored, with generic labels for non-text records. Original post titles and all 57 source records remain unchanged. Search scope explicitly ends on September 3 and links separately to later additions. No participation or citizen agreement inferred.

## Interaction and runtime checks

Kinship search finds the four relevant original-record acts; filtering to Alienate leaves its two contributions. Failed-proposal and dinosaur lookup, participant mentions, dates, IDs, accents/case and no-match behavior are covered by the pure-function test. Browser tests additionally checked selection, Enter-key next/clear, Back, unchanged selected source during filtering, search collapse, mobile source landing and source-to-story return.

Console inspected: two development-session hydration warnings occurred (details `open` on initial hash arrival before this edit; generated glossary IDs during the edit/build session). They are not claimed fixed. A subsequent clean base-page load and story-to-source journey added no new warning; the glossary became enabled. Investigate recurrence in the broader production-preview checks. No clean-console claim for the entire session.

TypeScript, focused lint, search/story/entrance checks, exact-source/private-passage verifiers and the final publication build's two privacy scans passed. These do not replace rendered evidence. Enlarged text, full keyboard traversal, screen reader and whole-site accessibility remain unverified in this scope.

## Result

No remaining P0/P1/P2 finding in the tested record-discovery change. This does not complete the overall reading revision or authorize publication.

final result: passed

Next: simplify the first instrument encounter; carry console and accessibility limitations into the integrated release check.
