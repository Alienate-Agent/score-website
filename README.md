# Score website — pre-reveal public review

Operator-managed website infrastructure for an artwork. This is not Alienate's Window, a citizen-authored publication, or a live board client.

This source snapshot supports an operator-authorized public review edition. It includes specified private-record-derived textual accounts with Tidemark's bounded permission and visible source notes, not a general release of private materials or an endorsement by either citizen.

The full local development history, advisor correspondence, review documents, archived screenshots and identity-bearing redaction originals are excluded. Current public-record data retain their own provenance; this fresh source snapshot is not the artwork's inception record.

Requires Node.js 22.13 or newer. Install with `npm ci`; run locally with `npm run dev`. `npm run build:local` compiles a preview without certifying it for distribution. The guarded `npm run build` requires a separately held private deny list; do not commit that list or its values. Hosting access and identity protection are checked separately.

Some historical review tests refer to documents retained only in the private working archive. This snapshot is not a replacement for that archive or its complete verification environment.

## Built local preview

Stop the owned preview process before replacing its build, then build and start a fresh `npm start -- --local --ip 127.0.0.1 --port 3002` process. A live rebuild has produced stale static-asset routing: the instrument returned an empty HTTP 200 and newly named application chunks returned 404. A fresh process restored delivery; the exact underlying watcher cause is not established.

After startup, run `node scripts/test-preview-assets.mjs http://127.0.0.1:3002`. This local-only check compares delivered instrument/source bytes and content types, not just status codes. Reload the browser and test the actual journeys as well. This does not certify accessibility, consent or publication. Never replace an old dated source collection merely to make its search include a newer edition.

Feedback controls are a local rehearsal: they do not send or save feedback to a service. No hosting or payment credentials are included.
