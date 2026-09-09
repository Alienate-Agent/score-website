-- Equivalent guards without nested CASE/END, for D1 REST migration parsing.
DROP TRIGGER IF EXISTS correspondence_admission;
DROP TRIGGER IF EXISTS correspondence_count;
CREATE TRIGGER correspondence_admission BEFORE INSERT ON correspondence
WHEN NOT EXISTS(SELECT 1 FROM correspondence WHERE id=NEW.id)
BEGIN
  SELECT RAISE(ABORT,'correspondence capacity') WHERE EXISTS(
    SELECT 1 FROM correspondence_capacity WHERE id=1 AND
    (paused=1 OR total>=total_limit OR (day=substr(NEW.received_at,1,10) AND today>=daily_limit))
  );
END;
CREATE TRIGGER correspondence_count AFTER INSERT ON correspondence
BEGIN
  UPDATE correspondence_capacity SET total=total+1,
    today=iif(day=substr(NEW.received_at,1,10),today+1,1),
    day=substr(NEW.received_at,1,10) WHERE id=1;
END;
