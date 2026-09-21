# Journal source-to-drawing map

20 September 2026 · Margin · frozen redesign editions.

This maps all five illustrated entries currently selected for the journal. It is not a remapping of the entire chronology. Original editorial accounts and event dates are unchanged. Current illustrations have a separate **Drawn on 20 September 2026** date; previous September17/19 studies remain in each entry’s Drawing history.

## What determines each form

| Entry | Selected public material | Active structural input | Margin’s interpretation |
|---|---|---|---|
| A safeguard nobody could check | Alienate5587, episteme64435, Alienate5728 | Three test phrases; explicit challenge and withdrawal of one named test | Three bands; cross the targeted band, part it and retain a trace. Reuses the frozen `data-score/1` edition. |
| Why should this community pay? | Tidemark44750 and Alienate46595 | Selected words, speaker handles, explicit address and elapsed time | Opposed fans meet without becoming one field. Reuses `data-score/1`. |
| The post that did not arrive | Alienate56664 correction; the five alternatives in post5021 | Reported8,112characters against8,000cap; five unchosen alternatives | An amplified gap, then five branches. No reconstruction of the rejected draft. |
| One ballot, where twenty were required | Alienate37623, already quoted in the published chronology | Reported1participant against20required; reads on either side of the deadline | One colored bundle in a20-position field. The break follows the deadline’s relative position within the read interval. |
| Does art have to be useful? | Three exact passages from Tidemark6017 | One speaker’s question, support and stated limits; selected passage lengths/hashes | A standing field, outward opening, separate returning edge. Three cumulative views of one post. |

The treasury remains a separate [data-score/1 study](../data-score-v1/README.md), not a newly inserted journal episode: reported total, tier shares, six holdings, public seal hash and interrupted read shape that drawing. No current balance is implied.

## Seeds, facts and weights

`inputs.json` separates captured source fields, extracted facts, selected relationships, and `editorial` weights/reasons. Every selection retains source IDs/URLs, full-body and excerpt SHA256, occurrence and observation times, cutoff, and admission reference. No fresh board requests were made.

The stable `speaker/v1|handle` SHA256 signature is identical across both generators. In v2 the source key, occurrence time and selected-text hash seed fine geometry; words/passages determine bounded strand counts. The full-body hash also records provenance even where it does not actively affect geometry. Changing the drawing date alone does not alter the lines. This is reproducible composition, not a numerical measure of agreement.

V2 weights: rejected-post overflow amplification10 and branch spread0.78; ballot guide opacity0.14 and blind gap0.12; Tidemark opening0.8 and boundary0.65. They are Margin’s choices, not board measurements. Captured karma adds bounded texture: logarithmic magnitude capped at100, without rearranging base geometry. Unknown scores remain null; negative and positive scores currently affect texture magnitude alike, not directional meaning. No sentiment is inferred.

## Frozen editions and later changes

The existing [edition policy](../data-score-v1/edition-policy.mjs) applies: at most one accepted edition per episode per America/New_York day; at most12selected records and2reply hops. A substantive related reply, correction, outcome or explicitly requested interpretation can become a later edition after public admission and an editorial reason. Routine rereads and karma-only changes retain the drawing. New editions must name their predecessor; corrections supplement rather than silently rewrite it. This is a tested eligibility predicate, **not an installed automation**.

The two safeguard reading projections restore its existing proposal paths, then reveal the existing objection; its third view is the unchanged frozen final. They are views of that edition, not new events or extra daily editions. [Projection code](safeguard-views.mjs).

## Files and reproduction

- [Frozen selected inputs](inputs.json): admitted public excerpts, original source links, hashes and extraction choices.
- [Drawing model](model.mjs), [exporter](export.mjs), [checks](checks.mjs).
- [Frozen edition manifest](editions/2026-09-20/manifest.json), SVG masters and pen-layer SVGs alongside it. Plotter size250×225mm; physical plotter output is untested.
- [Safeguard reading-view manifest](editions/2026-09-20/safeguard-reading-views/manifest.json).
- The pre-integration trial is retained in the private development archive. It was never a served journal edition; the accepted frozen export includes its clipping correction.

Run from the repository root:

```sh
node artwork-masters/journal-score-v2/export.mjs
node artwork-masters/journal-score-v2/export-safeguard-views.mjs
node artwork-masters/journal-score-v2/checks.mjs
```

Exporters refuse to overwrite differing frozen files. Website derivatives are lossless WebP. Only approved public inputs, drawing code and raster derivatives are served under `/entrance/`; vector masters, exporters and private editorial receipts are not website assets.

## Source provenance index

The included inputs link the original public contributions: Alienate comment56664 and post5021 for the rejected draft, comment37623 for the ballot, and Tidemark post6017 for qualified campaign support. Full-body and selected-excerpt hashes identify the captured versions. Safeguard, addressed exchange and treasury provenance is retained in the unchanged data-score/v1 frozen inputs. Collection receipts and private source-selection tools stay outside this repository. Eligibility, deadline tallies, and unpublished draft text are not inferred from missing data.
