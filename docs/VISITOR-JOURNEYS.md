# Visitor paths and tester filtering — v2 setup

Status: activation candidate, September 9, 2026. Private storage, verified remote backup/restore, private operator viewer, tester filtering controls and the nightly maintenance procedure are in place. The release receipt determines whether this candidate has been deployed; local code alone is not proof of live collection. This is a new measurement series, not reconstructed past visitor data. Artwork-use decisions remain deferred; no new opt-in interface is included. Existing opt-out, DNT and GPC remain.

## Identity and counts

- **Browser:** random first-party identifier in a signed, Secure, HttpOnly, SameSite=Lax cookie. Fixed one-year lifetime; clearing cookies or changing browsers creates another identifier. This is not a verified person.
- **Session:** client session identifier, shared between same-origin tabs where browser storage permits, renewed after 30 minutes without tracked activity and at most 24 hours. The server binds it to the signed browser ID. Session IDs cannot merge different browsers merely because they share an IP.
- **IP group:** the Cloudflare-supplied client address is normalized and converted to an HMAC using a private server key. Full IP addresses are not stored in the event table or browser payload. A private administrative tool can match an entered exact IP using the same key. IPv6 equivalents and IPv4-mapped addresses normalize consistently. Missing addresses remain ungrouped; they do not become one shared visitor. Cross-zone Worker sentinel IP is ignored.
- **Page:** separate page-load ID and event sequence, allowing duplicate delivery to be ignored while retaining real repeat visits.

Different browsers on the same IP count separately. The same browser on a changed IP remains the same browser. IP grouping is available for filtering, not an assertion that the visits belong to one person. Shared Wi-Fi, VPNs, cookie clearing, blocked collection and automation still limit interpretation. No fingerprint or human/bot certification is added.

## Exclusions

The privacy disclosure contains **Mark this browser as a tester**, persisted locally and synchronized with event delivery. The preference excludes that browser's prior and later observed sessions. It is reversible. A timestamp prevents an older delayed batch from undoing a newer tester preference. If collection is off or delivery fails, the local preference will synchronize only when delivery resumes; it is not a confirmed remote update just because the button changed.

Private functions support excluding a browser, one session, or an exact IP group. They keep an audit of enable/disable changes. A matched IP excludes the affected whole sessions, not all sessions by every browser ever seen on that IP. Summary reports distinguish total observed sessions, excluded sessions, included sessions and included browsers. Never relabel included browsers as verified humans. Turning a filter off restores the data to reports; it does not recreate deleted rows because exclusions do not delete them.

## Recorded paths

The initial hooks cover page arrivals (including deep links), named story sections, hash/history navigation, disclosures, board/source openings, conversation open/close, margin sound opening/play/stop/error, native instrument setting changes, story folding, and approximate foreground time. The sound iframe never creates a second visit. Text, full URLs, referrers, search queries, names and screen recordings are not collected. Public post/comment IDs can identify a selected source. The margin player exposes only its already-public act key for this purpose; audio mappings and source bodies are unchanged.

The new path collector and old aggregate collector do not both count a visit: server configuration chooses v2; otherwise the old collector is retained. V1 and v2 are separate measurement series, not silently joined into reconstructed history.

Limits: maximum 400 events/page, 48 buffered events, 12 events/request, 8 KiB/request. Each event is validated against fixed action/area vocabulary and bounded public identifiers. Retry deduplication is keyed by browser/page/sequence. Requests are same-origin and no-store. Foreground time is approximate, not attention. Browser close, network loss, page caps and buffering can leave gaps. Events have both server receipt and client time; ordering between separate tabs is approximate. Edition currently records the receiving deployment's configured source hash; late requests from older tabs are not proof that the visitor saw that newer edition. Full synth custom-canvas controls, exhaustive search hooks and source-heading visibility inside scrolling dialogs still need dedicated coverage.

## Private reporting and preservation

`journeyReport` produces counts and a bounded IP-group list; `journeyPage` is a keyset-paginated export interface. No unauthenticated reporting route exists. A separate private operator application on the operator's Mac calls `/api/journey-admin` with a server-held independent secret. Browser origins, missing/wrong credentials and public GET requests are refused. The bridge accepts only fixed bounded report, session, exclusion and pause operations, never arbitrary SQL, retention changes, verification resets or credential management. No token is sent to the viewer's browser. The loopback server checks Host, Origin and its own anti-CSRF token; it is not a remotely accessible administration website.

The viewer separates all sessions, included sessions, excluded sessions and included browsers, lists repeat visits per browser, and shows numerically ordered events in each selected session. The date window selects sessions with a received event in that UTC window; path details show the entire selected session. Sessions and events paginate explicitly. Network/filter lists are bounded (100 network groups per report/session,200 most recently changed filters); they are not represented as exhaustive. The application preserves error states and does not replace unavailable data with zero. Exclusions can be reversed; removing one cannot override another active exclusion or the browser's self-tester preference. It can pause/resume only the database pause flag, not deployment activation or capacity limits.

Default export rows omit network keys but retain browser/session IDs and therefore remain private data, not guaranteed anonymous material. `scripts/journey-csv.mjs` verifies a restored SQLite snapshot and streams ordered CSV, including or excluding test sessions. The private backup companion exports the owned D1 database, restores it locally, uploads to private R2, downloads it again, and checks its hash and SQLite integrity. The first real round-trip passed with the empty production schema; it is not evidence of collected readership. The viewer downloads the latest verified local CSV as a dated snapshot, including excluded visits and flags, not a live export. Do not put raw analytics or exports in this public repository. Large exports use a private database backup and this offline adapter, not repeated classification scans against the cloud database for each page.

