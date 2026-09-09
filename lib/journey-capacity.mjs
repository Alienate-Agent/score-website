export const STORAGE_STOP_BYTES = 350 * 1024 * 1024;
export const CHECK_MAX_AGE = 48 * 60 * 60 * 1000;

export async function capacityStatus(db, now = Date.now()) {
  const state = await db.prepare('SELECT * FROM journey_capacity WHERE id=1').first();
  if (!state) return {collecting:false, reason:'not_initialized'};
  const recent = at => Number.isSafeInteger(at) && at > 0 && at <= now && now-at <= CHECK_MAX_AGE;
  const day = Math.floor(now/86400000);
  const usage = await db.prepare('SELECT reserved_events FROM journey_daily_usage WHERE day=?').bind(day).first();
  const dailyReserved = usage?.reserved_events || 0;
  const reason = state.paused ? 'paused' : !recent(state.archive_verified_at) ? 'archive_check_due' :
    !recent(state.storage_checked_at) ? 'storage_check_due' : state.storage_bytes >= STORAGE_STOP_BYTES ? 'storage_capacity' :
    state.reserved_events >= state.event_limit ? 'event_capacity' : dailyReserved >= state.daily_event_limit ? 'daily_capacity' : null;
  return {collecting:reason === null, reason, ...state, daily_reserved:dailyReserved,
    warning:state.reserved_events >= state.event_limit*0.8 || state.storage_bytes >= STORAGE_STOP_BYTES*0.8,
    storage_stop_bytes:STORAGE_STOP_BYTES, check_max_age_ms:CHECK_MAX_AGE};
}

// Run inside the SAME atomic D1 batch as visitor and event writes. CHECK
// constraints arbitrate concurrent requests; a failed reservation rolls back
// the entire batch. A retry can consume another reservation, not another event.
export function capacityReservations(db, count, limit, now) {
  return [
    db.prepare('UPDATE journey_capacity SET reserved_events=reserved_events+? WHERE id=1').bind(count),
    db.prepare(`INSERT INTO journey_daily_usage (day,reserved_events,event_limit) VALUES (?,?,?)
      ON CONFLICT(day) DO UPDATE SET reserved_events=journey_daily_usage.reserved_events+excluded.reserved_events,
      event_limit=excluded.event_limit`).bind(Math.floor(now/86400000),count,limit),
  ];
}
