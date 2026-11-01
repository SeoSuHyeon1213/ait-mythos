# 이전 .NET 구현 보존본
현재 기본 서버는 루트의 worker/ (TypeScript Workers + D1)다. 이 디렉터리의 ASP.NET Core·EF Core 코드와 SQLite 파일은 전환 비교·복구용으로 보존한다. 기본 실행·빌드·배포·E2E 테스트에서는 사용하지 않는다. 새 콘텐츠와 서버 수정은 worker/에 반영한다. 기존 SQLite 데이터는 자동으로 D1에 업로드하지 않는다.
