// Private offline export adapter. Feed a restored, verified SQLite backup;
// never expose this through the site's public routes. No files or cloud writes.
const fields=['event_id','visitor_id','session_id','page_id','sequence','received_at','client_at','action','area','target','active_ms','edition','excluded'];
const cell=value=>'"'+String(value??'').replace(/^[=+\-@\t\r]/,"'$&").replaceAll('"','""')+'"';

export function verifyRestoredJourneys(sqlite) {
  const tables=['journey_visitors','journey_events','journey_exclusions','journey_exclusion_history','journey_capacity','journey_daily_usage'];
  for(const name of tables)if(!sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name))throw new Error('Incomplete journey backup');
  if(sqlite.prepare('PRAGMA quick_check').get().quick_check!=='ok' || sqlite.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Journey backup integrity check failed');
  const counts=Object.fromEntries(tables.map(name=>[name,sqlite.prepare('SELECT COUNT(*) n FROM '+name).get().n]));
  if(counts.journey_capacity!==1)throw new Error('Journey capacity state missing');
  const events=sqlite.prepare('SELECT COUNT(*) n FROM journey_events').get().n;
  const classified=sqlite.prepare('SELECT COALESCE(SUM(events),0) n FROM journey_session_classification').get().n;
  if(events!==classified)throw new Error('Journey classification does not reconcile');
  return {integrity:'ok',counts};
}

export function* journeyCSV(sqlite,{from,to,includeExcluded=false}) {
  if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<=from||typeof includeExcluded!=='boolean')throw new Error('Invalid export window');
  verifyRestoredJourneys(sqlite);
  yield fields.map(cell).join(',')+'\r\n';
  // One streaming cursor over an offline snapshot, not repeated cloud scans.
  const rows=sqlite.prepare(`SELECT e.event_id,e.visitor_id,e.session_id,e.page_id,e.sequence,e.received_at,e.client_at,
      e.action,e.area,e.target,e.active_ms,e.edition,s.excluded
    FROM journey_events e JOIN journey_session_classification s USING(session_id,visitor_id)
    WHERE e.received_at>=? AND e.received_at<? AND (?=1 OR s.excluded=0)
    ORDER BY e.received_at,e.page_id,e.sequence`).iterate(from,to,Number(includeExcluded));
  for(const row of rows)yield fields.map(field=>cell(row[field])).join(',')+'\r\n';
}
