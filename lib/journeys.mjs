import { UUID, visitorIdentity, keyedId, requestNetworkId, forgetVisitorCookie, networkId } from './journey-identity.mjs';
import {capacityStatus, capacityReservations} from './journey-capacity.mjs';

export const ACTIONS = ['view', 'section', 'navigate', 'return', 'details_open', 'details_close', 'conversation_open', 'conversation_close', 'source_open', 'glossary_open', 'search_result_open', 'sound_open', 'play', 'stop', 'sound_error', 'instrument_open', 'setting_change', 'story_collapse', 'story_restore', 'active', 'page_leave'];
export const AREAS = ['entrance', 'story', 'prelude', 'alienate', 'tidemark', 'encounters', 'present', 'conversations', 'score', 'instrument', 'glossary', 'sources', 'history', 'other', 'studio'];
const TARGETS = new Set(['', 'story-title', 'story-beginning', 'story-alienate', 'story-tidemark', 'story-tidemark-first-words', 'story-encounter', 'story-unwritten', 'connected-score', 'chronology', 'live-agent-activity', 'editorial-history', 'changelog', 'glossary', 'instrument']);
for (const target of ['studio-index','studio-001','studio-002','studio-town','studio-resources','studio-licensing','studio-shelf','studio-town-standalone']) TARGETS.add(target);
export const HEADERS = {'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff', 'Vary':'Cookie'};
const response = (status, body, extra = {}) => new Response(body === undefined ? null : JSON.stringify(body), {status, headers:{...HEADERS, ...(body === undefined ? {} : {'Content-Type':'application/json'}), ...extra}});
const privacyBlocked = request => request.headers.get('DNT') === '1' || request.headers.get('Sec-GPC') === '1';
export function ready(env) {
  return env.JOURNEYS_ENABLED === '1' && Boolean(env.JOURNEYS) &&
    typeof env.JOURNEY_RATE?.limit === 'function' && typeof env.JOURNEY_GLOBAL_RATE?.limit === 'function' &&
    typeof env.JOURNEY_ARCHIVE?.put === 'function' &&
    typeof env.JOURNEY_KEY === 'string' && env.JOURNEY_KEY.length >= 32 &&
    /^[0-9a-f]{7,40}$/.test(env.JOURNEY_EDITION || '');
}
export function journeyConfig(request, env) {
  return response(200, {enabled:ready(env) && !privacyBlocked(request), version:2});
}
export function validJourneyBatch(batch, now = Date.now()) {
  if (!batch || Object.keys(batch).sort().join(',') !== 'events,page,session,tester,testerAt,version' ||
      batch.version !== 2 || !UUID.test(batch.session) || !UUID.test(batch.page) ||
      typeof batch.tester !== 'boolean' || !Number.isSafeInteger(batch.testerAt) || batch.testerAt < 0 || batch.testerAt > now + 300000 || !Array.isArray(batch.events) ||
      batch.events.length < 1 || batch.events.length > 12) return false;
  const seen = new Set();
  return batch.events.every(e => {
    if (!e || Object.keys(e).sort().join(',') !== 'action,activeMs,area,at,seq,target' ||
        !Number.isSafeInteger(e.seq) || e.seq < 1 || e.seq > 400 || seen.has(e.seq) ||
        !ACTIONS.includes(e.action) || !AREAS.includes(e.area) ||
        typeof e.target !== 'string' || !(TARGETS.has(e.target) || /^(post|comment):[1-9][0-9]{0,9}$/.test(e.target)) ||
        !Number.isSafeInteger(e.at) || e.at < now - 86400000 || e.at > now + 300000 ||
        !Number.isSafeInteger(e.activeMs) || e.activeMs < 0 || e.activeMs > 30000 ||
        (e.action !== 'active' && e.activeMs !== 0)) return false;
    seen.add(e.seq); return true;
  });
}
async function readBatch(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks = []; let size = 0;
  while (true) {
    const {value, done} = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new RangeError('Too large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function ingestJourney(request, env, now = Date.now()) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) return response(403);
  if (privacyBlocked(request)) return response(204, undefined, {'Set-Cookie':forgetVisitorCookie});
  if (!ready(env)) return response(503);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return response(415);
  // Edge admission happens before parsing and database queries. These are
  // permissive per-location limits; the database budget below is global.
  try {
    if (!(await env.JOURNEY_GLOBAL_RATE.limit({key:'journeys-v2'})).success) return response(429, undefined, {'Retry-After':'60'});
    const network = await requestNetworkId(request, env.JOURNEY_KEY);
    if (!(await env.JOURNEY_RATE.limit({key:network || 'no-client-network'})).success) return response(429, undefined, {'Retry-After':'60'});
  } catch { return response(503); }
  let batch;
  try { batch = await readBatch(request); } catch (e) { return response(e instanceof RangeError ? 413 : 400); }
  if (!validJourneyBatch(batch, now)) return response(400);
  try {
    const capacity = await capacityStatus(env.JOURNEYS, now);
    if (!capacity.collecting) return response(503);
    const visitor = await visitorIdentity(request, env.JOURNEY_KEY, now);
    const session = await keyedId(env.JOURNEY_KEY, 'session-v1', `${visitor.id}:${batch.session}`);
    const network = await requestNetworkId(request, env.JOURNEY_KEY);
    const statements = [...capacityReservations(env.JOURNEYS, batch.events.length, capacity.daily_event_limit, now), env.JOURNEYS.prepare(`INSERT INTO journey_visitors (visitor_id, first_seen, last_seen, self_tester, tester_at)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(visitor_id) DO UPDATE SET last_seen=excluded.last_seen,
      self_tester=CASE WHEN excluded.tester_at>=journey_visitors.tester_at THEN excluded.self_tester ELSE journey_visitors.self_tester END,
      tester_at=MAX(journey_visitors.tester_at,excluded.tester_at)`)
      .bind(visitor.id, now, now, Number(batch.tester), batch.testerAt)];
    for (const e of batch.events) {
      const eventId = `${visitor.id}:${batch.page}:${e.seq}`;
      statements.push(env.JOURNEYS.prepare(`INSERT OR IGNORE INTO journey_events
        (event_id, visitor_id, session_id, page_id, sequence, received_at, client_at, action, area, target, active_ms, network_key, edition)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(eventId, visitor.id, session, batch.page, e.seq, now, e.at, e.action, e.area, e.target, e.activeMs, network, env.JOURNEY_EDITION));
    }
    await env.JOURNEYS.batch(statements);
    return response(204, undefined, visitor.setCookie ? {'Set-Cookie':visitor.setCookie} : {});
  } catch {
    // No IP, cookie, payload, SQL text or stack in client-visible errors/logs.
    return response(503);
  }
}

// Administrative functions: callable only from a trusted private reporting tool.
// Deliberately no public GET-report or mutation route.
export async function setExclusion(db, {kind, value, reason='tester', enabled=true}, now = Date.now()) {
  const validValue = kind === 'visitor' ? UUID.test(value) : /^[0-9a-f]{64}$/.test(value || '');
  if (!['visitor', 'network', 'session'].includes(kind) || !validValue ||
      !['operator', 'tester', 'automation', 'other'].includes(reason) || typeof enabled !== 'boolean') throw new Error('Invalid exclusion');
  await db.batch([
    db.prepare(`INSERT INTO journey_exclusions (kind,value,reason,enabled,updated_at) VALUES (?,?,?,?,?)
      ON CONFLICT(kind,value) DO UPDATE SET reason=excluded.reason, enabled=excluded.enabled, updated_at=excluded.updated_at`)
      .bind(kind, value, reason, Number(enabled), now),
    db.prepare('INSERT INTO journey_exclusion_history (kind,value,reason,enabled,changed_at) VALUES (?,?,?,?,?)')
      .bind(kind, value, reason, Number(enabled), now),
  ]);
}
export async function setIPExclusion(db, secret, ip, options = {}) {
  const value = await networkId(secret, ip);
  if (!value) throw new Error('Invalid IP address');
  return setExclusion(db, {...options, kind:'network', value});
}
export async function journeyReport(db, {from, to}) {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to <= from || to - from > 366 * 86400000) throw new Error('Invalid report window');
  const summary = await db.prepare(`SELECT COUNT(*) AS sessions,
      COALESCE(SUM(s.excluded),0) AS excluded_sessions,
      COUNT(DISTINCT CASE WHEN s.excluded=0 THEN s.visitor_id END) AS included_browsers,
      COALESCE(SUM(CASE WHEN s.excluded=0 THEN 1 ELSE 0 END),0) AS included_sessions
    FROM journey_session_classification s
    WHERE EXISTS (SELECT 1 FROM journey_events e WHERE e.session_id=s.session_id AND e.received_at>=? AND e.received_at<?)`)
    .bind(from,to).first();
  const groups = await db.prepare(`SELECT e.network_key, COUNT(DISTINCT e.visitor_id) AS browsers,
      COUNT(DISTINCT e.session_id) AS sessions
    FROM journey_events e WHERE e.received_at>=? AND e.received_at<? AND e.network_key IS NOT NULL
    GROUP BY e.network_key ORDER BY sessions DESC LIMIT 100`).bind(from,to).all();
  return {from,to,...summary, networks:groups.results, network_limit:100,
    note:'Browsers and observed sessions, not verified people. IP groups can include multiple people. Exclusions are reversible.'};
}
export async function journeyPage(db, {from, to, after='', limit=500, includeExcluded=false}) {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to<=from || to-from>366*86400000 ||
      !Number.isSafeInteger(limit) || limit<1 || limit>1000 || typeof after !== 'string' || after.length>100 || typeof includeExcluded !== 'boolean') throw new Error('Invalid export window');
  // Keyset pagination is explicit. A limit is never represented as a full export.
  const rows = await db.prepare(`SELECT e.event_id,e.visitor_id,e.session_id,e.page_id,e.sequence,
      e.received_at,e.client_at,e.action,e.area,e.target,e.active_ms,e.edition,s.excluded
    FROM journey_events e JOIN journey_session_classification s USING(session_id,visitor_id)
    WHERE e.received_at>=? AND e.received_at<? AND e.event_id>? AND (?=1 OR s.excluded=0)
    ORDER BY e.event_id LIMIT ?`).bind(from,to,after,Number(includeExcluded),limit+1).all();
  const more = rows.results.length>limit; const events=rows.results.slice(0,limit);
  // Network keys are available only to private filtering, not the default export.
  return {events,next:more?events.at(-1).event_id:null,includeExcluded};
}
