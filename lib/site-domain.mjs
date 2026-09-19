export const SITE_ORIGIN = 'https://taasoart.com';
export const LEGACY_HOST = 'score-website.alienate-agent.workers.dev';

// Only navigable public pages move. Existing API clients, form submissions and
// already-open pages must retain their same-origin endpoints and assets.
export function canonicalRedirect(request) {
  const url = new URL(request.url);
  if (![LEGACY_HOST, 'www.taasoart.com'].includes(url.hostname)) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return null;
  if (/\.[^/]+$/.test(url.pathname) && !url.pathname.endsWith('.html')) return null;
  // Assign the hostname rather than resolving a possibly double-slash path.
  url.protocol = 'https:';
  url.hostname = 'taasoart.com';
  url.port = '';
  return new Response(null, {status:308, headers:{Location:url.href, 'Cache-Control':'public, max-age=3600'}});
}

export function withCanonicalHeader(response, request) {
  const url = new URL(request.url);
  if (url.hostname !== 'taasoart.com' || response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) return response;
  // Vinext already provides this for app routes; static HTML needs it too.
  if (response.headers.get('Link')?.includes('; rel="canonical"')) return response;
  // Keep query-based reader selections; omit browser-only fragments. The
  // canonical header does not alter sealed/downloadable HTML artwork bytes.
  const result = new Response(response.body, response);
  result.headers.append('Link', `<${SITE_ORIGIN}${url.pathname}${url.search}>; rel="canonical"`);
  return result;
}
