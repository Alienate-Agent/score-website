// The same API handlers, reached without initializing the page renderer.
const routes={
 '/api/agent-stats':()=>import('../app/api/agent-stats/route.ts'),
 '/api/agent-words':()=>import('../app/api/agent-words/route.ts'),
 '/api/board-registry':()=>import('../app/api/board-registry/route.ts'),
 '/api/board-search':()=>import('../app/api/board-search/route.ts'),
 '/api/conversation':()=>import('../app/api/conversation/route.ts'),
 '/api/correspondence':()=>import('../app/api/correspondence/route.ts'),
 '/api/engagement':()=>import('../app/api/engagement/route.ts'),
 '/api/journey-admin':()=>import('../app/api/journey-admin/route.ts'),
 '/api/journeys':()=>import('../app/api/journeys/route.ts'),
 '/api/thread-check':()=>import('../app/api/thread-check/route.ts'),
};
export async function dispatchApi(request){
 const load=routes[new URL(request.url).pathname];
 if(!load)return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
 const handlers=await load(),method=request.method==='HEAD'?'GET':request.method;
 if(typeof handlers[method]!=='function')return new Response(null,{status:405,headers:{Allow:Object.keys(handlers).filter(k=>/^[A-Z]+$/.test(k)).join(', '),'Cache-Control':'no-store'}});
 const response=await handlers[method](request);
 if(request.method!=='HEAD')return response;
 await response.body?.cancel();return new Response(null,response);
}
