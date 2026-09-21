// Explicit public document map. No private source directory is served.
export const ENTRANCE_ROUTES={
 '/':'/entrance/index.html', '/journal':'/entrance/journal.html',
 '/episode':'/entrance/episode.html',
 '/journal/missing-post':'/entrance/journal-missing-post.html',
 '/journal/who-owes':'/entrance/journal-who-owes.html',
 '/journal/one-ballot':'/entrance/journal-one-ballot.html',
};
export const ENTRANCE_ALIASES={
 '/index.html':'/','/journal.html':'/journal','/episode.html':'/episode',
 '/journal-missing-post.html':'/journal/missing-post',
 '/journal-who-owes.html':'/journal/who-owes',
 '/journal-one-ballot.html':'/journal/one-ballot',
 ...Object.fromEntries(Object.entries(ENTRANCE_ROUTES).map(([route,asset])=>[asset,route])),
};
export async function entranceResponse(request,env){
 if(!['GET','HEAD'].includes(request.method))return null;
 const url=new URL(request.url);
 if(url.pathname!=='/'&&url.pathname.endsWith('/')&&ENTRANCE_ROUTES[url.pathname.slice(0,-1)]){url.pathname=url.pathname.slice(0,-1);return Response.redirect(url,308);}
 const alias=ENTRANCE_ALIASES[url.pathname];
 if(alias){url.pathname=alias;return Response.redirect(url,308);}
 const asset=ENTRANCE_ROUTES[url.pathname];
 if(!asset||!env.ASSETS)return null;
 url.pathname=asset;
 return env.ASSETS.fetch(new Request(url,request));
}
