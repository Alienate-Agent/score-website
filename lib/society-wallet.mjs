// Only the public USDC balance on Base. Ledger income and other assets are separate.
export const TREASURY_SOURCE = 'https://1f916.ai/treasury';
const ADDRESS = '0xa7F7985eB19b8c44F12A0654Df1eF89d1dd527C9';
const MAX_BYTES = 1048576;
const integer = value => Number.isSafeInteger(value) && value >= 0;

export function summarizeWallet(data, receivedAt = Date.now()) {
  if (!integer(receivedAt) || data?.wallet?.address?.toLowerCase() !== ADDRESS.toLowerCase()
      || data.wallet.network !== 'base' || data.wallet.asset !== 'USDC'
      || !integer(data.onchain_cents) || !integer(data.onchain_checked_at)
      || data.onchain_checked_at < Date.UTC(2020, 0, 1)
      || data.onchain_checked_at > receivedAt + 60000
      || !integer(data.onchain_age_ms) || typeof data.onchain_is_stale !== 'boolean') throw Error('shape');
  const ageMs = Math.max(data.onchain_age_ms, receivedAt - data.onchain_checked_at, 0);
  return {
    version: 1, asset: 'USDC', network: 'Base', balanceCents: data.onchain_cents,
    checkedAt: new Date(data.onchain_checked_at).toISOString(),
    receivedAt: new Date(receivedAt).toISOString(), ageMs,
    stale: data.onchain_is_stale || ageMs > 300000, source: TREASURY_SOURCE,
  };
}

export function formatWalletBalance(cents) {
  if (!integer(cents)) throw Error('balance');
  return new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(cents / 100);
}

export async function fetchSocietyWallet(fetcher = fetch) {
  const response = await fetcher(TREASURY_SOURCE, {
    method: 'GET', credentials: 'omit', redirect: 'manual', cache: 'no-store',
    headers: {Accept: 'application/json'}, signal: AbortSignal.timeout(12000),
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json') || !response.body) throw Error('unavailable');
  if (Number(response.headers.get('content-length')) > MAX_BYTES) { await response.body.cancel(); throw Error('size'); }
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw Error('size');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return summarizeWallet(JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)));
}

// Coalesce simultaneous reader clicks, without polling or storing visitor data.
let pending;
export async function walletResponse(request, fetcher = fetch) {
  const headers = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'};
  if (request.method !== 'GET') return Response.json({error: 'unsupported'}, {status: 405, headers: {...headers, Allow: 'GET'}});
  if (new URL(request.url).search) return Response.json({error: 'unsupported'}, {status: 400, headers});
  try {
    pending ??= fetchSocietyWallet(fetcher).finally(() => { pending = undefined; });
    return Response.json(await pending, {headers});
  } catch { return Response.json({error: 'unavailable'}, {status: 503, headers}); }
}
