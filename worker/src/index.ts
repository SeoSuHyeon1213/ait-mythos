import type { Env } from './types';
import { BadQuery, EntryService } from './services/entries';
function problem(status: number, title: string, extraHeaders?: HeadersInit) {
 return new Response(JSON.stringify({type:'about:blank',title,status}),{status,headers:{'Content-Type':'application/problem+json; charset=utf-8',...extraHeaders}});
}
async function route(request: Request, env: Env): Promise<Response> {
 const url=new URL(request.url); const path=url.pathname;
 if(!path.startsWith('/api/') && path!=='/health') return env.ASSETS.fetch(request);
 if(request.method!=='GET') return problem(405,'조회 요청만 사용할 수 있어요.',{Allow:'GET, OPTIONS'});
 if(path==='/health') {await env.DB.prepare('SELECT 1').first();return Response.json({status:'ok'});}
 const service=new EntryService(env.DB);
 if(path==='/api/v1/entries') return Response.json(await service.search(url.searchParams));
 if(path==='/api/v1/cultures') return Response.json(await service.lookups('cultures'));
 if(path==='/api/v1/categories') return Response.json(await service.lookups('categories'));
 if(path==='/api/v1/tags') return Response.json(await service.lookups('tags'));
 const match=/^\/api\/v1\/entries\/([^/]+)(\/related)?$/.exec(path);
 if(match) {
  let slug: string;try {slug=decodeURIComponent(match[1]);} catch {return problem(400,'잘못된 항목 주소예요.');}
  const result=match[2]?await service.related(slug):await service.detail(slug);
  return result===null?problem(404,'항목을 찾을 수 없어요.'):Response.json(result);
 }
 return problem(404,'API를 찾을 수 없어요.');
}
export default {
 async fetch(request: Request, env: Env): Promise<Response> {
  const origin=request.headers.get('Origin');
  const allowed=(env.CORS_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean);
  const canUseCors=origin!==null && allowed.includes(origin);
  let response: Response;
  if(request.method==='OPTIONS') {
   const method=request.headers.get('Access-Control-Request-Method');
   const headers=(request.headers.get('Access-Control-Request-Headers')??'').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
   response=canUseCors && method==='GET' && headers.every(x=>x==='content-type') ? new Response(null,{status:204,headers:{'Access-Control-Allow-Methods':'GET','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}}) : problem(403,'허용되지 않은 요청이에요.');
  } else {
   try {response=await route(request,env);} catch(error) {
    if(error instanceof BadQuery) response=problem(400,error.message);
    else {console.error('Mythos request failed',error instanceof Error?error.name:'unknown');response=problem(500,'정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');}
   }
  }
  const result=new Response(response.body,response);
  result.headers.append('Vary','Origin');
  if(canUseCors) result.headers.set('Access-Control-Allow-Origin',origin!);
  result.headers.set('X-Content-Type-Options','nosniff');
  return result;
 }
} satisfies ExportedHandler<Env>;
