# API와 콘텐츠 계약

## 조회 API
- `GET /api/v1/entries?q=&culture=&category=&tag=&page=1&pageSize=12`
- `GET /api/v1/entries/{slug}`
- `GET /api/v1/entries/{slug}/related`
- `GET /api/v1/cultures`, `/api/v1/categories`, `/api/v1/tags`
- `GET /health` → `{ "status": "ok" }` (D1 연결 확인 포함)

이름·원어명·별칭의 부분 일치를 NFC 정규화와 소문자 변환으로 처리한다. 검색용 entry_names를 seed 시 생성하며 SQL의 EXISTS로 중복을 제거한다. culture/category/tag는 단일 ID의 AND 조건이다. 알 수 없는 ID는 빈 결과이며 결과 순서는 slug다. SQL 값은 D1 prepared statement로 전달한다.

목록 응답은 `{items,total,page,pageSize}`. page는 1~1,000,000, pageSize는 1~100이며 생략 시 1과 12다. 잘못된 정수·범위는 400, 결과 범위 밖의 페이지는 빈 items, 없는 slug는 404다. 오류는 Problem Details JSON이며 조회 외 API 메서드는 405다.

카드: slug/name/originalName/summary/culture/category/tags. 분류는 `{id,name}`. 상세에는 description/materialType/aliases/sources가 추가된다. source는 `{title,url,locator}`, related는 `{slug,name,kind}` 배열이다. 관계는 등록된 방향으로만 반환한다. API 오류가 정적 SPA HTML로 바뀌지 않도록 경로를 분리한다.

## JSON과 D1
현재 콘텐츠 원본은 `worker/content/entries.json`, SQL 스키마는 `worker/migrations/0001_initial.sql`이다.

최상위 cultures/categories/tags는 `{id,name}` 목록, entries는 다음 필드의 항목 목록이다.

`slug, name, originalName, summary, description, materialType, culture, category, aliases, tags, sources, related`

- culture/category/tags는 최상위 목록 ID를 참조한다.
- related는 `{slug,kind}`이며 같은 JSON 내의 다른 항목을 참조한다.
- sources는 `{title,url,locator}`이고 최소 1건과 HTTPS URL이 필요하다.
- `worker/src/content/seed.ts`가 필수값·식별자·중복·참조·출처 형식을 검사한다. 검증 실패 시 SQL 파일을 생성·실행하지 않는다.
- seed는 포함된 항목을 upsert하고 별칭·검색 이름·태그·출처 링크·나가는 관계를 교체한다. JSON에 없는 기존 항목은 삭제하지 않으며 쓰이지 않는 sources 레코드는 남을 수 있다.
- API는 조회만 수행하며 마이그레이션·seed를 요청 시 자동 실행하지 않는다.
- 로컬 적재는 wrangler --local, 원격 적재는 명시적인 --remote 명령을 사용한다. 테스트의 SQL batch는 트랜잭션으로 수행한다. CLI 파일 적재는 중단 시 상태를 확인하고 재실행한다.
- 외부 자료 수집, 완전한 JSON Schema 파일, 공개 콘텐츠 편집 검수 및 기존 SQLite 추가 데이터의 이전은 별도 작업이다.
