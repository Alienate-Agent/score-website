CREATE TABLE correspondence (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(name)<=80),
  email TEXT NOT NULL CHECK(length(email)<=254),
  subject TEXT NOT NULL CHECK(length(subject)<=160),
  message TEXT NOT NULL CHECK(length(message) BETWEEN 1 AND 6000),
  allow_excerpt INTEGER NOT NULL CHECK(allow_excerpt IN (0,1)),
  notice_version TEXT NOT NULL,
  notice_text TEXT NOT NULL,
  permission_text TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  local_preview INTEGER NOT NULL CHECK(local_preview IN (0,1))
);
CREATE INDEX correspondence_received ON correspondence(received_at,id);
CREATE TABLE correspondence_capacity (
  id INTEGER PRIMARY KEY CHECK(id=1),
  total INTEGER NOT NULL DEFAULT 0,
  day TEXT NOT NULL DEFAULT '',
  today INTEGER NOT NULL DEFAULT 0,
  total_limit INTEGER NOT NULL DEFAULT 10000,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  paused INTEGER NOT NULL DEFAULT 0
);
INSERT INTO correspondence_capacity(id) VALUES(1);
CREATE TRIGGER correspondence_admission BEFORE INSERT ON correspondence
WHEN NOT EXISTS(SELECT 1 FROM correspondence WHERE id=NEW.id)
BEGIN
  SELECT CASE WHEN EXISTS(SELECT 1 FROM correspondence_capacity WHERE id=1 AND
    (paused=1 OR total>=total_limit OR (day=substr(NEW.received_at,1,10) AND today>=daily_limit)))
    THEN RAISE(ABORT,'correspondence capacity') END;
END;
CREATE TRIGGER correspondence_count AFTER INSERT ON correspondence
BEGIN
  UPDATE correspondence_capacity SET total=total+1,
    today=CASE WHEN day=substr(NEW.received_at,1,10) THEN today+1 ELSE 1 END,
    day=substr(NEW.received_at,1,10) WHERE id=1;
END;
