import { isIP } from 'node:net';

export const VISITOR_COOKIE = '__Host-score-visitor';
export const COOKIE_SECONDS = 365 * 24 * 60 * 60;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const bytes = new TextEncoder();

function secretKey(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('Journey secret unavailable');
  return crypto.subtle.importKey('raw', bytes.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign', 'verify']);
}
export async function keyedId(secret, purpose, value) {
  const signature = await crypto.subtle.sign('HMAC', await secretKey(secret), bytes.encode(`${purpose}\n${value}`));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

// Exact-address matching, not IP-as-person. Canonicalize IPv6 and IPv4-mapped
// IPv6 before hashing so equivalent representations match the same filter.
export function canonicalIP(value) {
  if (typeof value !== 'string' || value.length > 45 || value.includes('%')) return null;
  const family = isIP(value);
  if (family === 4) return value;
  if (family !== 6) return null;
  const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(normalized);
  if (!mapped) return normalized;
  const hi = parseInt(mapped[1], 16), lo = parseInt(mapped[2], 16);
  return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
}
export async function networkId(secret, address) {
  const ip = canonicalIP(address);
  return ip ? keyedId(secret, 'network-v1', ip) : null;
}
export async function requestNetworkId(request, secret) {
  // Never trust X-Forwarded-For or an IP sent by the browser. Deployment must
  // remain behind Cloudflare. Worker-to-Worker sentinel addresses aren't readers.
  const primary = canonicalIP(request.headers.get('CF-Connecting-IP'));
  const alternate = request.headers.get('CF-Connecting-IPv6');
  // Consult the IPv6 companion only for Cloudflare's Class-E Pseudo IPv4
  // replacement. An unrelated caller-supplied IPv6 header must not override
  // an ordinary, edge-provided CF-Connecting-IP value.
  const pseudo = primary && isIP(primary) === 4 && Number(primary.split('.')[0]) >= 240;
  const ip = pseudo && isIP(alternate || '') === 6 ? canonicalIP(alternate) : primary;
  if (ip === '2a06:98c0:3600::103') return null;
  return ip ? networkId(secret, ip) : null;
}
export async function visitorIdentity(request, secret, now = Date.now()) {
  const raw = (request.headers.get('Cookie') || '').split(';').map(s => s.trim())
    .find(s => s.startsWith(`${VISITOR_COOKIE}=`))?.slice(VISITOR_COOKIE.length + 1);
  if (raw && raw.length < 180) {
    const [id, expiryText, signature, extra] = raw.split('.');
    const expiry = Number(expiryText);
    if (!extra && UUID.test(id) && /^\d{13}$/.test(expiryText) && expiry > now &&
        expiry <= now + COOKIE_SECONDS * 1000 && /^[0-9a-f]{64}$/.test(signature || '')) {
      const signatureBytes = Uint8Array.from(signature.match(/../g), part => parseInt(part, 16));
      const valid = await crypto.subtle.verify('HMAC', await secretKey(secret), signatureBytes,
        bytes.encode(`visitor-v1\n${id}.${expiryText}`));
      if (valid) return {id, setCookie:null};
    }
  }
  const id = crypto.randomUUID();
  const value = `${id}.${now + COOKIE_SECONDS * 1000}`;
  const signature = await keyedId(secret, 'visitor-v1', value);
  return {id, setCookie:`${VISITOR_COOKIE}=${value}.${signature}; Path=/; Max-Age=${COOKIE_SECONDS}; Secure; HttpOnly; SameSite=Lax`};
}
export const forgetVisitorCookie = `${VISITOR_COOKIE}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`;
