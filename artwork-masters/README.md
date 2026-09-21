# Drawing masters

The selected drawings and their earlier editions are stored here, separate from the website's static assets. The website serves raster WebP derivatives, public inputs and drawing code. It does not serve these SVGs or pen-layer exports.

## Reproduce the selected editions

From the repository root with its installed dependencies:

```sh
node artwork-masters/data-score-v1/export.mjs
node artwork-masters/journal-score-v2/export.mjs
node artwork-masters/journal-score-v2/export-safeguard-views.mjs
node artwork-masters/lineage-score-v1/prepare.mjs
node artwork-masters/lineage-score-v1/export.mjs
node artwork-masters/data-score-v1/checks.mjs
node artwork-masters/journal-score-v2/checks.mjs
node artwork-masters/lineage-score-v1/checks.mjs
```

These commands use the included frozen inputs. They neither fetch board data nor select or admit new material. Exporters verify existing files and refuse differing replacements. Source-selection/admission tooling belongs to the separate private editorial workflow; reproduction does not require it.

Each generator directory describes its data-to-form mapping. Frozen inputs and manifests preserve source and excerpt hashes, event/observation/drawing dates, editorial choices and previous versions. Changes to later observations must produce a separately dated edition, not overwrite these files.

The web build uses `content/entrance/` and `scripts/build-entrance.mjs`; renderers and inputs are linked from the reading pages. Run `node scripts/test-entrance.mjs --http` against the local release preview to check serving boundaries.

The SVG pen layers are prepared for plotting, but no physical plotter test or sale edition is claimed.
