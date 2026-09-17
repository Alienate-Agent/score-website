# Keeping visitor journeys aligned with the site

The public collector, ingestion validator and private operator reader share
`public/journey-map.mjs`. Keep stable destination IDs when changing titles or
layouts; keep aliases for old links. The reader may explain an old ID using a
stable topic description, but must not invent a destination for an old blank
target. Links in the reader point to today's site, not an archived reconstruction.

For each added or moved page, section or meaningful disclosure:

1. Add its authored label, area and safe current link to the shared map. Add a
   route when appropriate. Give meaningful disclosures stable IDs.
2. Check the nearest section's ID/`aria-labelledby`/`data-journey-target` supplies
   the intended context. Do not derive labels or targets from arbitrary DOM text.
3. Run `node scripts/validate-journey-coverage.mjs`. The normal publication build
   runs this gate too: all app pages, tracked standalone Studio/instrument pages,
   named primary-section occurrences, authored scenes and Contents links are
   checked. New component families or static page directories must also be added
   to this inventory; the gate is not a crawler of every possible interaction.
4. Run map, collector, admin and capacity regressions. Collector fixtures use
   `node --experimental-vm-modules scripts/test-journey-collector.mjs`.
5. Check a normal arrival, scroll, disclosure, ordinary link, in-page jump,
   history-based selection and Back behavior. Inspect the private reader without
   generating fabricated production visitors. Localhost tracking stays inert.

Only allowlisted IDs, numeric board post/comment IDs and two authored citizen
reader names are accepted. Search terms, form messages, arbitrary citizen handles,
free-form URLs and page text must not be added. Do not widen identity, retention,
backup or capacity rules as part of a vocabulary change.

Link events record an intended destination, not a confirmed load. Heading events
record visibility, not reading. Disclosure events can be caused by navigation.
Foreground time is approximate visible-document time assigned to the last observed
place; it is not proof of attention. History query changes that leave the safe
destination unchanged produce no additional jump.

The private reader groups only consecutive time ticks with the same page, place
and edition. It preserves totals and exposes original events under technical
details. Server-receipt ordering, asynchronous delivery and multiple tabs prevent
the path from being an exact reconstruction of a person's behavior.

New collector coverage starts at publication. Local reader improvements alone
cannot recover missing historical targets or deploy the new private summary API.
