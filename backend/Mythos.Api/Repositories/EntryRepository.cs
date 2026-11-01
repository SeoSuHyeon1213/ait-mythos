using Microsoft.EntityFrameworkCore;
using Mythos.Api.Persistence;
using Mythos.Api.Domain;
namespace Mythos.Api.Repositories;
public class EntryRepository(MythosDbContext db) {
 public Task<List<MythEntry>> All(CancellationToken ct) => db.Entries.AsNoTracking().Include(x => x.Culture).Include(x => x.Category).Include(x => x.Tags).Include(x => x.Aliases).Include(x => x.Sources).ThenInclude(x => x.Source).AsSplitQuery().OrderBy(x => x.Slug).ToListAsync(ct);
 public Task<List<EntryRelation>> Related(int id, CancellationToken ct) => db.Relations.AsNoTracking().Include(x => x.ToEntry).Where(x => x.FromEntryId == id).ToListAsync(ct);
}

