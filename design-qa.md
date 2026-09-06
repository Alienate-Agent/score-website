# Instrument first encounter — current scoped design QA

Originator sol_website. 5 September 2026 local / 6 September UTC. Scope: the new single-act entrance and its connections to the existing instrument/source reader. Not whole-site acceptance, public-release consent or unfamiliar-human testing.

## Current comparison

Evidence bundle: `../site-publication/visual-history/2026-09-05-instrument-entry/`.

- Source visual truth: `reference-desktop.png`, existing public instrument,1280×720 CSS/pixels. Final implementation: `after-desktop-top.png`, same dimensions, top of the same instrument route. Both opened in the same comparison input. The intended change replaces the initial blank selection/full apparatus with an Alienate first-act selection; it is not fidelity drift.
- Mobile source/implementation: `reference-mobile.png` and `after-mobile-top.png`,390×844 CSS/pixels, both top-of-page, opened together. No image modification/density conversion. The original palette, typography and navigation remain; the new act-oriented entrance replaces the early technical apparatus.
- `after-mobile-act.png` and `after-desktop.png` show the focused control region farther down, not matched top-of-page states. All text/buttons are readable at these captures, so a separate cropped image was unnecessary.
- The early `before-desktop.png` was taken while viewport sizing settled; it is preserved but not used for matched comparison. `after-desktop-initial.png` shows the intermediate duplicate title/quotation and more verbose entrance, not the final copy.

## Findings and iteration

- P2 fixed: original simple inspection opened the entire engine. It now opens a readable sentence/source/calculation without expanding the stage or engine. Both remain separately available.
- P2 fixed: initial implementation repeated Alienate's title as the adjoining quotation. The encounter heading now identifies the episode; the source quotation retains its distinct larger type. Initial/final desktop captures show the change.
- P2 fixed: the narrow/wide selector initially left the full instrument's displayed pitch setting stale. The shared change notification refreshes both views. Browser verification showed the full slider saying “voice110–880Hz”; using its Home setting correctly returned the simple selector to its explicit other-setting state.
- P2 fixed: following the source and returning could restore the default act. The eligible selected key now stays in the local URL. A repeat journey to post3581 and Back returned the sibling encounter with no playback.
- Expected design choice: stage and technical controls require opening one disclosure. They remain available, not discarded. Individual playback omits contextual layers; the full composition retains them.
- P3: long labels in the complete native selector still rely on native option presentation. The four suggested episodes are short; the selected title wraps outside the selector. Actual-device/user testing remains useful.

## Required fidelity surfaces

Typography: existing Georgia/serif display and source quotation, system text and inherited instrument control fonts. No font replacement. Narrow headings wrap; technical detail is deferred rather than made smaller.

Spacing/layout: same centered reading width and paper margins. Controls wrap;44px minimum targets. Narrow page width measured390px with no horizontal document overflow in the first encounter. Sticky narrow Stop remains visible in the selected-act capture. The complete stage retains its existing horizontal scroll area.

Color/tokens: existing paper/ink/border/focus accent retained. No new participant colors or meanings dependent on color alone. Formal contrast ratios not measured in this pass.

Images: no new raster/decorative assets or substitutes. Existing stage/patch diagrams remain intact behind the disclosure.

Copy: original source words are preserved. Site-authored episode descriptions and mapping explanation are distinct from them. The text-length example acknowledges UTF-16 counting and duration folding in optional depth. No claim of speech synthesis, citizen hearing or interpretation duty.

## Interaction/runtime evidence and limits

Native browser checked direct record selection, source inspection, wide/narrow variation, full-control synchronization, level0 playback, natural ending, Enter/Stop, Escape and source/Back without autoplay. Engine tests compare every original calculation with the prior version and test isolated scheduling/ending/cancellation. Input/body/inventory tests and privacy builds pass. These are distinct forms of evidence, not acoustic certification.

Instrument-only console checks were clear. A subsequent journey into the React story recorded its already-observed hydration mismatch; production reproduction remains an integrated-site issue. No all-session clean-console claim. A transient locator inspection timeout was resolved by fresh DOM inspection without restarting.

No remaining P0/P1/P2 finding in this tested first-encounter scope. Enlarged text, full keyboard traversal, screen-reader equivalence, actual sound quality/pressure and whole-site production checks remain outstanding for the full goal.

final result: passed

Next: narrative/artist-consequence revision and integrated accessibility/runtime verification before the operator release brief.

---

# Historical record-discovery QA — preserved from the preceding revision

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
