# Reading strip and glossary — current scoped design QA

Originator sol_website,6SeptemberUTC/5SeptemberEastern. Existing book layout, source31e964a. Scope: glossary placement, record-return clearance, enlarged narrative/definitions/source reading and built-runtime journeys. Not complete goal acceptance or publication permission.

## Evidence and comparison

Bundle`../site-publication/visual-history/2026-09-05-reading-access/`. Source`before-mobile.png` and implementation`after-mobile-final.png` opened together, same encounter route390×844CSS/pixels. Production`production-mobile.png` confirms the built result. Desktop source`../site-publication/visual-history/2026-09-05-artist-consequences/after-desktop.png` and implementation`production-desktop.png` opened together, same Compose chapter1280×900CSS/pixels. No density conversion or image editing. New source control state in`source-mobile.png`; focused larger-type views in`large-type-mobile.png`,`large-type-glossary.png`,`large-type-source-mobile.png`. Full-size captures make these controls readable; no further crop needed.

## Findings and fixes

- P2 fixed: bottom-right glossary covered mobile sentences. At widths≤1200px it is now a top-edge strip, consuming53px at the tested default type. Its measured height offsets the source return bar and anchor scrolling. Verified source return begins at53px and its heading is below both controls. Above1200px no strip height; original margin control retained.
- P1 fixed in the encountered development state: hot-updated UI lost glossary provider identity. Shared context separated from UI/style module. Reload/style restoration and production journeys succeeded. Earlier error logs retained; this does not identify every historic hydration warning as the same cause.
- Expected trade-off: less vertical space, more at enlarged type. The repair replaces an isolated obstruction with a consistent reading edge. No new branding/navigation destination or design direction.

## Required surfaces

Typography: existing font families/sizes retained. A temporary local200% root-font test (computed32px) exercised narrative, glossary and source at390px. No horizontal clipping; long headings/metadata wrap and require more scrolling. Test override removed; production16px checked. This is not native browser zoom or a screen-reader certificate.

Spacing/layout: matched desktop remains unchanged. Mobile strip and return align at the page edge; native dialog fits358×812 in390×844 at enlarged type.53px default strip and95.79px enlarged strip are measured, not hard-coded. Both source controls remain available. No horizontal document overflow in tested states.

Colors/tokens: same paper/ink/borders/focus accents.20 source-level palette pairs pass; minimum4.796:1. Actual opacity/cascade/notation contrast not certified by that test.

Images/assets: none added or substituted. Existing notation/sonic visuals unchanged.

Copy: two Sol Advisor source refinements adopted; no citizen quotation, approved introduction, permissions or corpus change. Strip retains the existing glossary label and definitions.

## Interaction/runtime

Keyboard open/search/Escape/focus restoration; Tab from initial glossary to Begin, Enter into Prelude; inline selected definition; source selection, direct-hash reload and return. Production warning/error log empty for these journeys. Initial unmatched Close× selector corrected to its actual accessible name Close; no application error inferred. TypeScript/glossary/story/entrance/source-verifiers/build/privacy pass. Existing glossary lint findings remain, not reported green.

No remaining P0/P1/P2 in this tested repair scope. Larger integrated notation/instrument access, actual assistive-technology/audible quality and full completion audit remain separate. The prior narrower QA below is historical evidence, not a claim these later checks had already happened.

final result: passed

Next: complete the integrated visual-score/instrument access checks and release brief.

---

# Historical artist-consequence narrative QA

Originator sol_website. 5 September Eastern / 6 September UTC. Scope: copy additions and consolidation inside the established book layout, not full-site accessibility acceptance. Source3463290; same theme, routes and assets. No public release.

## Comparison evidence

Source visual truth `../site-publication/visual-history/2026-09-05-artist-consequences/before-desktop.png`; implementation `after-desktop.png`. Both chapter-top views opened together in the same comparison input,1280×900 CSS and pixel dimensions, no density conversion. Layout at the chapter entrance is unchanged: the new passage comes after the first public declaration, not ahead of it.

Focused new content: `artist-terms-desktop-final.png`,1280×900, expanded terms with keyboard focus and adjoining main paragraphs. Mobile `artist-terms-mobile.png` and `representation-mobile.png`,390×844, plus`source-mobile.png` for the new source journey. These are new-content checks, not falsely matched before/after mobile views. Full-size captures make the relevant type readable; no additional crop needed. Early`artist-terms-desktop.png` was captured before scroll settled and is not used for new-content verification.

## Findings and fidelity surfaces

- Typography: same serif narrative/display families, sans-serif controls and monospaced dating. New practical detail inherits the existing smaller aside type; it is legible in the checked desktop/mobile views. No new font or narrowed reading width.
- Layout/rhythm: existing column and margins preserved. Main consequences precede an optional practical explanation. Native disclosure works with Enter and has visible keyboard focus.390px document width matches the viewport; no horizontal overflow in the tested journey.
- Colors/tokens: unchanged paper/ink/rules. No participant recoloring, color-only meaning or new contrast claim.
- Images/assets: no new or substituted assets. Existing book/notation surfaces unchanged.
- Copy: normative requirements attributed to the frozen charter, current success not asserted. Artist selection/voice/AI-authorship question remain unresolved. Citizen quotation exact; protected introduction/source collections unchanged. The date of this explanation is separate from event dates and earlier evidence cutoff.

New source link selects Alienate comment19378 with focused source heading; keyboard Return restores the encounter chapter. This tab's checked error/warning log was empty. Earlier development hydration warnings remain unresolved and require a production test. This pass is not an acoustic or assistive-technology certification.

No actionable P0/P1/P2 regression from the narrative changes. No visual correction loop was necessary. Known inherited narrow-screen glossary overlap is explicitly assigned to the integrated reading/accessibility pass; it prevents whole-goal acceptance, not attribution of a new copy regression. Enlarged text, full keyboard traversal and nonvisual equivalence remain unverified.

final result: passed

Next: integrated glossary/reading access and production runtime checks; then the complete-goal release brief.

---

# Historical instrument first-encounter QA

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
