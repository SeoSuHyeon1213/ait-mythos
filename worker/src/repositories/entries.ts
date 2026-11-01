import type { EntryCard, EntryRow, Lookup } from '../types';
const select = `SELECT e.slug, e.name, e.original_name AS originalName, e.summary,
 e.description, e.material_type AS materialType, c.id AS cultureId, c.name AS cultureName,
 k.id AS categoryId, k.name AS categoryName FROM entries e
 JOIN cultures c ON c.id=e.culture_id JOIN categories k ON k.id=e.category_id`;
export class EntryRepository {
 constructor(private db: D1Database) {}
 async search(q: string, culture: string, category: string, tag: string, page: number, pageSize: number) {
  const where: string[] = []; const args: string[] = [];
  if (q.trim()) { where.push('EXISTS(SELECT 1 FROM entry_names n WHERE n.entry_slug=e.slug AND instr(n.normalized,?)>0)'); args.push(q.trim().normalize('NFC').toLowerCase()); }
  if (culture) { where.push('e.culture_id=?'); args.push(culture); }
  if (category) { where.push('e.category_id=?'); args.push(category); }
  if (tag) { where.push('EXISTS(SELECT 1 FROM entry_tags t WHERE t.entry_slug=e.slug AND t.tag_id=?)'); args.push(tag); }
  const filter = where.length ? ' WHERE '+where.join(' AND ') : '';
  const [count, rows] = await this.db.batch([
   this.db.prepare('SELECT COUNT(*) AS total FROM entries e'+filter).bind(...args),
   this.db.prepare(select+filter+' ORDER BY e.slug LIMIT ? OFFSET ?').bind(...args,pageSize,(page-1)*pageSize),
  ]);
  const entries = rows.results as unknown as EntryRow[];
  const tags = await this.tags(entries.map(e=>e.slug));
  return {items: entries.map(e=>this.card(e,tags)), total: Number((count.results[0] as {total:number}).total), page, pageSize};
 }
 private async tags(slugs: string[]) {
  if (!slugs.length) return [];
  const query = `SELECT t.entry_slug, g.id, g.name FROM entry_tags t JOIN tags g ON g.id=t.tag_id WHERE t.entry_slug IN (${slugs.map(()=>'?').join(',')}) ORDER BY g.id`;
  return (await this.db.prepare(query).bind(...slugs).all<Lookup & {entry_slug:string}>()).results;
 }
 private card(e: EntryRow, tags: (Lookup & {entry_slug:string})[]): EntryCard {
  return {slug:e.slug,name:e.name,originalName:e.originalName,summary:e.summary,culture:{id:e.cultureId,name:e.cultureName},category:{id:e.categoryId,name:e.categoryName},tags:tags.filter(t=>t.entry_slug===e.slug).map(t=>({id:t.id,name:t.name}))};
 }
 async detail(slug: string) {
  const entry = await this.db.prepare(select+' WHERE e.slug=?').bind(slug).first<EntryRow>();
  if (!entry) return null;
  const [aliases,sources] = await this.db.batch([
   this.db.prepare('SELECT name FROM entry_aliases WHERE entry_slug=? ORDER BY name').bind(slug),
   this.db.prepare('SELECT s.title,s.url,x.locator FROM entry_sources x JOIN sources s ON s.id=x.source_id WHERE x.entry_slug=? ORDER BY s.id').bind(slug),
  ]);
  return {...this.card(entry,await this.tags([slug])),description:entry.description,materialType:entry.materialType,aliases:(aliases.results as {name:string}[]).map(a=>a.name),sources:sources.results};
 }
 async related(slug: string) {
  const exists = await this.db.prepare('SELECT 1 FROM entries WHERE slug=?').bind(slug).first();
  if (!exists) return null;
  return (await this.db.prepare('SELECT e.slug,e.name,r.kind FROM entry_relations r JOIN entries e ON e.slug=r.to_slug WHERE r.from_slug=? ORDER BY e.slug,r.kind').bind(slug).all()).results;
 }
 async lookups(table: 'cultures'|'categories'|'tags') {
  return (await this.db.prepare(`SELECT id,name FROM ${table} ORDER BY id`).all<Lookup>()).results;
 }
}
