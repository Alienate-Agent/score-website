-- Conservative collection budgets, not retention deadlines. Nothing is deleted.
-- Reservations count retries too: they bound work, not measured readership.
CREATE TABLE journey_capacity (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  reserved_events INTEGER NOT NULL DEFAULT 0 CHECK (reserved_events >= 0),
  event_limit INTEGER NOT NULL DEFAULT 200000 CHECK (event_limit BETWEEN 1 AND 200000),
  daily_event_limit INTEGER NOT NULL DEFAULT 5000 CHECK (daily_event_limit BETWEEN 1 AND 5000),
  paused INTEGER NOT NULL DEFAULT 0 CHECK (paused IN (0,1)),
  archive_verified_at INTEGER NOT NULL DEFAULT 0,
  storage_bytes INTEGER NOT NULL DEFAULT 0 CHECK (storage_bytes >= 0),
  storage_checked_at INTEGER NOT NULL DEFAULT 0,
  CHECK (reserved_events <= event_limit)
);
INSERT INTO journey_capacity (id,reserved_events) SELECT 1,COUNT(*) FROM journey_events;
CREATE TABLE journey_daily_usage (
  day INTEGER PRIMARY KEY,
  reserved_events INTEGER NOT NULL CHECK (reserved_events >= 0),
  event_limit INTEGER NOT NULL CHECK (event_limit BETWEEN 1 AND 5000),
  CHECK (reserved_events <= event_limit)
);
