export interface Lookup { id: string; name: string }
export interface SeedEntry {
 slug:string;name:string;originalName:string;summary:string;description:string;materialType:string;
 culture:string;category:string;aliases:string[];tags:string[];
 sources:{title:string;url:string;locator:string}[];related:{slug:string;kind:string}[];
}
export interface SeedDocument { cultures:Lookup[];categories:Lookup[];tags:Lookup[];entries:SeedEntry[] }
const text=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
function check(condition: unknown, message: string): asserts condition { if(!condition) throw new Error(message); }
function record(value:unknown):value is Record<string,unknown> {return !!value&&typeof value==='object'&&!Array.isArray(value);}
export function validateSeed(input: unknown): asserts input is SeedDocument {
 check(record(input),'Seed는 객체여야 합니다.');
 for(const key of ['cultures','categories','tags','entries']) check(Array.isArray(input[key]),`${key} 목록이 필요합니다.`);
 const data=input as unknown as SeedDocument;
 for(const key of ['cultures','categories','tags'] as const) {
  const ids=new Set<string>();
  for(const x of data[key]) {check(record(x)&&text(x.id)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.id)&&text(x.name),`${key}: 분류 형식 오류`);check(!ids.has(x.id),`${key}: 중복 ID`);ids.add(x.id);}
 }
 const slugs=new Set<string>();
 for(const e of data.entries) {
  check(record(e)&&text(e.slug)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(e.slug),'항목 slug 형식 오류');check(!slugs.has(e.slug),'중복 slug');slugs.add(e.slug);
  for(const key of ['name','originalName','summary','description','materialType','culture','category']) check(text(e[key as keyof SeedEntry]),`${e.slug}: ${key} 누락`);
  check(data.cultures.some(c=>c.id===e.culture)&&data.categories.some(c=>c.id===e.category),`${e.slug}: 분류 참조 오류`);
  check(Array.isArray(e.aliases)&&e.aliases.every(text)&&new Set(e.aliases.map(a=>a.normalize('NFC').toLowerCase())).size===e.aliases.length,`${e.slug}: 별칭 누락·중복`);
  check(Array.isArray(e.tags)&&e.tags.every(text)&&new Set(e.tags).size===e.tags.length&&e.tags.every(t=>data.tags.some(x=>x.id===t)),`${e.slug}: 태그 참조·중복 오류`);
  check(Array.isArray(e.sources)&&e.sources.length>0,`${e.slug}: 출처 누락`);
  for(const s of e.sources) {check(record(s)&&text(s.title)&&text(s.url)&&text(s.locator),`${e.slug}: 출처 형식 오류`);let url:URL;try{url=new URL(s.url);}catch{throw new Error(`${e.slug}: 출처 URL 오류`);}check(url.protocol==='https:',`${e.slug}: HTTPS 출처 필요`);}
  check(Array.isArray(e.related),`${e.slug}: 관계 목록 필요`);
 }
 for(const e of data.entries) {
  const seen=new Set<string>();
  for(const rel of e.related) {check(record(rel)&&text(rel.slug)&&text(rel.kind)&&rel.slug!==e.slug&&slugs.has(rel.slug),`${e.slug}: 관계 참조 오류`);const key=JSON.stringify([rel.slug,rel.kind]);check(!seen.has(key),`${e.slug}: 관계 중복`);seen.add(key);}
 }
}
export function seedStatements(input: unknown): string[] {
 validateSeed(input);const d=input;const sql:string[]=[];
 const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
 for(const table of ['cultures','categories','tags'] as const) for(const x of d[table]) sql.push(`INSERT INTO ${table}(id,name) VALUES(${quote(x.id)},${quote(x.name)}) ON CONFLICT(id) DO UPDATE SET name=excluded.name;`);
 for(const e of d.entries) {
  const values=[e.slug,e.name,e.originalName,e.summary,e.description,e.materialType,e.culture,e.category].map(quote).join(',');
  sql.push(`INSERT INTO entries(slug,name,original_name,summary,description,material_type,culture_id,category_id) VALUES(${values}) ON CONFLICT(slug) DO UPDATE SET name=excluded.name,original_name=excluded.original_name,summary=excluded.summary,description=excluded.description,material_type=excluded.material_type,culture_id=excluded.culture_id,category_id=excluded.category_id;`);
  for(const table of ['entry_aliases','entry_names','entry_tags','entry_sources']) sql.push(`DELETE FROM ${table} WHERE entry_slug=${quote(e.slug)};`);
  for(const name of e.aliases) sql.push(`INSERT INTO entry_aliases VALUES(${quote(e.slug)},${quote(name)});`);
  for(const name of new Set([e.name,e.originalName,...e.aliases].map(n=>n.normalize('NFC').toLowerCase()))) sql.push(`INSERT INTO entry_names VALUES(${quote(e.slug)},${quote(name)});`);
  for(const tag of e.tags) sql.push(`INSERT INTO entry_tags VALUES(${quote(e.slug)},${quote(tag)});`);
  e.sources.forEach((s,i)=>{const id=`${e.slug}-${i}`;sql.push(`INSERT INTO sources(id,title,url) VALUES(${quote(id)},${quote(s.title)},${quote(s.url)}) ON CONFLICT(id) DO UPDATE SET title=excluded.title,url=excluded.url;`);sql.push(`INSERT INTO entry_sources VALUES(${quote(e.slug)},${quote(id)},${quote(s.locator)});`);});
 }
 for(const e of d.entries) {sql.push(`DELETE FROM entry_relations WHERE from_slug=${quote(e.slug)};`);for(const rel of e.related) sql.push(`INSERT INTO entry_relations VALUES(${quote(e.slug)},${quote(rel.slug)},${quote(rel.kind)});`);}
 return sql;
}
