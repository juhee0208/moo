# MOO — 맛집 탐색·그룹 저장·공유 앱

Flutter(앱) · Express(API) · PostgreSQL(DB) · Docker Compose(실행 환경) · Jenkins(CI/CD)

## 폴더 구조

```
moo/
├── app/                          # Flutter 앱 (iOS / Android)
│   ├── lib/
│   │   ├── core/
│   │   │   ├── config/env.dart   # API_BASE_URL (--dart-define 으로 환경별 주입)
│   │   │   ├── network/          # HTTP 클라이언트, 인증 토큰 처리
│   │   │   ├── router/           # 화면 라우팅, 딥링크(그룹 초대)
│   │   │   └── theme/            # 색상·타이포·공통 스타일
│   │   ├── shared/widgets/       # 빈 화면·토스트·바텀시트 등 공통 위젯
│   │   └── features/             # 기능 단위 폴더 (각각 data/ · domain/ · presentation/)
│   │       ├── auth/             # 스플래시, SNS 로그인, 약관 동의
│   │       ├── onboarding/
│   │       ├── home/
│   │       ├── search/           # 통합 검색, 최근 검색어
│   │       ├── place/            # 맛집 상세, 그룹 선택 바텀시트
│   │       ├── group/            # 그룹 홈/상세/생성/수정, 초대·참여, 멤버 관리
│   │       ├── map/              # 내주변 지도, 목록 보기
│   │       └── my/
│   ├── test/                     # Unit / Widget 테스트
│   └── integration_test/         # 통합 테스트
│
├── backend/                      # Express API 서버
│   ├── src/
│   │   ├── app.js                # Express 앱 생성 (테스트에서 DB mock 주입)
│   │   ├── server.js             # 실행 진입점, 종료 시 연결 정리
│   │   ├── config/env.js         # 환경변수 읽기
│   │   ├── db/pool.js            # PostgreSQL 연결 풀
│   │   ├── middlewares/          # 인증, 에러 핸들러
│   │   ├── common/               # 공통 에러·응답 유틸
│   │   └── modules/              # 도메인 단위 (각각 *.routes.js · *.service.js · *.repository.js)
│   │       ├── auth/             # SNS 로그인(카카오·네이버·Apple·Google), 토큰
│   │       ├── users/            # 계정, 약관 동의, 마이
│   │       ├── places/           # 맛집 조회, 지도 viewport 검색
│   │       ├── groups/           # 그룹 CRUD, 그룹-맛집 저장, 멤버 권한
│   │       ├── invites/          # 초대 링크 발급·재발급·참여
│   │       └── search/           # 통합 검색, 최근 검색어
│   ├── migrations/               # DB 스키마 변경 이력
│   ├── test/                     # node --test (단위), integration/ (실제 PostgreSQL)
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json / package-lock.json
│
├── infra/                        # 스테이징·운영 서버용 (서버의 /opt/moo/ 로 복사)
│   ├── compose.prod.yaml         # 운영 Compose (API는 Registry 이미지 사용)
│   ├── nginx/moo-api.conf        # HTTPS 리버스 프록시 템플릿
│   └── scripts/
│       ├── deploy.sh             # 이미지 pull → api 재기동
│       └── backup-db.sh          # pg_dump 백업 (cron)
│
├── compose.yaml                  # 로컬 개발용 (postgres + api)
├── .env.example                  # 환경변수 예시 → .env 로 복사
├── Jenkinsfile                   # 테스트 → 빌드 → 이미지 push → 스테이징 배포 → smoke test
└── README.md
```

## 로컬 실행

```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:3000/health   # {"status":"ok","database":"connected"}
```

종료는 `docker compose down`. `down -v` 는 DB 볼륨까지 삭제한다.

## 테스트

```bash
cd backend && npm test
cd app && flutter analyze && flutter test   # Flutter 프로젝트 생성 후
```

## Flutter 프로젝트 생성

`app/` 에는 폴더 골격만 있다. Flutter SDK 설치 후 한 번 실행한다.

```bash
cd app && flutter create --org com.moo --project-name moo --platforms ios,android .
```

Android Emulator 에서 로컬 API 사용: `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000`
