import {URL as NodeURL} from 'node:url';
import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Miniflare, convertV4MiniflareOptions} from 'miniflare';
import {seedStatements,validateSeed} from '../src/content/seed';
import type {SeedDocument} from '../src/content/seed';
let mf: Miniflare;
let db: Awaited<ReturnType<Miniflare['getD1Database']>>;
let fixture: SeedDocument;
async function json(path:string) {const res=await mf.dispatchFetch('https://mythos.test'+path);assert.equal(res.status,200);return res.json() as Promise<any>;}
before(async()=>{
 mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:'.build/index.js',compatibilityDate:'2026-10-30',d1Databases:{DB:'test-mythos'},bindings:{CORS_ORIGINS:'https://mythos.apps.tossmini.com,https://mythos.private-apps.tossmini.com'},serviceBindings:{ASSETS:()=>new Response('<html>SPA</html>',{headers:{'Content-Type':'text/html'}})}}));
 db=await mf.getD1Database('DB');
 const schema=await readFile(new NodeURL('../migrations/0001_initial.sql',import.meta.url),'utf8');
 await db.batch(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
 fixture=JSON.parse(await readFile(new NodeURL('../content/entries.json',import.meta.url),'utf8'));
 fixture.entries.push({...structuredClone(fixture.entries[0]),slug:'thor-test',name:'테스트 토르',originalName:'Thor',aliases:['Thor'],related:[]});
 fixture.entries[0].related=[{slug:'thor-test',kind:'테스트 관계'}];
 await db.batch(seedStatements(fixture).map(s=>db.prepare(s)));
});
after(async()=>{await mf?.dispose();});
for(const q of ['오딘','Odin','Óðinn','óðinn','WODEN','알파더']) test(`이름·별칭 검색: ${q}`,async()=>{const d=await json('/api/v1/entries?q='+encodeURIComponent(q));assert.equal(d.total,1);assert.equal(d.items[0].slug,'odin');});
test('이름과 별칭에 동시에 일치해도 중복 없음',async()=>{const d=await json('/api/v1/entries?q=O');assert.equal(d.items.filter((x:any)=>x.slug==='odin').length,1);});
test('분류·유형·주제 AND 필터',async()=>{const d=await json('/api/v1/entries?q=odin&culture=norse&category=god&tag=wisdom');assert.equal(d.total,1);assert.equal((await json('/api/v1/entries?culture=missing')).total,0);});
test('공유 태그와 페이지네이션',async()=>{assert.equal((await json('/api/v1/entries?tag=wisdom')).total,2);const d=await json('/api/v1/entries?pageSize=1&page=2');assert.equal(d.items[0].slug,'thor-test');assert.equal(d.total,2);assert.equal((await json('/api/v1/entries?page=20')).items.length,0);});
test('상세 설명·출처·별칭 계약 유지',async()=>{const d=await json('/api/v1/entries/odin');assert.equal(d.name,'오딘');assert.equal(d.culture.id,'norse');assert.equal(d.category.id,'god');assert.equal(d.tags[0].id,'wisdom');assert.ok(d.description);assert.ok(d.aliases.includes('Woden'));assert.match(d.sources[0].url,/^https:/);});
test('방향성 관계와 존재하는 대상',async()=>{const d=await json('/api/v1/entries/odin/related');assert.equal(d[0].slug,'thor-test');assert.deepEqual(await json('/api/v1/entries/thor-test/related'),[]);});
for(const table of ['cultures','categories','tags']) test(`분류 목록 ${table}`,async()=>assert.ok((await json('/api/v1/'+table)).length));
for(const query of ['page=0','page=-1','page=abc','page=1.5','page=1000001','pageSize=101','pageSize=0']) test(`잘못된 페이지 ${query}`,async()=>{const r=await mf.dispatchFetch('https://mythos.test/api/v1/entries?'+query);assert.equal(r.status,400);assert.match(r.headers.get('content-type')??'',/application\/problem\+json/);});
for(const path of ['/api/v1/entries/missing','/api/v1/entries/missing/related','/api/unknown']) test(`없는 API·항목 ${path}`,async()=>assert.equal((await mf.dispatchFetch('https://mythos.test'+path)).status,404));
test('검색 파라미터의 SQL 문자는 값으로 처리',async()=>{for(const q of ["' OR 1=1 --",'%','_']) assert.equal((await json('/api/v1/entries?q='+encodeURIComponent(q))).total,0);});
test('공개 수정 API 차단',async()=>assert.equal((await mf.dispatchFetch('https://mythos.test/api/v1/entries',{method:'POST'})).status,405));
test('서비스·QR CORS와 거부 origin',async()=>{
 for(const origin of ['https://mythos.apps.tossmini.com','https://mythos.private-apps.tossmini.com']) {
  const r=await mf.dispatchFetch('https://mythos.test/health',{headers:{Origin:origin}});assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);
  const p=await mf.dispatchFetch('https://mythos.test/api/v1/entries',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET'}});assert.equal(p.status,204);
 }
 const r=await mf.dispatchFetch('https://mythos.test/health',{headers:{Origin:'https://bad.example'}});assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
 const p=await mf.dispatchFetch('https://mythos.test/api/v1/entries',{method:'OPTIONS',headers:{Origin:'https://bad.example','Access-Control-Request-Method':'GET'}});assert.equal(p.status,403);
});
test('API 404는 SPA HTML로 바뀌지 않음',async()=>{const r=await mf.dispatchFetch('https://mythos.test/api/unknown',{headers:{'Sec-Fetch-Mode':'navigate'}});assert.equal(r.status,404);assert.match(r.headers.get('content-type')??'',/json/);});
test('화면 경로는 ASSETS로 전달',async()=>{const r=await mf.dispatchFetch('https://mythos.test/entries/odin');assert.equal(r.status,200);assert.match(await r.text(),/SPA/);});
test('반복 적재·본문 갱신·관계 중복 없음',async()=>{
 const next=structuredClone(fixture);next.entries[0].summary="수정된 요약 ' SQL 인용부호";
 await db.batch(seedStatements(next).map(s=>db.prepare(s)));await db.batch(seedStatements(next).map(s=>db.prepare(s)));
 assert.equal((await json('/api/v1/entries')).total,2);assert.equal((await json('/api/v1/entries/odin')).summary,next.entries[0].summary);assert.equal((await json('/api/v1/entries/odin/related')).length,1);
 await db.batch(seedStatements(fixture).map(s=>db.prepare(s)));
});
for(const defect of ['duplicate','reference','source','relation','missing','alias']) test(`Seed 검증 오류 ${defect}`,()=>{
 const d=structuredClone(fixture);
 if(defect==='duplicate') d.entries.push(d.entries[0]);
 if(defect==='reference') d.entries[0].tags=['missing'];
 if(defect==='source') d.entries[0].sources[0].url='javascript:alert(1)';
 if(defect==='relation') d.entries[0].related=[{slug:'missing',kind:'관계'}];
 if(defect==='missing') d.entries[0].description='';
 if(defect==='alias') d.entries[0].aliases=['Odin','ODIN'];
 assert.throws(()=>validateSeed(d));
});
test('DB 장애는 내부 SQL 없는 500 응답',async()=>{
 // Exercise the actual exported handler with a failing binding, not a login bypass.
 const handler=(await import('../src/index')).default;
 const response=await handler.fetch(new Request('https://mythos.test/api/v1/entries'),{DB:{prepare(){throw new Error('SECRET SQL');}} as unknown as D1Database,ASSETS:{} as Fetcher,CORS_ORIGINS:''});
 assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/SECRET SQL/);
});


