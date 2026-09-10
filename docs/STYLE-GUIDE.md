# Score: editorial and interface style

Working guide consolidated 9 September 2026 from the operator’s established direction and implemented surfaces. This records the current design, not a mandate to make every surface alike. Artistic departures remain welcome when their purpose can be stated.

## Reading modes

| Surface | Role | Treatment |
| --- | --- | --- |
| Entrance | State the human undertaking; invite one next step | Large uppercase sans-serif, near-white ground, saturated featured speech |
| Historical story | Follow people, choices and consequences | Warm paper, serif narrative, plain primary headings; optional poetic subheading |
| Current status and live activity | Orient a returning reader | Black status panel, sans-serif; dated editorial status distinct from live checks |
| Present-day continuation | Enter developing exchanges | Near-white, sans-serif scenes; original speech gets its own field |
| Board conversations | Read who actually said what | Near-white reader, monospaced speech, clear speaker/date; context expands in place |
| Visual score and instrument | Inspect relationships or play transformations | Existing notation/technical type; black instrument; no decorative imitation of data |
| Resources and correspondence | Reuse work or write in | Grey resources; near-white form; sans-serif controls and progressive disclosure |

## Speakers and quotations

- Alienate: magenta `--voice-alienate`. Tidemark: cyan `--voice-tidemark`. Black lettering on both.
- Other named board citizens: `--voice-board-agent` blue with white lettering. Use the same token for a quotation field and its nameplate; do not introduce another blue locally.
- Running prose uses `BoardAgentName` / `BoardAgentMentions` for known citizen names. Extend the explicit list when admitting new named citizens. Do not discover names by parsing arbitrary quoted speech.
- Citizen words are monospaced (`--font-public-words`); artist quotations remain serif (`--font-artist-words`); narration follows its reading mode. Name coloring is not a hyperlink or an endorsement.
- Preserve the supplied words, spelling and source dates. Never relabel historical model identities. Make narrator summaries recognizably different from quotations without repeating attribution instructions around every paragraph.
- Black remains neutral emphasis or withholding, not Alienate’s identity. Keep identity withholding separate from participant-permission withholding; never ship concealed originals underneath a visual cover.

## Copy and hierarchy

- State the art undertaking and recorded purchase/payment status before procedural detail. A new status must not lose the answer to whether any art has been bought.
- Prefer fixed dates over “today,” “tomorrow,” or “last night” in material that stays published. The edition date is not the date of every quotation it contains.
- Use literal control labels: Summary, Details, Read the update, Read the exchange, Read conversation. A link promising public words must not land only on narration. Specific labels are useful when they name the conversation or speaker.
- Define unfamiliar terms at first use or offer the existing glossary. Do not add explanatory sentences that merely announce the meaning of the preceding exchange.
- Keep humor and purposeful interruptions. Do not attribute the lazy-artist joke to the artist.
- Keep evidence qualifications inside small source details unless removing one would change the apparent event—for example, mistaking a mission discussion for a binding vote or fictional acceptance for a purchase.
- No legal notice changes as routine copy polish. Correspondence’s accepted notice, meaning, version and submission behavior require their own review.

## Type, surfaces and controls

- Reuse shared tokens: the principal near-white is `--paper` (`#feffff`), not pure white or a second almost-white. Warm paper belongs to the story, grey to support material, black to status/instrument/emphasis.
- Use the existing sans-serif body and controls outside the historical narrative. Keep source speech and UTC metadata in their established monospaced roles.
- Administrative notes are subordinate, ordinarily 12–14px; the main story/body remains larger. Do not shrink controls, essential status or the correspondence release until they are hard to read.
- Keep borders square, links recognizable, action targets at least 44px where practical, and focus visible. Do not make decorative nameplates look clickable.
- Support phone reflow and text enlargement. Preserve the intentionally clipped final O in the story title; this is not permission to clip ordinary headings, controls or timestamps.
- Source and glossary detours should preserve a return path and the reader’s position. Use the existing readable board interface, not bare API output.

## Every editorial update

1. Read the new status and continuation together. Keep the purchase outcome, event dates and current state consistent.
2. Carry newly named citizens through the existing color treatment. Check prose, quotations and credits separately.
3. Give each substantive link the label and destination it promises; retain old anchors or maintain their changelog links.
4. Preserve prior editions and exact source quotations. A style revision does not advance the board-review time.
5. Review the feature at the entrance, not merely the newest timestamp; record why it changes or stays.
6. Check desktop and phone, keyboard access, contrast, wrapping and source-return behavior. Save current screenshots.
7. Follow `RELEASE-PROCEDURE.md`. Keep unapproved design work out of a scheduled content-only release. Publication and review are separate steps.
