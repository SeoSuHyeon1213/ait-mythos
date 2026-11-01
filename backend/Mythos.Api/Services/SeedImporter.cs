using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Mythos.Api.Persistence;
using Mythos.Api.Domain;
namespace Mythos.Api.Services;
public record SeedSource(string Title,string Url,string Locator);
public record SeedRelation(string Slug,string Kind);
public record SeedEntry(string Slug,string Name,string OriginalName,string Summary,string Description,string MaterialType,string Culture,string Category,string[] Aliases,string[] Tags,SeedSource[] Sources,SeedRelation[] Related);
public record SeedDocument(Lookup[] Cultures,Lookup[] Categories,Lookup[] Tags,SeedEntry[] Entries);
public static class SeedImporter {
 public static void Validate(SeedDocument d) {
  static bool Text(string? s)=>!string.IsNullOrWhiteSpace(s);
  static bool Unique(IEnumerable<string> ids)=>ids.All(x=>Text(x)&&Regex.IsMatch(x,"^[a-z0-9]+(?:-[a-z0-9]+)*$"))&&ids.Distinct().Count()==ids.Count();
  if(d.Cultures is null || d.Categories is null || d.Tags is null || d.Entries is null) throw new InvalidDataException("Seed 목록이 누락됐습니다.");
  if(!Unique(d.Cultures.Select(x=>x.Id)) || !Unique(d.Categories.Select(x=>x.Id)) || !Unique(d.Tags.Select(x=>x.Id)) || !Unique(d.Entries.Select(x=>x.Slug))) throw new InvalidDataException("식별자 누락·형식 오류·중복입니다.");
  if(d.Cultures.Concat(d.Categories).Concat(d.Tags).Any(x=>!Text(x.Name))) throw new InvalidDataException("분류 이름이 누락됐습니다.");
  foreach(var e in d.Entries) {
   if(new[]{e.Name,e.OriginalName,e.Summary,e.Description,e.MaterialType}.Any(s=>!Text(s)) || e.Aliases is null || e.Tags is null || e.Sources is null || e.Related is null) throw new InvalidDataException($"{e.Slug}: 필수값 누락");
   if(!d.Cultures.Any(x=>x.Id==e.Culture)||!d.Categories.Any(x=>x.Id==e.Category)||e.Tags.Any(t=>!d.Tags.Any(x=>x.Id==t))) throw new InvalidDataException($"{e.Slug}: 잘못된 분류 참조");
   if(e.Tags.Distinct().Count()!=e.Tags.Length || e.Aliases.Any(a=>!Text(a)) || e.Aliases.Distinct(StringComparer.OrdinalIgnoreCase).Count()!=e.Aliases.Length) throw new InvalidDataException($"{e.Slug}: 중복 태그·별칭");
   if(e.Sources.Length==0 || e.Sources.Any(s=>!Text(s.Title)||!Text(s.Locator)||!Uri.TryCreate(s.Url,UriKind.Absolute,out var u)||u.Scheme!="https")) throw new InvalidDataException($"{e.Slug}: 출처 누락·오류");
   if(e.Related.Any(r=>!Text(r.Kind)||r.Slug==e.Slug||!d.Entries.Any(x=>x.Slug==r.Slug)) || e.Related.Distinct().Count()!=e.Related.Length) throw new InvalidDataException($"{e.Slug}: 잘못된 관계 참조");
  }
 }
 public static async Task Import(MythosDbContext db,string path,CancellationToken ct=default) {
  var d=JsonSerializer.Deserialize<SeedDocument>(await File.ReadAllTextAsync(path,ct),new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? throw new InvalidDataException("빈 Seed"); Validate(d);
  await using var tx=await db.Database.BeginTransactionAsync(ct);
  foreach(var x in d.Cultures) if(!await db.Cultures.AnyAsync(y=>y.Id==x.Id,ct)) db.Cultures.Add(new(){Id=x.Id,Name=x.Name});
  foreach(var x in d.Categories) if(!await db.Categories.AnyAsync(y=>y.Id==x.Id,ct)) db.Categories.Add(new(){Id=x.Id,Name=x.Name});
  foreach(var x in d.Tags) if(!await db.Tags.AnyAsync(y=>y.Id==x.Id,ct)) db.Tags.Add(new(){Id=x.Id,Name=x.Name});
  await db.SaveChangesAsync(ct);
  foreach(var e in d.Entries) {
   if(await db.Entries.AnyAsync(x=>x.Slug==e.Slug,ct)) continue;
   db.Entries.Add(new MythEntry {Slug=e.Slug,Name=e.Name,OriginalName=e.OriginalName,Summary=e.Summary,Description=e.Description,MaterialType=e.MaterialType,CultureId=e.Culture,CategoryId=e.Category,Tags=await db.Tags.Where(t=>e.Tags.Contains(t.Id)).ToListAsync(ct),Aliases=e.Aliases.Select(a=>new EntryAlias{Name=a}).ToList(),Sources=e.Sources.Select(s=>new EntrySource {Source=new Source {Title=s.Title,Url=s.Url},Locator=s.Locator}).ToList()});
  }
  await db.SaveChangesAsync(ct);
  var entries=await db.Entries.ToDictionaryAsync(x=>x.Slug,ct);
  foreach(var e in d.Entries) foreach(var r in e.Related) { var from=entries[e.Slug].Id;var to=entries[r.Slug].Id; if(!await db.Relations.AnyAsync(x=>x.FromEntryId==from&&x.ToEntryId==to&&x.Kind==r.Kind,ct)) db.Relations.Add(new(){FromEntryId=from,ToEntryId=to,Kind=r.Kind}); }
  await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
 }
}

