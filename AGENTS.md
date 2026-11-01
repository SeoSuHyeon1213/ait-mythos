# Mythos 프로젝트 작업 지침

## 목적과 문서 역할
- Mythos는 앱인토스에서 세계 신화·전설·민담과 동서양 판타지의 존재·개념을 검색하고 탐색하는 웹 사전이다. 일반 이용자의 정보 탐색과 창작자의 출처·연관 개념 조사를 지원한다.
- 제품 범위와 완료 기준은 `Mythos_MVP_간단기획서.md` v1.1(2026-11-01)을 기준으로 한다.
- AGENTS.md는 지속적인 개발 지침, CHECKLIST.md는 진행·검증 기록, SKILL.md는 작업 시작·구현·재개 절차를 담당한다.
- 사용자 요청과 상위 지침을 우선한다. 문서에 적힌 후속 작업을 현재 요청의 실행 권한으로 해석하지 않는다.

## MVP 범위
- 검수된 항목 50개로 `검색 → 상세 조회 → 출처 확인 → 연관 항목 탐색`을 완성한다.
- 필수 기능: 한글명·원어명·별칭 통합 검색, 문화권·존재 유형·주제 태그 조합 필터, 상세·출처 표시, 연관 항목 링크, 모바일 반응형 UI.
- MVP 제외: 로그인, 북마크, AI 자연어 검색, 관계도 시각화, 창작자 컬렉션, 웹 관리자 화면.
- 두 항목 비교, 문화권 지도 등 향후 확장은 별도 요청이나 확정된 범위 변경이 있을 때 진행한다.

## 기술 구성과 구조
기본 서버·배포 구성은 Cloudflare Workers/D1이다. 기존 .NET 코드는 비교·복구용으로 보존하며 현재 개발의 기준으로 사용하지 않는다.

| 영역 | 목표 기술 |
|---|---|
| 프론트엔드 | React, TypeScript, Tailwind CSS |
| 백엔드 | Cloudflare Workers, TypeScript |
| 데이터 접근 | D1 Workers Binding API, prepared SQL |
| DB | Cloudflare D1(SQLite 기반) |
| 테스트 | Node test runner + Miniflare/workerd·D1, Playwright |
| 콘텐츠 관리 | worker/content JSON → 검증 → SQL 생성 → D1 Seed Import |
| 웹 배포 | Workers Static Assets(React SPA), API와 함께 배포 |

- 백엔드 흐름은 `Worker 요청 라우팅 → Services → Repositories → D1`다. 검색·검증 규칙은 Services, 데이터 접근은 Repositories에 둔다.
- 주요 엔티티: MythEntry, Culture, Category, Tag, EntryAlias, Source, EntrySource, EntryRelation.
- 공개 API는 조회 중심으로 구성하고 초기 콘텐츠 수정은 JSON으로 관리한다. 공개 쓰기 API나 관리자 UI를 임의로 추가하지 않는다.
- 기존 구조·스타일·공용 자원을 먼저 확인한다. 사용자 변경을 덮어쓰거나 관련 없는 리팩터링·의존성을 추가하지 않는다.

## 콘텐츠 품질
- 문화권: 그리스·로마, 북유럽, 한국·중국·일본, 이집트·메소포타미아. 판타지 개념도 포함한다. 문화권별 수량 배분은 기획서에 없으므로 고정 할당량을 임의로 만들지 않는다.
- 존재 유형: 신, 영웅, 정령, 괴물, 종족, 장소, 개념. 주제: 창세, 죽음, 전쟁, 지혜, 자연, 운명 등.
- 항목마다 이름·별칭·설명·문화권·분류·태그·출처·연관 항목을 기록하고 상세에는 요약과 설명을 제공한다.
- 고대 문헌, 구전·민속, 후대 문학, 현대 판타지라는 자료 성격과 서로 다른 전승을 구분한다. 현대 창작 설정을 고대 전승처럼 서술하지 않는다.
- 공개 전 출처의 존재와 내용의 근거를 검수한다. 출처를 지어내거나 자동 검증 통과를 편집 검수 완료로 간주하지 않는다.
- JSON은 필수 정보, 식별자·slug 중복, 분류·태그·출처·관계 참조의 유효성을 검증한다. 세부 필드명과 다중 분류 규칙은 스키마 설계 때 확정한다.
- 이름과 여러 별칭에 동시에 일치해도 같은 항목을 중복 반환하지 않는다. 필터·페이지네이션에도 적용한다.
- 연관 링크는 실제 항목으로 연결한다. 모든 관계를 대칭으로 취급하거나 역관계 자동 생성을 근거 없이 도입하지 않는다.

## 화면과 API
| 화면 | 경로 | 필수 내용 |
|---|---|---|
| 홈 | `/` | 검색창, 추천 항목, 문화권별 탐색 |
| 검색 결과 | `/search` | 검색어, 문화권·유형·주제 필터, 결과 카드, 페이지네이션 |
| 상세 | `/entries/{slug}` | 기본 설명, 별칭, 출처, 연관 항목 링크 |

