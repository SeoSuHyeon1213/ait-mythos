using Microsoft.EntityFrameworkCore;
using Mythos.Api.Persistence;
using Mythos.Api.Services;
namespace Mythos.Api.Endpoints;
public static class EntryEndpoints {
 public static void MapEntries(this WebApplication app) {
  var api=app.MapGroup("/api/v1");
  api.MapGet("/entries", async (EntryService service, CancellationToken ct, string? q=null,string? culture=null,string? category=null,string? tag=null,int page=1,int pageSize=12) => {
   if(page<1 || page>1000000 || pageSize<1 || pageSize>100) return Results.Problem(statusCode:400,title:"페이지 조건을 확인해 주세요.");
   return Results.Ok(await service.Search(q,culture,category,tag,page,pageSize,ct));
  });
  api.MapGet("/entries/{slug}",async (string slug,EntryService service,CancellationToken ct) => { var result=await service.Detail(slug,ct); return result is null ? Results.Problem(statusCode:404,title:"항목을 찾을 수 없어요.") : Results.Ok(result); });
  api.MapGet("/entries/{slug}/related",async (string slug,EntryService service,CancellationToken ct) => { var result=await service.Related(slug,ct); return result is null ? Results.Problem(statusCode:404,title:"항목을 찾을 수 없어요.") : Results.Ok(result); });
  api.MapGet("/cultures",async (MythosDbContext db,CancellationToken ct)=>await db.Cultures.AsNoTracking().OrderBy(x=>x.Id).ToListAsync(ct));
  api.MapGet("/categories",async (MythosDbContext db,CancellationToken ct)=>await db.Categories.AsNoTracking().OrderBy(x=>x.Id).ToListAsync(ct));
  api.MapGet("/tags",async (MythosDbContext db,CancellationToken ct)=>await db.Tags.AsNoTracking().OrderBy(x=>x.Id).ToListAsync(ct));
  app.MapGet("/health",()=>Results.Ok(new {status="ok"}));
 }
}

