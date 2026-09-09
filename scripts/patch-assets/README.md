# Patch-console assets

- `jack.png`, `knob.png`, `plug.png`: generated specifically for Margin's operator-selected front-panel instrument, 8 September 2026. Alpha PNG source assets; only functional cable geometry and measured visualizations are drawn in code.
- `p5.min.js`: unmodified p5 **1.11.11**, from the `p5@1.11.11` npm package; upstream [Processing/p5.js](https://github.com/processing/p5.js). SHA-256 `1343f616bf9914da8253faae00201ea5f72772916998bc6add4c2a07e00a662c`.
- `p5-LICENSE.txt`: corresponding upstream LGPL 2.1 license. No p5.sound addon, telemetry, or runtime CDN connection is added.

The source privacy scanner's Windows-path heuristic matches three regular-expression literals in this exact upstream minified library. Its reviewed exception is limited to match offsets 163208, 163250 and 673106, this digest, and the two source/generated library paths. All private deny-list and other structural checks still run. Any byte change invalidates the exception and needs review; do not widen it to all vendor JavaScript.
