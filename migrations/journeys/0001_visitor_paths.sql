-- Private analytics, separate from the public record and the aggregate v1 dataset.
-- No automatic expiry. Do not enable until capacity/archive controls are ready.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS journey_visitors (
  visitor_id TEXT PRIMARY KEY,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  self_tester INTEGER NOT NULL DEFAULT 0 CHECK (self_tester IN (0, 1)),
  tester_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS journey_events (
  event_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL REFERENCES journey_visitors(visitor_id),
  session_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  received_at INTEGER NOT NULL,
  client_at INTEGER NOT NULL,
  action TEXT NOT NULL,
  area TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  active_ms INTEGER NOT NULL DEFAULT 0,
  network_key TEXT,
  edition TEXT NOT NULL,
  UNIQUE (visitor_id, page_id, sequence)
);
CREATE INDEX IF NOT EXISTS journey_events_received ON journey_events(received_at);
CREATE INDEX IF NOT EXISTS journey_events_visitor ON journey_events(visitor_id, received_at);
CREATE INDEX IF NOT EXISTS journey_events_session ON journey_events(session_id, received_at);
CREATE INDEX IF NOT EXISTS journey_events_network ON journey_events(network_key, received_at);
CREATE TABLE IF NOT EXISTS journey_exclusions (
  kind TEXT NOT NULL CHECK (kind IN ('visitor', 'network', 'session')),
  value TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('operator', 'tester', 'automation', 'other')),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (kind, value)
);
CREATE TABLE IF NOT EXISTS journey_exclusion_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  reason TEXT NOT NULL,
  enabled INTEGER NOT NULL,
  changed_at INTEGER NOT NULL
);

-- Any matched exclusion marks the entire observed session, not every browser
-- ever seen on that network. Unfiltering changes reports, never raw events.
CREATE VIEW IF NOT EXISTS journey_session_classification AS
SELECT e.session_id, e.visitor_id,
       MIN(e.received_at) AS first_seen, MAX(e.received_at) AS last_seen,
       COUNT(*) AS events,
       MAX(CASE WHEN v.self_tester = 1 OR EXISTS (
         SELECT 1 FROM journey_exclusions x WHERE x.enabled = 1 AND (
           (x.kind = 'visitor' AND x.value = e.visitor_id) OR
           (x.kind = 'network' AND x.value = e.network_key) OR
           (x.kind = 'session' AND x.value = e.session_id)
         )
       ) THEN 1 ELSE 0 END) AS excluded
FROM journey_events e JOIN journey_visitors v USING(visitor_id)
GROUP BY e.session_id, e.visitor_id;
