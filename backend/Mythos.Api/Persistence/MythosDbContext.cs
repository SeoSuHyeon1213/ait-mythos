using Microsoft.EntityFrameworkCore;
using Mythos.Api.Domain;
namespace Mythos.Api.Persistence;
public class MythosDbContext(DbContextOptions<MythosDbContext> options) : DbContext(options) {
 public DbSet<MythEntry> Entries => Set<MythEntry>();
 public DbSet<Culture> Cultures => Set<Culture>();
 public DbSet<Category> Categories => Set<Category>();
 public DbSet<Tag> Tags => Set<Tag>();
 public DbSet<EntryRelation> Relations => Set<EntryRelation>();
 protected override void OnModelCreating(ModelBuilder m) {
  m.Entity<MythEntry>().HasMany(x => x.Tags).WithMany();
  m.Entity<MythEntry>().HasIndex(x => x.Slug).IsUnique();
  m.Entity<EntryAlias>().HasIndex(x => new { x.MythEntryId, x.Name }).IsUnique();
  m.Entity<EntrySource>().HasKey(x => new { x.MythEntryId, x.SourceId });
  m.Entity<EntryRelation>().HasKey(x => new { x.FromEntryId, x.ToEntryId, x.Kind });
  m.Entity<EntryRelation>().HasOne(x => x.FromEntry).WithMany().HasForeignKey(x => x.FromEntryId).OnDelete(DeleteBehavior.Restrict);
  m.Entity<EntryRelation>().HasOne(x => x.ToEntry).WithMany().HasForeignKey(x => x.ToEntryId).OnDelete(DeleteBehavior.Restrict);
 }
}

