# Mythos MVP 개발 체크리스트

기준: `Mythos_MVP_간단기획서.md` v1.1, 2026-11-01.

## 목표와 현재 상태
- 목표: 검수된 50개 항목으로 검색 → 상세 → 출처 → 연관 항목 탐색 제공.
- 대상: React·TypeScript·Tailwind CSS, Cloudflare Workers·TypeScript·D1, JSON→SQL 적재, Miniflare/workerd 통합 검증.
- 제외: 로그인, 북마크, AI 자연어 검색, 관계도 시각화, 창작자 컬렉션, 웹 관리자 화면.
- 진행 단계: Cloudflare 구조 전환 완료 — 로컬 검증 완료, 원격 배포 준비 단계.
- 확인 상태: frontend/와 worker/가 기본 실행 대상이며 이전 .NET 파일은 보존한다.
- 다음 할 일: JSON Schema 정식화, 콘텐츠 수정·삭제 적재 정책, 50개 항목 준비·검수, 실제 API 배포·실기기 검증.
- 계약: category가 유형 필터이며 page/pageSize를 사용한다. 자세한 API·JSON 계약은 docs/api-contract.md 참고. 배포 대상은 Cloudflare Workers/D1이다. 실제 계정·D1 ID·HTTPS 주소는 아직 미설정.
- 차단 원인: 로컬 구현에는 없음. 실기기 연결에는 실제 HTTPS API 배포 주소가 필요하다.

## 관리 규칙
- 실제 작업과 필요한 검증이 끝난 항목만 체크한다. 실패·차단·미실행을 완료로 표시하지 않는다.
- 검증 기록에는 명령·실행 위치 또는 확인 방법, 결과와 근거를 남긴다.
- 장기 규칙은 AGENTS.md, 절차는 SKILL.md, 현재 진행·결정·차단은 이 문서에서 관리한다.
- 후속 작업은 관련 단계와 기록을 갱신하고 다른 작업의 기록을 임의로 덮어쓰지 않는다.

## 0. 기획 기준 문서 정비
- [x] 기획서·기존 세 문서·상위 지침 유무·루트 구성·Git 상태를 확인했다.
- [x] AGENTS.md에 MVP 범위·기술·콘텐츠·화면·API·검증 기준을 반영했다.
- [x] CHECKLIST.md를 기획서의 개발 단계와 인수 기준에 맞게 구체화했다.
- [x] SKILL.md를 Mythos 개발·콘텐츠·검증·재개 절차로 수정했다.
- [x] 세 문서의 기획서 정합성과 SKILL.md 형식을 검토했다.

## 1. 기반 구축과 첫 구현
- [x] SDK·런타임·패키지 환경과 프로젝트 생성 방법을 확인한다.
- [x] React·TypeScript·Tailwind CSS와 TypeScript Cloudflare Workers 프로젝트를 구성한다.
- [x] `Worker 요청 라우팅 → Services → Repositories → D1` 구조를 구성한다.
- [x] MythEntry, Culture, Category, Tag, EntryAlias, Source, EntrySource, EntryRelation과 D1 SQL 마이그레이션을 마련한다.
- [x] Miniflare/workerd·D1 테스트 프로젝트와 실제 설치·실행·빌드·테스트 명령을 문서화한다.
- [x] 출처·별칭·분류가 포함된 오딘 JSON 1건을 준비하고 D1에 적재한다.
- [x] 검색 API에서 오딘을 찾고 React 상세 화면에서 설명·출처를 확인하는 전체 흐름을 검증한다.

## 2. 콘텐츠와 데이터 적재
- [ ] 필수 정보·자료 성격·참조 방식·slug 규칙을 담은 JSON 스키마를 확정한다.
- [ ] JSON 검증 → DB Seed Import 절차와 실패 시 처리 방식을 구현한다.
- [ ] 식별자·slug 중복 및 문화권·분류·태그·출처·연관 항목의 잘못된 참조를 검출한다.
- [ ] 그리스·로마, 북유럽, 한국·중국·일본, 이집트·메소포타미아 및 판타지 개념을 포함한 50개 항목을 준비한다.
- [ ] 신·영웅·정령·괴물·종족·장소·개념 분류와 창세·죽음·전쟁·지혜·자연·운명 등의 주제를 정리한다.
- [ ] 각 항목의 이름·별칭·설명·문화권·분류·태그·출처·연관 항목을 검토한다.
- [ ] 고대 문헌·구전/민속·후대 문학·현대 판타지 및 전승 차이를 구분하고 50개 항목의 출처를 공개 전 검수한다.