- 검색 조건은 URL 쿼리스트링에 유지하여 공유·새로고침 후 복원한다. 페이지 이동 시에도 조건을 보존한다.
- 기획서 API 예시:

```http
GET /api/v1/entries?q=odin&culture=norse&tag=wisdom
GET /api/v1/entries/{slug}
GET /api/v1/entries/{slug}/related
GET /api/v1/cultures
GET /api/v1/categories
GET /api/v1/tags
GET /health
```

- 존재 유형 필터는 필수다. 유형·페이지네이션 파라미터, 응답·오류 형식은 구현 전에 정하고 프론트·백엔드·테스트에 동일하게 적용한다. 예시에 없는 세부값을 확정 계약으로 기록하지 않는다.
- 모바일에서 검색·필터·출처 확인·연관 이동을 사용할 수 있어야 한다. 로딩·결과 없음·조회 실패·존재하지 않는 항목 상태도 처리한다.
- 앱인토스 SDK나 배포 설정을 다룰 때 공식 문서와 실제 환경을 확인한다. MVP에 없는 로그인·광고·결제·서버 식별 기능을 임의로 추가하지 않는다.

## 개발 순서와 검증
1. 프로젝트, 엔티티·마이그레이션, 샘플 데이터를 준비한다.
2. 첫 구현은 `오딘 JSON 1건 → D1 적재 → 검색 API → React 상세 화면`을 연결하고 확인한다.
3. JSON 스키마·Seed Importer, 출처·관계 검증과 데이터를 확장한다.
4. 검색·조합 필터·상세·출처·연관 API와 홈·검색·상세·모바일 UI를 완성한다.
5. 50개 항목 검수, Workers/D1 통합 테스트, API 오류 처리, 공개 베타 준비를 수행한다.

- 핵심 검증: 이름·별칭 검색 중복 제거, 문화권·유형·주제 조합 필터, 상세·출처·관계 조회.
- JSON 적재 실패·잘못된 참조, 빈 결과, 잘못된 조회 조건, 없는 slug의 동작을 영향 범위에 맞게 확인한다.
- 실제 설정에서 확인한 설치·실행·빌드·테스트 명령과 실행 위치를 기록한다. 실행하지 않은 검증을 통과로 표시하지 않는다.

## 현재 상태와 기록
- 현재 코드: frontend/는 앱인토스 React·Vite·Tailwind, worker/는 TypeScript Workers·D1이다. 오딘 JSON 1건과 기존 조회 API·화면을 연결한다. 50개 항목 검수와 원격 배포·실기기 검증은 별도다.
- backend/Mythos.Api/, tests/Mythos.Api.Tests/, Mythos.slnx, dotnet-tools.json과 기존 SQLite 파일은 이전 구현 보존본이며 기본 실행·배포에 사용하지 않는다.
- 루트에서 `npm run setup`, `npm run dev:api`, `npm run dev:web`, `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build`를 사용한다. README.md와 docs/cloudflare-deployment.md에서 실행 위치·원격 절차를 확인한다.
- `npm run build`는 웹 빌드와 Worker dry-run이다. 원격 배포는 `npm run deploy`, 앱인토스 번들은 `npm run build:miniapp`으로 구분한다.
- 원격 명령 전에 worker/wrangler.jsonc의 DB ID·계정을 확인한다. 기본 ID는 로컬 전용 자리표시다. 원격 리소스 생성·적재·배포는 해당 요청 범위에서만 수행한다.
- 현재 콘텐츠 원본은 worker/content/entries.json이다. seed는 포함된 slug를 갱신하고 JSON에 없는 기존 항목은 삭제하지 않는다. 기존 SQLite를 자동으로 초기화·업로드하지 않는다.
- 검색은 D1 SQL의 EXISTS와 prepared statement를 사용한다. 이름·별칭은 seed 시 NFC 정규화·소문자 검색 이름을 만들며 태그는 여러 항목이 공유한다.
- 로컬 D1은 worker/.wrangler/ 아래에 두고 소스·원격 DB와 구분한다. E2E는 .wrangler/e2e/를 사용한다. .wrangler, .generated, .build, DB·키·토큰은 커밋하지 않는다.
- SDK 3.2.0의 서비스·QR Origin만 CORS로 허용한다. Cloudflare 웹은 같은 Origin의 /api를 사용하고 앱인토스 번들은 실제 HTTPS API 주소를 설정해 재빌드한다.
- 작업 시작·재개 시 적용 지침, 관련 코드·설정, Git 상태와 실제 변경을 확인한다. frontend/ 지침은 화면 작업에도 적용한다.
- CHECKLIST.md에 현재 전환 결과와 이전 .NET 검증 기록을 구분하고, 필요한 작업·검증이 끝난 항목만 완료로 표시한다.
