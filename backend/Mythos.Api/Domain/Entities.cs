namespace Mythos.Api.Domain;
public class Culture { public string Id { get; set; } = ""; public string Name { get; set; } = ""; }
public class Category { public string Id { get; set; } = ""; public string Name { get; set; } = ""; }
public class Tag { public string Id { get; set; } = ""; public string Name { get; set; } = ""; }
public class MythEntry {
 public int Id { get; set; }
 public string Slug { get; set; } = "";
 public string Name { get; set; } = "";
 public string OriginalName { get; set; } = "";
 public string Summary { get; set; } = "";
 public string Description { get; set; } = "";
 public string MaterialType { get; set; } = "";
 public string CultureId { get; set; } = "";
 public Culture Culture { get; set; } = null!;
 public string CategoryId { get; set; } = "";
 public Category Category { get; set; } = null!;
 public List<Tag> Tags { get; set; } = [];
 public List<EntryAlias> Aliases { get; set; } = [];
 public List<EntrySource> Sources { get; set; } = [];
}
public class EntryAlias { public int Id { get; set; } public int MythEntryId { get; set; } public string Name { get; set; } = ""; }
public class Source { public int Id { get; set; } public string Title { get; set; } = ""; public string Url { get; set; } = ""; }
public class EntrySource { public int MythEntryId { get; set; } public int SourceId { get; set; } public Source Source { get; set; } = null!; public string Locator { get; set; } = ""; }
public class EntryRelation { public int FromEntryId { get; set; } public MythEntry FromEntry { get; set; } = null!; public int ToEntryId { get; set; } public MythEntry ToEntry { get; set; } = null!; public string Kind { get; set; } = ""; }