## 3. API 개발
- [x] 유형·페이지네이션 파라미터와 응답·오류 계약을 정하고 프론트와 공유한다.
- [x] `GET /api/v1/entries`에서 한글명·원어명·별칭을 통합 검색하고 중복을 제거한다.
- [x] 문화권·존재 유형·주제 태그 조합 필터와 페이지네이션을 구현한다.
- [x] `GET /api/v1/entries/{slug}`에서 설명·별칭·분류·출처를 반환한다.
- [x] `GET /api/v1/entries/{slug}/related`에서 유효한 연관 항목을 반환한다.
- [x] `GET /api/v1/cultures`, `/api/v1/categories`, `/api/v1/tags`를 제공한다.
- [x] `GET /health`와 API 오류 처리를 구현한다.

## 4. 화면 개발
- [x] 홈(`/`): 검색창·추천 항목·문화권별 탐색을 제공한다.
- [x] 검색(`/search`): 검색 입력·문화권/유형/주제 필터·결과 카드·페이지네이션을 제공한다.
- [x] 상세(`/entries/{slug}`): 설명·별칭·출처·연관 항목 링크를 제공한다.
- [x] 검색·필터·페이지 조건을 URL 쿼리에 유지하고 공유·새로고침 시 복원한다.
- [x] 로딩·결과 없음·조회 실패·존재하지 않는 항목 상태를 처리한다.
- [x] 모바일에서 검색 → 상세 → 출처 → 연관 이동 흐름을 확인한다.
- [x] Mythos 디자인 시스템(전한 칠기·그리스 도기 팔레트, 메안더·운기문, 명조 제목) light 테마를 frontend 토큰·홈·검색·상세에 적용했다. 2026-11-02 루트에서 `npm run lint`, `npm run build` 통과, `npm run test:e2e`의 explore 3건 통과(모바일 스크린샷 확인). cloudflare 1건은 `.env.production`의 원격 API 주소로 빌드된 dist가 로컬 5080에서 `Failed to fetch`로 실패했다(스타일 변경과 무관, 미해결).
- [ ] 다크 테마, 필터를 select에서 칩으로 바꾸는 작업, Google Fonts의 토스 앱 WebView 로딩 확인은 남아 있다.

## 5. 검증과 공개 베타 준비
- [ ] Workers/D1 통합 테스트로 이름·별칭 검색과 동일 항목 중복 제거를 검증한다.
- [ ] Workers/D1 통합 테스트로 문화권·유형·주제 조합 필터와 페이지네이션 결과를 검증한다.
- [ ] Workers/D1 통합 테스트로 상세·출처·연관 API와 없는 항목의 동작을 검증한다.
- [ ] JSON 검증·적재에서 누락·중복·잘못된 참조를 확인한다.
- [ ] 잘못된 API 조건·빈 결과·오류 처리와 화면 대응을 확인한다.
- [ ] 실제 설정의 빌드·정적 검사·테스트 명령을 실행하고 결과를 기록한다.
- [ ] 앱인토스 실행·배포 환경과 절차를 확인하고 공개 베타를 준비한다.

## MVP 인수 기준
- [ ] 검수 완료된 50개 항목이 등록되어 있다.
- [ ] 이름과 별칭 모두 검색되며 결과가 중복되지 않는다.
- [ ] 문화권·유형·주제 필터가 정상 작동한다.
- [ ] 공개 항목마다 출처가 표시된다.
- [ ] 연관 항목 사이를 이동할 수 있다.
- [ ] 모바일에서 주요 탐색 흐름을 이용할 수 있다.
- [ ] 핵심 검색·필터·관계 API 테스트가 통과한다.

## 이전 구현·문서 검증 기록 (.NET 전환 전)

| 일자 | 확인 항목 | 명령 또는 방법 | 결과·근거 |
|---|---|---|---|
| 2026-11-01 | 기존 상태 | 루트 목록, 상위 AGENTS.md 유무, Git status/diff 확인 | 통과 — 네 문서 미추적 상태, 구현 코드 없음, 상위 AGENTS.md 없음 |
| 2026-11-01 | 문서 정합성 | 기획서 1~9절과 범위·기술·콘텐츠·경로·단계·인수 기준 대조 | 통과 — 문서 정비와 개발 상태를 구분하여 반영 |
| 2026-11-01 | 스킬 기본 형식 | frontmatter 경계, name·description, 이름 규칙 및 UTF-8 확인 | 통과 — 기본 형식을 별도로 검사 |
| 2026-11-01 | 표준 스킬 검사 | quick_validate.py 실행 | 실패 — 환경에 PyYAML이 없어 실행 불가 |
| 2026-11-01 | 앱 빌드·NUnit·실기기 | 미실행 | 구현 코드·설정이 없고 이번 요청은 문서 수정 |

## 주요 결정과 남은 작업
- 기술 스택은 목표 구성으로 기록하며 설치·구현 완료로 표시하지 않는다.
- API 예시에 유형 필터 파라미터가 없지만 기능·인수 기준에는 필수이므로 계약 확정 항목으로 남긴다.
- 첫 구현은 오딘 1건의 전체 흐름을 확인한 뒤 50개 항목과 전체 기능으로 확장한다.
- 이전 문서 정비 작업은 문서 세 개 수정으로 한정했다. 앱 구현·데이터 작성·배포는 후속 개발 작업이다.


