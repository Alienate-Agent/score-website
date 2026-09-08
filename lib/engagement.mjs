// Fixed vocabulary only: never accept URLs, text, identifiers or search queries.
export const events = ['view', 'visible_30s', 'visible_120s', 'explore', 'section_seen', 'details_open', 'source_open', 'glossary_open', 'instrument_open', 'play_attempt', 'replay_attempt', 'setting_change', 'client_error'];
export const areas = ['entrance', 'story', 'story_beginning', 'story_alienate', 'story_tidemark', 'story_encounter', 'story_present', 'public_words', 'chronology', 'reference', 'instrument', 'other'];
export function validBatch(value) {
  return Array.isArray(value) && value.length > 0 && value.length <= 12 && value.every(e =>
    e && typeof e === 'object' && Object.keys(e).sort().join(',') === 'area,event,surface' &&
    events.includes(e.event) && areas.includes(e.area) && ['site', 'instrument', 'test'].includes(e.surface));
}
export async function ingest(request, dataset) {
  const headers = {'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'};
  const reply = status => new Response(null, {status, headers});
  if (request.headers.get('Origin') !== new URL(request.url).origin) return reply(403);
  if (request.headers.get('Sec-GPC') === '1' || request.headers.get('DNT') === '1') return reply(204);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415);
  if (!request.body) return reply(400);
  const reader = request.body.getReader();
  let size = 0; const chunks = [];
  try {
    while (true) {
      const {value, done} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2048) { await reader.cancel(); return reply(413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const batch = JSON.parse(new TextDecoder().decode(bytes));
    if (!validBatch(batch)) return reply(400);
    if (!dataset) return reply(503);
    for (const item of batch) dataset.writeDataPoint({blobs:['v1', item.surface, item.event, item.area], doubles:[1]});
    return reply(204);
  } catch { return reply(400); }
}
