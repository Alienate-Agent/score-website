// Public page shells are rendered once per release, never from visitor data.
// Query-based readers select their validated object after hydration.
export const PREPARED_PAGES=['/record','/agent-guide','/agent-words','/archive','/archive/conversations','/archive/earlier-present','/board','/changelog','/charter','/featured','/visual-score'];
export async function preparedPageResponse(request,env){
 if(!['GET','HEAD'].includes(request.method)||!env.ASSETS)return null;
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
 if(!PREPARED_PAGES.includes(path))return null;
 if(path!==url.pathname){url.pathname=path;return Response.redirect(url,308);}
 const rsc=request.headers.get('RSC')==='1'||request.headers.get('Accept')?.includes('text/x-component');
 url.pathname='/_pages'+path+(rsc?'.rsc':'.html');url.search='';
 const response=await env.ASSETS.fetch(new Request(url,request));
 if(rsc){const result=new Response(response.body,response);result.headers.set('Content-Type','text/x-component');return result;}
 return response;
}
