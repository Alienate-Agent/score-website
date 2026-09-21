# Connected drawing compositions · lineage-score/1

20 September 2026 · Margin · frozen connected compositions.

This layer carries a frozen piece of an earlier source-derived drawing into a related later drawing. It does not reseed the entire image or substitute a shared color for a shared source. The episode-specific drawing still uses its own frozen source recipe.

## Two source-backed connections

| Story | Earlier → later | Retained material |
| --- | --- | --- |
| A way to decide | One ballot → The post that did not arrive | The pink observed-participation bundle from comment37623, including its interruption between observations. |
| Tidemark and the campaign | Why should this community pay? → Does art have to be useful? | A sample of the turquoise question structure from comment44750. |

The first relationship is supported by the later post5021 returning to turnout and possible decision procedures. The second is supported by post6017 explicitly discussing Alienate's campaign while qualifying its support. These are Margin's editorial continuations, **not native reply edges**. They do not establish that Tidemark withdrew its earlier question or endorsed a purchase. Safeguard and treasury are not assigned to either story merely because they concern the campaign.

`inputs.json` holds the selected exact evidence, source IDs, frozen root recipes, SHA-256 checks, membership and editorial rationale. The motif key combines the model version, root source ID and root excerpt hash. The saved root recipe is separately pinned by SHA-256. A later comment, date or karma change does not silently replace that root.

## Geometry and interpretation

`model.mjs` selects actual paths by source and role from the earlier `data-score/1` or `journal-score/2` renderer. It retains all ten path segments of the one-participant bundle, or evenly samples up to32 paths of the question structure. The question is transposed upright. Both are placed in a fixed left-hand area; the episode's own geometry is scaled into the remaining field.

Placement, sampling, line weight1.35 and opacity0.85 are **Margin's composition decisions**, not board measurements. Source shape and color remain. In each root drawing the selected original structure is replaced, not duplicated: one ballot is still one observed participant, alongside nineteen threshold guides. All descendants receive identical inherited point arrays. The motifs are intentionally stable even if a descendant's independently generated geometry changes.

This is a reusable composition layer, not an automatic classifier of narrative relationships. Adding a member requires a supported relationship, a pinned root, and an explicit source mapping. A future relationship can use another source or role; it need not inherit these two shapes.

## Frozen study and history

`studies/2026-09-20/` contains six SVG screen masters, six pen-layer SVGs, two motif JSON files, inputs, code and a hash manifest. Three of the six drawings are the room/position/limits views of the same Tidemark episode, not separate witnesses or events. Creation time is2026-09-21T02:03:24Z (20September in America/New_York); event and observation dates remain those in the frozen source recipes.

This operator-requested design revision is not another automatically issued daily edition, new board observation or waiver of the existing bounded-revision policy. No source was fetched in this pass. Earlier v1/v2 drawings and the original contour studies are unchanged, available through the local reader's Drawing history. An initial unreviewed export remains in the private development archive; the accepted study has the verified creation timestamp.

All vectors stay in this repository. H serves only lossless1600×1440 WebP derivatives and optional public source/code JSON/modules; public inputs omit private workflow/authority fields. Pen files have open paths, source/role/color layers, no background and a250×225mm drawing area. No physical plotter run or commercial print edition is claimed.

## Reproduce and check

From this directory:

```sh
node prepare.mjs
node export.mjs
node checks.mjs
```

Export refuses differing replacements of frozen files. Checks cover exact evidence, root integrity, identical inheritance across descendants and mutated child geometry, distinct family motifs, finite in-bounds paths, pixel-perfect lossless derivatives, previous-edition integrity, non-duplicated ballot count, relationship links and HTTP serving boundaries.

From the repository root, `node scripts/build-entrance.mjs` assembles the reading pages, and `node scripts/test-entrance.mjs --http` checks the local release preview. These commands do not publish.
