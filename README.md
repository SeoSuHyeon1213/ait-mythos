# Mythos

앱인토스 신화·판타지 사전. 기본 서버를 Cloudflare Workers + D1으로 전환했다. React 화면과 기존 `/api/v1` 조회 계약은 유지한다.

## 구조
- `frontend/`: React·TypeScript·Tailwind·Vite, 앱인토스 SDK/devtools.
- `worker/src/`: 요청 라우팅 → Services → Repositories → D1.
- `worker/migrations/`: 정규화된 D1 SQL 스키마와 인덱스.
- `worker/content/entries.json`: 오딘 샘플 1건. 현재 콘텐츠 원본.
- `worker/scripts/`: JSON 검증·seed SQL 생성·배포 설정 확인.
- `worker/test/`: 실제 workerd + 로컬 D1을 사용하는 Node 테스트.
- `frontend/e2e/`: 모바일 탐색·오류 처리·Cloudflare 정적 화면 테스트.
- `docs/cloudflare-deployment.md`: 원격 배포 절차.
- `backend/`, `tests/Mythos.Api.Tests/`, `Mythos.slnx`, `dotnet-tools.json`: 이전 .NET 구현·테스트 보존본. 기본 실행에서 사용하지 않는다.

## 처음 실행
Node 24 이상이 필요하다. .NET이나 Cloudflare 로그인 없이 로컬 개발할 수 있다.
루트 `F:/ait/Mythos`에서:

```powershell
npm run setup
```

worker와 frontend 의존성을 각각 잠금파일로 설치하고 웹 빌드 → 로컬 D1 마이그레이션 → 검증된 JSON 적재를 수행한다. 기존 SQLite 파일을 읽거나 삭제하지 않는다.

터미널 1:

```powershell
npm run dev:api
```

터미널 2:

```powershell
npm run dev:web
```

`http://localhost:5173`에서 개발한다. Vite의 `/api`·`/health` 프록시는 5080의 Workers 로컬 서버를 사용한다. 웹 빌드 후 `http://127.0.0.1:5080`에서도 Workers 정적 자산으로 홈·검색·상세를 사용할 수 있다.

## 검증
루트에서:

```powershell
npm run lint
npm test
npm run build
```

`build`는 React 웹과 Worker dry-run을 수행하며 원격 배포는 하지 않는다. `npm test`도 Worker를 먼저 빌드한다. 최신 프론트 산출물 없이 처음 테스트할 경우 `npm run build:web`를 먼저 실행한다.

```powershell
Set-Location frontend
npx playwright install chromium
Set-Location ..
npm run test:e2e
```

E2E는 5080 포트를 비워 두고 실행한다. 테스트용 D1은 `worker/.wrangler/e2e/`에 격리되며 실제 원격 DB를 사용하지 않는다.

## 콘텐츠
`worker/content/entries.json` 수정 후 `npm run db:setup`으로 로컬 DB에 반영한다. 전체 JSON을 검증한 뒤 SQL을 생성한다. 포함된 slug의 본문·별칭·태그·출처·나가는 관계를 갱신한다. JSON에 없는 기존 항목은 삭제하지 않는다. 자료의 공개 검수는 별도다. 50개 항목과 외부 자료 수집은 아직 미구현이다.

## 배포
Workers 한 곳에 웹 정적 자산과 API를 배포하고 D1을 연결한다. `worker/wrangler.jsonc`는 로컬용 D1 ID를 사용하므로 실제 D1 생성 후 바꿔야 한다. 실제 ID를 넣기 전에는 원격 명령을 차단한다. 절차는 `docs/cloudflare-deployment.md`를 따른다.

앱인토스는 Cloudflare API 주소를 `frontend/.env.production`의 `VITE_API_BASE_URL`에 설정한 후 `npm run build:miniapp`으로 번들링한다. 결과는 `frontend/mythos.ait`다. 웹 정적 배포와 앱인토스 번들 배포는 별개다.

현재는 로컬 검증 및 dry-run까지다. Cloudflare 원격 리소스 생성·배포, 앱인토스 업로드·실기기 검증은 수행하지 않았다.
