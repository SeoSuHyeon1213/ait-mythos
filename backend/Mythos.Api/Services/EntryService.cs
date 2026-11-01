using Mythos.Api.Domain;
using Mythos.Api.Repositories;
namespace Mythos.Api.Services;
public record Lookup(string Id, string Name);
public record EntryCard(string Slug, string Name, string OriginalName, string Summary, Lookup Culture, Lookup Category, Lookup[] Tags);
public record EntryPage(EntryCard[] Items, int Total, int Page, int PageSize);
public class EntryService(EntryRepository repo) {
 public static EntryCard Card(MythEntry e) => new(e.Slug, e.Name, e.OriginalName, e.Summary, new(e.CultureId,e.Culture.Name), new(e.CategoryId,e.Category.Name), e.Tags.Select(t => new Lookup(t.Id,t.Name)).ToArray());
 public async Task<EntryPage> Search(string? q, string? culture, string? category, string? tag, int page, int pageSize, CancellationToken ct) {
  var query = (await repo.All(ct)).AsEnumerable();
  if (!string.IsNullOrWhiteSpace(q)) { var term=q.Trim(); query=query.Where(e => e.Name.Contains(term,StringComparison.OrdinalIgnoreCase) || e.OriginalName.Contains(term,StringComparison.OrdinalIgnoreCase) || e.Aliases.Any(a => a.Name.Contains(term,StringComparison.OrdinalIgnoreCase))); }
  if (!string.IsNullOrWhiteSpace(culture)) query=query.Where(e => e.CultureId==culture);
  if (!string.IsNullOrWhiteSpace(category)) query=query.Where(e => e.CategoryId==category);
  if (!string.IsNullOrWhiteSpace(tag)) query=query.Where(e => e.Tags.Any(t => t.Id==tag));
  var rows=query.ToArray(); return new(rows.Skip((page-1)*pageSize).Take(pageSize).Select(Card).ToArray(),rows.Length,page,pageSize);
 }
 public async Task<object?> Detail(string slug, CancellationToken ct) {
  var e=(await repo.All(ct)).SingleOrDefault(e => e.Slug==slug);
  return e is null ? null : new { e.Slug,e.Name,e.OriginalName,e.Summary,e.Description,e.MaterialType, Culture=new Lookup(e.CultureId,e.Culture.Name),Category=new Lookup(e.CategoryId,e.Category.Name), Tags=e.Tags.Select(t=>new Lookup(t.Id,t.Name)),Aliases=e.Aliases.Select(a=>a.Name),Sources=e.Sources.Select(s=>new {s.Source.Title,s.Source.Url,s.Locator}) };
 }
 public async Task<object?> Related(string slug, CancellationToken ct) {
  var e=(await repo.All(ct)).SingleOrDefault(e => e.Slug==slug);
  if(e is null) return null;
  return (await repo.Related(e.Id,ct)).Select(r=>new { r.ToEntry.Slug,r.ToEntry.Name,r.Kind }).ToArray();
 }
}
