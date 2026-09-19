import {canonicalRedirect, withCanonicalHeader} from './lib/site-domain.mjs';

export default {
  async fetch(request, env, ctx) {
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;
    const path = new URL(request.url).pathname;
    if (['GET', 'HEAD'].includes(request.method) && path.endsWith('.html') && env.ASSETS) {
      return withCanonicalHeader(await env.ASSETS.fetch(request), request);
    }
    // Redirects must not load the application renderer. This isolates the move
    // from page-render CPU consumption; it is not a general CPU-limit repair.
    const {default: app} = await import('vinext/server/fetch-handler');
    return withCanonicalHeader(await app.fetch(request, env, ctx), request);
  },
};