## 기본틀 구축 기록 (2026-11-01)
- F:/ait/my-miniapp의 SDK/devtools·Vite 설정과 토큰·아이콘을 참고했다. 원본 템플릿은 변경하지 않았다.
- React 19·TypeScript·Tailwind 4·Vite 8, ASP.NET Core 10·EF Core 10.0.14·SQLite, NUnit과 초기 마이그레이션을 구성했다.
- 조회 API와 홈·검색·상세·오류 상태를 구현했다. JSON 샘플은 오딘 1건이며 아직 공개 편집 검수 완료가 아니다.
- 작업용 사본 검증 통과: NUnit 18/18, Chromium 모바일 흐름 3/3, lint 경고 0, 웹/앱인토스 번들 생성 성공.
- API와 UI 단계 체크는 샘플로 동작하는 기본틀 구현을 뜻한다. 50개 콘텐츠 및 전체 MVP 인수 기준 완료를 뜻하지 않는다.
- importer는 기존 slug 본문을 갱신하지 않는 추가 방식이다. 정식 JSON Schema와 콘텐츠 수정·삭제 정책은 남아 있다.
- .ait는 로컬 빌드 검증용이며 실기기용 API 주소 미설정, 업로드·배포 미실행이다.

### 실제 프로젝트 경로 최종 확인
- `F:/ait/Mythos`에서 `dotnet tool restore`, `dotnet test Mythos.slnx` 통과: NUnit 18/18.
- `F:/ait/Mythos/frontend`에서 `npm ci`, `npm run lint`, `npm run build` 통과. 웹·mythos.ait 생성, npm audit 취약점 0.
- API 프로젝트에서 `dotnet run --no-launch-profile -- --seed` 통과: data/mythos-dev.db에 초기 스키마와 오딘 샘플 생성.
- Windows의 Data/data 경로 충돌을 피하려고 DB 접근 소스를 Persistence/로 분리했다. 복사된 기존 작업용 DB 파일은 보존하고 기본 연결에서는 사용하지 않는다.
- 실제 frontend 경로에서 `npm run test:e2e` 통과: Chromium 모바일 3/3 (검색·상세·출처, 필터 URL 복원, 빈 결과·오류 재시도). 기획서 원본 해시도 유지됨을 확인했다.

## Cloudflare 전환 (2026-11-01)
- [x] Workers/D1 라우팅·서비스·저장소와 기존 API 계약을 구현했다.
- [x] 정규화 SQL 스키마·인덱스·JSON 검증·반복 적재·본문 갱신을 마련했다.
- [x] 작업용 사본에서 타입 검사·Worker dry-run·workerd/D1 테스트 37개가 통과했다.
- [x] 원격 D1 ID 자리표시를 검사해 잘못된 원격 명령을 차단한다.
- [x] 기존 .NET 코드와 SQLite 파일을 보존하고 새 기본 실행 명령을 구분했다.
- [x] 기획서 v1.1·AGENTS·SKILL·README·API·배포 문서를 전환 구성으로 맞췄다.
- [x] 실제 Mythos 경로의 로컬 migration/seed·모바일 E2E·전체 빌드를 검증했다.
- [ ] Cloudflare 계정 로그인·D1 생성·원격 migration/seed·배포를 수행한다. 현재 요청 범위인 구조 전환 이후 단계다.
- [ ] 실제 Worker 주소를 앱인토스 번들에 설정하고 토스 앱에서 확인한다.

남은 콘텐츠 작업: 50개 항목, 정식 JSON Schema, 출처 편집 검수, 외부 데이터 수집. 현재 데이터는 오딘 개발 샘플 1건이다.

### Cloudflare 최종 검증 결과
- worker/: npm ci, setup:local 통과. 로컬 D1 migration 14개 SQL, 검증된 seed 20개 SQL 실행 성공.
- 루트 npm test: 타입 검사·dry-run·workerd/D1 테스트 37/37 통과.
- 루트 npm run test:e2e: 모바일 4/4 통과. Cloudflare 정적 자산 상세 직접 진입과 API 404 JSON도 확인했다.
- 루트 npm run lint, npm run build 통과. 원격 업로드 없는 웹 빌드·Worker dry-run이다.
- check-deploy.mjs는 기본 D1 ID에서 의도대로 종료 코드 1로 원격 명령을 차단했다.
- .wrangler·.generated·.build의 Git 제외를 확인했다. 기존 .NET 코드·SQLite 파일은 보존했다.
- 원격 Cloudflare 리소스 생성·인증·배포·앱인토스 업로드는 미실행이다.
