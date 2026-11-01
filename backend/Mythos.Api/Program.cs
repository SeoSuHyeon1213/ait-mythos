using Microsoft.EntityFrameworkCore;
using Mythos.Api.Persistence;
using Mythos.Api.Endpoints;
using Mythos.Api.Repositories;
using Mythos.Api.Services;
var builder=WebApplication.CreateBuilder(args.Where(x => x != "--seed").ToArray());
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<MythosDbContext>(o=>o.UseSqlite(builder.Configuration.GetConnectionString("Mythos")));
builder.Services.AddScoped<EntryRepository>(); builder.Services.AddScoped<EntryService>();
var origins=builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
builder.Services.AddCors(o=>o.AddDefaultPolicy(p=>p.WithOrigins(origins).WithMethods("GET").AllowAnyHeader()));
var app=builder.Build();
app.UseExceptionHandler(); app.UseStatusCodePages(); app.UseCors();
if(app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing") || args.Contains("--seed")) {
 Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath,"data"));
 using var scope=app.Services.CreateScope(); var db=scope.ServiceProvider.GetRequiredService<MythosDbContext>();
 await db.Database.MigrateAsync();
 await SeedImporter.Import(db,Path.Combine(app.Environment.ContentRootPath,"Content","entries.json"));
}
if(args.Contains("--seed")) return;
app.MapEntries(); app.Run();
public partial class Program { }

