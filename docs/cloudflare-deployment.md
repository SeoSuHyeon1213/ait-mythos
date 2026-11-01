# Cloudflare 배포 절차

기본 배포 구성은 React 정적 자산 + TypeScript Workers API + D1이다. 무료 한도 안에서 시작하며 트래픽·D1 행 읽기·쓰기는 Cloudflare에서 확인한다. 로컬 검증은 원격 한도·실제 latency를 보장하지 않는다.

## 1. 로컬 확인
루트에서 `npm run setup`, `npm test`, `npm run test:e2e`, `npm run build`를 수행한다. `worker/.wrangler/`는 로컬 데이터이고 커밋하지 않는다.

## 2. 로그인과 D1 생성
사용할 계정으로 명시적으로 로그인한 뒤 worker/에서:

```powershell
npx wrangler login
npx wrangler whoami
npx wrangler d1 create mythos
```

응답의 실제 database_id를 `worker/wrangler.jsonc`의 DB 바인딩에 넣는다. 계정 ID나 토큰을 코드에 추가할 필요는 없다. 인증 토큰은 Cloudflare의 인증 저장소 또는 배포 환경의 비밀 설정으로 관리한다.

현재 0으로 된 ID는 로컬 전용 자리표시다. 원격 migration·seed·deploy 스크립트는 이 값으로 실행되지 않는다.

## 3. 원격 마이그레이션과 콘텐츠 적재
worker/에서 대상 계정·DB가 맞는지 확인한 뒤 실행한다. 기존 운영 DB라면 먼저 백업한다.

```powershell
npm run db:migrate:remote
npm run seed:remote
```

현재 seed는 오딘 샘플 1건이다. 공개 데이터 검수가 완료된 것으로 취급하지 않는다. 기존 .NET SQLite 파일은 자동 변환·업로드하지 않는다. 기존에 별도 콘텐츠를 추가했다면 JSON 원본을 준비하고 검증한 뒤 적재한다.

seed는 포함된 항목을 갱신하므로 SQL을 `worker/.generated/seed.sql`에서 검토할 수 있다. 생성 SQL에는 콘텐츠가 들어 있으므로 비밀값은 넣지 않는다. HTTP 쓰기 API는 제공하지 않는다.

## 4. 웹과 API 배포
저장소 루트로 돌아와:

```powershell
npm run deploy
```

React 웹을 빌드하고 Workers 정적 자산과 API를 함께 배포한다. `workers_dev: true`로 초기 workers.dev 주소를 사용할 수 있다. CLI가 반환한 실제 HTTPS 주소를 사용한다. 커스텀 도메인은 선택 사항이다.

배포 후 `/health`, `/api/v1/entries?q=Woden`, `/entries/odin`을 확인한다. `/api/unknown`이 SPA HTML이 아닌 404 JSON을 반환하는지도 확인한다. 네비게이션 요청에서도 API 경로가 Worker를 먼저 거치도록 run_worker_first를 설정했다.

## 5. 앱인토스 연결
`frontend/.env.production`에 CLI가 반환한 실제 API 주소를 입력한다.

```text
VITE_API_BASE_URL=https://실제-Worker-주소
```

루트에서 `npm run build:miniapp`을 실행한다. `frontend/mythos.ait`를 토스 앱에서 확인하려면 별도 업로드·실기기 테스트가 필요하다. 서버 주소를 넣지 않은 번들은 Cloudflare 배포 주소에 연결되지 않는다.

CORS는 SDK 3.2.0 기준 mythos의 서비스·QR Origin만 허용한다. 앱 이름 변경 시 앱인토스 설정과 `worker/wrangler.jsonc`의 CORS_ORIGINS를 같이 수정한다. 웹은 같은 Origin으로 접근하므로 추가 CORS 없이 동작한다. 공개 사전 조회에는 토스 사용자 식별·파트너 API·mTLS를 추가하지 않는다.

## 참고
- [Workers 정적 자산](https://developers.cloudflare.com/workers/static-assets/binding/)
- [D1 마이그레이션](https://developers.cloudflare.com/d1/reference/migrations/)
- [D1 요금·무료 한도](https://developers.cloudflare.com/d1/platform/pricing/)
- [앱인토스 서버 CORS](https://developers-apps-in-toss.toss.im/documentation/integration/server-api)