No age-based deletion is installed. The operator prefers long-term preservation and exportability. Before production activation, wire the private database and archival capacity controls; do not treat this schema as an unlimited storage promise. Preserve the private HMAC/signing key securely: changing it affects visitor continuity and future matching against earlier IP groups. No key is included in code or configuration.

## Activation prerequisites

The operator activated R2 and approved the named resources and possible usage charges without a plan upgrade on September 9. Database `score-visitor-paths` and private bucket `score-visitor-archives` exist in the site's existing account; both migrations are applied. R2's managed public domain is disabled, no custom domains are attached, and no stored-object expiration is configured. `wrangler.journeys.json` declares the actual resources for the build and maintenance CLI. The activation candidate sets `JOURNEYS_ENABLED=1`; a separate signing key and independent operator key have been provisioned as secrets. Every publication supplies `JOURNEY_EDITION` as its verified neutral public source hash. Generated binding types must match the build configuration. A missing edition or verification still prevents collection.

`GET /api/journeys` only returns an enabled flag and protocol version. `POST` fails closed unless these exist: D1 binding `JOURNEYS`, private secret `JOURNEY_KEY` (32+ characters), source-hash setting `JOURNEY_EDITION`, `JOURNEYS_ENABLED=1`, rate-limit bindings `JOURNEY_RATE`/`JOURNEY_GLOBAL_RATE` and private R2 binding `JOURNEY_ARCHIVE`.

Before enabling: confirm actual backup/size checks are fresh, the private viewer and scheduled runbook work, the notice is accurate, and actual page/instrument behavior is verified. Follow the existing archive-before-publication procedure. Local Wrangler's login lacks D1 permissions; migration/export use the already connected Cloudflare API without broadening login scopes. The nightly runbook accounts for that distinction. The existing 23:00 America/New_York editorial task now performs private preservation checks separately; it must not activate tracking, rotate keys or clear pauses. It needs the operator's Mac and Codex running. No independent cloud scheduler was created. A same-origin header and signed visitor cookie are not bot authentication or complete abuse protection.

## Capacity controls

The second migration adds conservative pilot budgets: 5,000 event reservations per UTC day and 200,000 lifetime reservations in this database. Retries count toward reservations but never duplicate event rows. Reservations and event writes share one atomic batch; crossing either budget rolls back the entire batch. These are collection limits, not deletion deadlines or audience statistics. A new UTC day resets only daily availability; it does not reset the lifetime budget. No automatic pruning, budget increase or paid upgrade exists.

Collection also requires a verified archive and measured database-size check within the previous 48 hours. The initial migration leaves both unverified. The first remote verification was recorded only after the real R2 readback/restore and a fresh D1 size check (90,112 bytes). Future maintenance may update these timestamps only after actual checks, not simply because a schedule fired. At 350 MiB measured database size, or after the checks become overdue, collection stops. At 80% of the size/reservation threshold, the private viewer reports a warning and the nightly task must notify the operator. Routine successful checks remain quiet. Size between checks can change; reservation headroom is conservative, not an exact byte ceiling.

The private backup companion currently refuses exports over 256 MiB and stops before its conservative archive-size estimate plus that allowance reaches 9 GiB. SQL exports may exceed the underlying database's size, so a backup can require intervention before the 350 MiB collection threshold. It does not delete earlier snapshots to make space. These operational guards are not an account-wide billing cap or a promise of unlimited storage.

The proposed edge binding limits are 120 requests/minute per keyed network and 1,200/minute globally **per Cloudflare location**. Shared networks can be limited together. Cloudflare's rate limiter is permissive/eventually consistent, not a billing cap or exact global counter; atomic database reservations provide a separate bound on accepted event work. These safeguards do not guarantee zero charges or eliminate requests/read costs under abuse. Local tests use real simulated bindings or explicitly identified test stubs, never pretend that a remote archive was verified.

Deployment must preserve the real bindings, verified private archive/restore process, monitoring and operator reporting. If verification fails, collection stays off or is paused; do not silently discard history to restore ingestion.

## Verification commands

`node scripts/test-journeys.mjs` checks identities, IP normalization, namespaces, reversible retrospective filters, payload validation, duplicate delivery and export pagination with SQLite.

`node scripts/test-journeys-worker.mjs` uses the installed local Workers runtime and a local D1 binding. It does not create remote resources.

`node scripts/test-journey-capacity.mjs` tests freshness, edge refusal, atomic daily/lifetime budgets, rollback, UTC rollover and preservation. `node scripts/test-journey-csv.mjs` tests the private offline conversion and incomplete-backup refusal; it is not a remote archive test.

`node scripts/test-journeys-browser.mjs` uses Playwright in a fresh browser and intercepts all requests. Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` if the dependencies are bundled externally. This is an interaction fixture, not an assertion that every actual site control is covered.

Also run existing engagement and instrument-return tests, type checking and the fail-closed publication build. Local preview hostnames do not collect visitor paths.

`node scripts/test-journey-admin.mjs` checks authenticated reporting, request limits, numeric event order and pagination, exact-IP exclusion, restoration without data deletion, and pause/resume. The private console has its own desktop/phone browser tests outside this public repository. These tests use labelled local fixtures, never fabricated production readership.

References: [Cloudflare request headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/), [D1 prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/), [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
