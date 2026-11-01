CREATE TABLE cultures (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE entries (
 slug TEXT PRIMARY KEY, name TEXT NOT NULL, original_name TEXT NOT NULL,
 summary TEXT NOT NULL, description TEXT NOT NULL, material_type TEXT NOT NULL,
 culture_id TEXT NOT NULL REFERENCES cultures(id), category_id TEXT NOT NULL REFERENCES categories(id)
);
CREATE INDEX entries_culture ON entries(culture_id);
CREATE INDEX entries_category ON entries(category_id);
CREATE TABLE entry_aliases (entry_slug TEXT NOT NULL REFERENCES entries(slug), name TEXT NOT NULL, PRIMARY KEY(entry_slug,name));
CREATE TABLE entry_names (entry_slug TEXT NOT NULL REFERENCES entries(slug), normalized TEXT NOT NULL, PRIMARY KEY(entry_slug,normalized));
CREATE TABLE entry_tags (entry_slug TEXT NOT NULL REFERENCES entries(slug), tag_id TEXT NOT NULL REFERENCES tags(id), PRIMARY KEY(entry_slug,tag_id));
CREATE INDEX entry_tags_tag ON entry_tags(tag_id,entry_slug);
CREATE TABLE sources (id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT NOT NULL);
CREATE TABLE entry_sources (entry_slug TEXT NOT NULL REFERENCES entries(slug), source_id TEXT NOT NULL REFERENCES sources(id), locator TEXT NOT NULL, PRIMARY KEY(entry_slug,source_id));
CREATE TABLE entry_relations (from_slug TEXT NOT NULL REFERENCES entries(slug), to_slug TEXT NOT NULL REFERENCES entries(slug), kind TEXT NOT NULL, PRIMARY KEY(from_slug,to_slug,kind), CHECK(from_slug != to_slug));
