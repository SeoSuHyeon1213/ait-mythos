import { EntryRepository } from '../repositories/entries';
export class BadQuery extends Error {}
export function pagination(params: URLSearchParams) {
 const read = (key: string, fallback: number, max: number) => {
  const raw=params.get(key); if(raw === null) return fallback;
  if(!/^[0-9]+$/.test(raw)) throw new BadQuery('페이지 조건을 확인해 주세요.');
  const value=Number(raw);if(!Number.isSafeInteger(value)||value<1||value>max) throw new BadQuery('페이지 조건을 확인해 주세요.');
  return value;
 };
 return {page:read('page',1,1000000),pageSize:read('pageSize',12,100)};
}
export class EntryService {
 private repository: EntryRepository;
 constructor(db: D1Database) { this.repository=new EntryRepository(db); }
 search(params: URLSearchParams) {
  const {page,pageSize}=pagination(params);
  return this.repository.search(params.get('q')??'',params.get('culture')??'',params.get('category')??'',params.get('tag')??'',page,pageSize);
 }
 detail(slug:string) { return this.repository.detail(slug); }
 related(slug:string) { return this.repository.related(slug); }
 lookups(table:'cultures'|'categories'|'tags') { return this.repository.lookups(table); }
}
