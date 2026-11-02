import { Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from './api';
import type { EntryCard, EntryDetail, EntryPage, Lookup, Related } from './api';
import { ChevronRight, Search } from './components/icons';

function Feedback({error, retry}: {error?: string; retry: () => void}) {
 return <div className="notice" role={error ? 'alert' : 'status'}><p>{error ?? '사전을 불러오고 있어요.'}</p>{error && <button onClick={retry}>다시 시도</button>}</div>;
}
function SearchForm({filters = false}: {filters?: boolean}) {
 const [params] = useSearchParams();
 const cultures = useApi<Lookup[]>('/api/v1/cultures');
 const categories = useApi<Lookup[]>('/api/v1/categories');
 const tags = useApi<Lookup[]>('/api/v1/tags');
 const filterError = cultures.error || categories.error || tags.error;
 return <><form action="/search" className="search-form" key={params.toString()}>
  <label htmlFor="query">어떤 이야기가 궁금한가요?</label>
  <div className="search-row"><div className="query"><Search size={22}/><input id="query" name="q" type="search" placeholder="이름이나 별칭으로 검색" defaultValue={params.get('q') ?? ''}/></div><button type="submit" className="primary">검색</button></div>
  {filters && <div className="filters">{([['culture','문화권',cultures.data],['category','존재 유형',categories.data],['tag','주제',tags.data]] as const).map(([name,label,options]) => <label key={name}>{label}<select aria-label={label} key={name + (options?.map(x => x.id).join() ?? "loading")} name={name} defaultValue={params.get(name) ?? ''}><option value="">전체</option>{options?.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>)}</div>}
 </form>{filters && filterError && <Feedback error={filterError} retry={() => {cultures.retry(); categories.retry(); tags.retry();}}/>}</>;
}
function Card({entry}: {entry: EntryCard}) {
 return <Link className="entry-card" to={'/entries/' + entry.slug}><div><p className="eyebrow culture" data-culture={entry.culture.id}>{entry.culture.name} · {entry.category.name}</p><h3>{entry.name} <span className="original">{entry.originalName}</span></h3><p>{entry.summary}</p><div className="tags">{entry.tags.map(t => <span key={t.id}>{t.name}</span>)}</div></div><ChevronRight size={22}/></Link>;
}
function Home() {
 const entries = useApi<EntryPage>('/api/v1/entries?pageSize=3');
 const cultures = useApi<Lookup[]>('/api/v1/cultures');
 return <><section className="hero"><p className="eyebrow">MYTHOS · 신화와 판타지 사전</p><h1>이름 하나에서<br/>시작되는 신화 탐색</h1><p>신화 속 존재를 찾고,<br className="mobile-break"/> 출처를 따라 이야기를 탐색하세요.</p><SearchForm/><span className="meander" aria-hidden="true"/></section>
 <section><div className="section-title"><h2>먼저 만나볼 이야기</h2><Link to="/search">전체 보기</Link></div>{entries.data ? entries.data.items.length ? entries.data.items.map(e => <Card key={e.slug} entry={e}/>) : <div className="notice">아직 등록된 이야기가 없어요.</div> : <Feedback error={entries.error} retry={entries.retry}/>}</section>
 <section><h2>문화권으로 탐색</h2>{cultures.data ? <div className="culture-list">{cultures.data.map(c => <Link key={c.id} to={'/search?culture=' + c.id}><span className="culture" data-culture={c.id}>{c.name}</span><ChevronRight size={20}/></Link>)}</div> : <Feedback error={cultures.error} retry={cultures.retry}/>}</section>
 <p className="footnote">개발용 샘플 1건으로 시작합니다. 콘텐츠는 공개 전 검수 예정이에요.</p></>;
}
function SearchPage() {
 const [params] = useSearchParams();
 const data = useApi<EntryPage>('/api/v1/entries?' + params.toString());
 function pageLink(page: number) {const next = new URLSearchParams(params); next.set('page', String(page)); return '/search?' + next.toString();}
 return <><p className="eyebrow">이야기 찾기</p><h1>신화 탐색</h1><SearchForm filters/>{data.data ? <section aria-live="polite"><div className="section-title"><h2>검색 결과</h2><span>{data.data.total}개</span></div>{data.data.items.length ? data.data.items.map(e => <Card key={e.slug} entry={e}/>) : <div className="notice"><h3>검색 결과가 없어요</h3><p>이름이나 별칭을 바꾸거나 필터를 줄여 보세요.</p><Link className="button" to="/search">조건 초기화</Link></div>}<div className="pagination">{data.data.page > 1 && <Link className="button" to={pageLink(data.data.page-1)}>이전 페이지</Link>}{data.data.page * data.data.pageSize < data.data.total && <Link className="button" to={pageLink(data.data.page+1)}>다음 페이지</Link>}</div></section> : <Feedback error={data.error} retry={data.retry}/>}<Link className="text-link" to="/">홈으로</Link></>;
}
function DetailPage() {
 const {slug} = useParams();
 const data = useApi<EntryDetail>('/api/v1/entries/' + encodeURIComponent(slug ?? ''));
 const related = useApi<Related[]>('/api/v1/entries/' + encodeURIComponent(slug ?? '') + '/related');
 if (!data.data) return <><Feedback error={data.error} retry={data.retry}/><Link className="text-link" to="/search">사전 탐색하기</Link></>;
 const e = data.data;
 return <div className="detail"><header className="detail-head"><span className="meander" aria-hidden="true"/><p className="eyebrow culture" data-culture={e.culture.id}>{e.culture.name} · {e.category.name}</p><h1>{e.name}</h1><p className="original">{e.originalName}</p><p className="lead">{e.summary}</p><div className="tags">{e.tags.map(t => <Link key={t.id} to={'/search?tag=' + t.id}>{t.name}</Link>)}</div></header>
 <span className="cloud" aria-hidden="true"/>
 <section><h2>이야기</h2><p className="description">{e.description}</p><p className="material">자료 성격 · {e.materialType}</p></section>
 <span className="cloud" aria-hidden="true"/>
 <section><h2>다른 이름</h2><p>{e.aliases.join(' · ') || '등록된 별칭이 없어요.'}</p></section>
 <span className="cloud" aria-hidden="true"/>
 <section className="sources"><h2>출처와 참고 문헌</h2>{e.sources.map(s => <article className="source" key={s.url+s.locator}><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a><p>{s.locator}</p></article>)}</section>
 <span className="cloud" aria-hidden="true"/>
 <section><h2>연관 이야기</h2>{related.data ? related.data.length ? related.data.map(r => <Link className="relation" key={r.slug+r.kind} to={'/entries/'+r.slug}>{r.name}<span>{r.kind}</span><ChevronRight size={20}/></Link>) : <p>아직 연결된 항목이 없어요.</p> : <Feedback error={related.error} retry={related.retry}/>}</section><Link className="text-link" to="/search">다른 이야기 찾기</Link></div>;
}
export default function App() {
 return <main className="canvas"><div className="content mx-auto w-full"><Routes><Route path="/" element={<Home/>}/><Route path="/search" element={<SearchPage/>}/><Route path="/entries/:slug" element={<DetailPage/>}/><Route path="*" element={<div className="notice"><h1>페이지를 찾을 수 없어요</h1><Link className="button" to="/">홈으로</Link></div>}/></Routes></div></main>;
}
