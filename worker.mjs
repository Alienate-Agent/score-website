import {canonicalRedirect, withCanonicalHeader} from './lib/site-domain.mjs';
import {entranceResponse} from './lib/entrance-routes.mjs';
import {preparedPageResponse,PREPARED_PAGES} from './lib/prepared-pages.mjs';

export default {
  async fetch(request, env, ctx) {
    // Keep the framework's render entry in the build for local prerendering.
    // Production always has ASSETS and never enters this render-only fallback.
    if(!env.ASSETS){const {default:app}=await import('vinext/server/fetch-handler');return app.fetch(request,env,ctx);}
    const redirect = canonicalRedirect(request);
    if (redirect) return redirect;
    const entrance = await entranceResponse(request, env);
    if (entrance) return withCanonicalHeader(entrance, request);
    const path = new URL(request.url).pathname;
    // Preserve the historical next.config instrument redirect now that page
    // requests no longer pass through the framework router.
    if(['GET','HEAD'].includes(request.method)&&(path==='/lens'||path==='/lens/')){
      const url=new URL(request.url);url.pathname='/lens/index.html';return Response.redirect(url,307);
    }
    if(path.startsWith('/api/')){
      const {dispatchApi}=await import('./lib/api-dispatch.mjs');
      return dispatchApi(request);
    }
    // Do not expose internal duplicate page URLs or skip their canonical routes.
    if(path.startsWith('/_pages/')){
      const url=new URL(request.url),route=path.slice('/_pages'.length).replace(/\.(?:html|rsc)$/,'');
      if(PREPARED_PAGES.includes(route)){url.pathname=route;return Response.redirect(url,308);}
      return new Response(null,{status:404});
    }
    const prepared=await preparedPageResponse(request,env);
    if(prepared)return withCanonicalHeader(prepared,request);
    if (['GET', 'HEAD'].includes(request.method) && path.endsWith('.html') && env.ASSETS) {
      return withCanonicalHeader(await env.ASSETS.fetch(request), request);
    }
    if(['GET','HEAD'].includes(request.method)&&env.ASSETS){
      const url=new URL(request.url);url.pathname='/_pages/404.html';url.search='';
      const notFound=await env.ASSETS.fetch(new Request(url,request));
      return new Response(notFound.body,{status:404,headers:notFound.headers});
    }
    return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  },
};
