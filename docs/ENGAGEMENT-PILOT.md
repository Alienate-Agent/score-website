# Engagement pilot v1

Operator requested selected interaction tracking to distinguish exploration from brief visits. Implemented by Sol Website; this measures use of the interface, not an agent's interpretation or a reader's assent.

## What the operator can learn

Compare `view` against `visible_30s`, `visible_120s`, and `explore`, separately for site and instrument. These are page-load counts, not unique people or cross-page sessions. A page can qualify for both sustained reading and exploration; do not add the percentages. A short page visit with no event is not necessarily a bounce: the reader might have found what they needed, blocked collection, or lost connectivity.

`section_seen` records that a heading entered the central viewport, once per named area per load. It does not prove its content was read. The five story areas distinguish the beginning, Alienate, Tidemark, encounter and present. Deep-link arrivals are not completion of earlier story sections.

`details_open`, `source_open`, `glossary_open`, and `instrument_open` record bounded forms of investigation. Play and replay events record button attempts, not verified audible playback. `setting_change` records native instrument input/select changes, not values. Custom canvas/knob manipulation is not yet covered. `client_error` records only that an uncaught browser error occurred, never its message or stack. Handled failures and every broken link are not covered.

## Privacy and limitations

Only version, surface, event category, area, count and platform timestamp reach dataset `score_engagement_v1`. No cookies, persistent reader identifier, fingerprint, full URL, referrer, query, entered text or playback source selection. Cloudflare handles ordinary request connection information; the application does not copy it into this dataset. The only browser storage is the opt-out preference. DNT and GPC suppress collection. A footer disclosure offers opt-out; previous events cannot be located by person and are not erased by that switch. Retention follows Analytics Engine's current 90-day window.

The browser sends once per event/area/page load, at most 60 events, in batches of at most 12. No retries; losses are possible. Visible time is sampled in 5-second increments and excludes background time; visible does not mean attentive. Reloads count again. No cross-page journey reconstruction or unique-person count is claimed. Source action categories are an initial subset, not an exhaustive click map. A same-origin check is not bot authentication: forged requests can inflate these low-stakes counts. Never treat these statistics as a vote, payment record or civic evidence.

Production hostname alone collects. Local previews do not send. Tests use surface `test`, excluded from readership queries. Turning off the script/binding disables the pilot. No citizen authority, public speech or sonification mapping changes.

## Private reporting

Use the authenticated Cloudflare Analytics Engine SQL interface; no public reporting endpoint or query credential is shipped. Weighted counts account for platform sampling:

```sql
SELECT blob2 AS surface, blob3 AS event, blob4 AS area,
       SUM(_sample_interval * double1) AS occurrences
FROM score_engagement_v1
WHERE timestamp >= NOW() - INTERVAL '7' DAY AND blob2 != 'test'
GROUP BY surface, event, area
ORDER BY surface, event, area
```

Report counts and the observation window before percentages, especially with small samples. Initial report should distinguish sustained reading, active exploration, areas reached, instrument attempts and error signals. Test/operator visits without opting out can contribute; no human/bot certification is claimed.

## Cost reference

Checked Cloudflare's Analytics Engine pricing on 7 September 2026: Workers Free lists 100,000 points/day and 10,000 queries/day; the page currently says usage billing has not started. This does not promise permanent free pricing or remove Worker request limits. No subscription upgrade authorized or performed.

Sources: https://developers.cloudflare.com/analytics/analytics-engine/pricing/ and https://developers.cloudflare.com/analytics/analytics-engine/limits/
