# MOOH 모오호 — 같이 모으는 우리만의 맛집 지도

맛집을 검색해 그룹에 저장하고, 카카오톡으로 초대한 친구와 같은 맛집 목록을 함께 편집하는 iOS 앱.

`맛집 검색 → 그룹에 저장 → 카카오톡으로 초대 → 멤버와 공동 관리`

기획의 기준은 [`docs/`](docs/)이고, 이 README와 다르면 docs가 우선이다. 결정 이력은 [`docs/decisions.md`](docs/decisions.md)를 본다.

## MVP 범위

| 항목 | 내용 | 근거 |
|---|---|---|
| 플랫폼 | **iOS만** (Android는 MVP 이후) | D52 |
| 하단 탭 | **홈 / 그룹 / 마이** | D66 |
| 로그인 | 소셜 로그인 전용: 카카오 · 네이버 · Apple · Google. 만 14세 이상 | D30 |
| 가입 약관 | 필수 3개(만 14세 이상 · 이용약관 · 개인정보), 선택 없음 | D53 |
| 앱 권한 | **요청 없음** (위치 · 알림 · 사진 팝업 없음, 사진은 PhotosPicker) | D54 |
| 위치 | **수집 안 함.** 내주변 지도 · 위치 권한 · 위치기반서비스 약관 없음 | D66 |
| 맛집 데이터 | 카카오 로컬 API를 서버에서만 호출. 장소 ID · 장소명만 저장, 나머지는 조회 때마다 재호출 | `docs/04-external-api.md` |
| 검색 | `[음식점] [카페]` 탭, 선택한 탭만 카카오 호출. 앱에 지도 없음 | D77 · D85 |
| 초대 | 카카오톡 공유 + 앱 실행 파라미터(초대 토큰). 랜딩 페이지 · 지연 딥링크 없음 | D55 |
| 알림 | 푸시 없음, 앱 안 알림함만 | D20 |
| 상한 (무료) | 그룹 5개(만든 + 참여) · 그룹당 맛집 100개 · 그룹당 멤버 20명. 요금제별로 덮어쓸 수 있게 설계 | D32~D34 |
| 운영 콘텐츠 | 배너 · FAQ = 원격 설정 JSON, 공지 · 정책 문서 = 네이버 블로그 | D50 · D57 · D58 |
| 서버 | Oracle Cloud Always Free, Arm 1대, 춘천/서울 리전 | D63 |

> **카카오 선행 조건 (D35 · D69)** — 카카오 데브톡에서 "사용자가 저장한 맛집의 장소 ID · 장소명 · 좌표 저장" 허용 여부를 확인하기 전에는 카카오 데이터를 저장하는 기능(그룹 맛집 저장 · 재조회)을 구현하지 않는다. 인증 · 그룹 · 초대 · 알림은 먼저 진행할 수 있다. (`docs/open-questions.md` 기술 항목)

## 기획 문서

| 문서 | 내용 |
|---|---|
| [`01-overview.md`](docs/01-overview.md) | 서비스 정의, 범위, 화면 구조, 화면 ID |
| [`02-policies.md`](docs/02-policies.md) | 정책 수치(상수), 권한 매트릭스, 그룹 · 초대 · 삭제 · 맛집 정책, 상태값 |
| [`03-flows.md`](docs/03-flows.md) | 사용자 여정, 전체 흐름도, 화면 연결 |
| [`04-external-api.md`](docs/04-external-api.md) | 카카오 로컬 API 사용 · 저장 규칙 (카카오 코드 작성 전 필독) |
| [`05-messages.md`](docs/05-messages.md) | Toast · Dialog · 알림함 · 빈 화면 문구 |
| [`06-analytics.md`](docs/06-analytics.md) | 분석 이벤트 |
| [`07-dev-design.md`](docs/07-dev-design.md) | 데이터 모델, API 설계, 핵심 로직, 오류 코드 |
| [`08-roadmap.md`](docs/08-roadmap.md) | 인프라 → 디자인 → 구축 → 출시 → 상표 순서 |
| [`09-legal.md`](docs/09-legal.md) | 개인정보 · 스토어 심사 · 상표 체크리스트 |
| [`decisions.md`](docs/decisions.md) · [`open-questions.md`](docs/open-questions.md) | 결정 로그 · 미결 사항 |
| [`screens/`](docs/screens/) | 화면별 명세 (auth · home · search-place · group · invite · my) |

## 기술 스택

Flutter(앱) · Express(API) · PostgreSQL(DB) · Docker Compose(실행 환경) · Jenkins(CI/CD) — D67. 커버 · 프로필 이미지는 서버 디스크에 저장 (D68)

## 폴더 구조

```
moo/
├── docs/                         # 기획 문서 (위 표)
├── app/                          # Flutter 앱 (iOS)
│   ├── lib/
│   │   ├── core/
│   │   │   ├── config/env.dart   # API_BASE_URL (--dart-define 으로 환경별 주입)
│   │   │   ├── network/          # HTTP 클라이언트, 인증 토큰 처리
│   │   │   ├── router/           # 화면 라우팅, 카카오톡 초대 링크(앱 실행 파라미터) 처리
│   │   │   └── theme/            # 색상·타이포·공통 스타일
│   │   ├── shared/widgets/       # 빈 화면·토스트·바텀시트 등 공통 위젯
│   │   └── features/             # 기능 단위 폴더 (각각 data/ · domain/ · presentation/)
│   │       ├── auth/             # 스플래시, 소셜 로그인, 신규 가입 약관
│   │       ├── onboarding/
│   │       ├── home/             # 배너, 최근 그룹, 최근 저장 맛집, 함께하는 친구
│   │       ├── search/           # 통합 검색, 최근 검색어
│   │       ├── place/            # 맛집 상세, 그룹 선택 바텀시트
│   │       ├── group/            # 그룹 홈/상세/생성/수정, 친구 초대, 멤버 관리
│   │       └── my/               # 초대장, 알림함, FAQ, 환경설정, 회원 탈퇴
│   ├── test/                     # Unit / Widget 테스트
│   └── integration_test/         # 통합 테스트
│
├── backend/                      # Express API 서버
│   ├── src/
│   │   ├── app.js                # Express 앱 생성 (테스트에서 DB mock 주입)
│   │   ├── server.js             # 실행 진입점, 종료 시 연결 정리
│   │   ├── config/env.js         # 환경변수 읽기
│   │   ├── db/pool.js            # PostgreSQL 연결 풀
│   │   ├── db/migrate.js         # 마이그레이션 실행 (node-pg-migrate)
│   │   ├── middlewares/          # 인증, 에러 핸들러
│   │   ├── common/               # 공통 에러·응답 유틸
│   │   └── modules/              # 도메인 단위 (각각 *.routes.js · *.service.js · *.repository.js)
│   │       ├── auth/             # 소셜 로그인(카카오·네이버·Apple·Google), 토큰, 탈퇴 시 연결 끊기
│   │       ├── users/            # 계정, 약관 동의, 마이, 알림함
│   │       ├── places/           # 맛집 상세 재조회(카카오 프록시), 저장, 폐업 확인
│   │       ├── groups/           # 그룹 CRUD, 그룹-맛집 저장, 멤버 권한
│   │       ├── invites/          # 초대 링크 발급·재발급·resolve·참여, 대기 초대
│   │       └── search/           # 키워드 검색(카카오 프록시)
│   ├── migrations/               # DB 스키마 변경 이력 (SQL, node-pg-migrate)
│   ├── test/                     # node --test (단위), integration/ (실제 PostgreSQL)
│   ├── Dockerfile                # deps → test → runtime 멀티 스테이지, linux/arm64 배포
│   ├── .dockerignore
│   └── package.json / package-lock.json
│
├── infra/                        # 운영 서버용 (Oracle Cloud Arm 서버의 /opt/moo/ 로 복사)
│   ├── compose.prod.yaml         # 운영 Compose (API는 Registry 이미지 사용)
│   ├── nginx/moo-api.conf        # HTTPS 리버스 프록시 템플릿
│   └── scripts/
│       ├── deploy.sh             # 이미지 pull → 마이그레이션 → api 교체 → healthy 대기
│       └── backup-db.sh          # pg_dump 백업 (cron)
│
├── compose.yaml                  # 로컬 개발용 (postgres + api)
├── .env.example                  # 환경변수 예시 → .env 로 복사
├── Jenkinsfile                   # 테스트 → 빌드 → 이미지 검사 → push → 스테이징 배포 → smoke test
└── README.md
```

## 로컬 실행

```bash
cp .env.example .env
docker compose up --build -d
curl http://localhost:3000/health   # {"status":"ok","database":"connected"}
```

종료는 `docker compose down`. `down -v` 는 DB 볼륨까지 삭제한다.

## DB 마이그레이션

```bash
cd backend && npm run migrate:create -- create-users   # migrations/<timestamp>_create-users.sql 생성
docker compose run --rm api node src/db/migrate.js     # 적용 (운영 이미지에는 npm 이 없다)
```

운영 배포 시에는 `infra/scripts/deploy.sh` 가 API 교체 전에 자동으로 실행한다. 실패하면 API는 이전 버전 그대로 남는다.

## 테스트

```bash
cd backend && npm test                                 # 또는 docker build --target test ./backend
cd app && flutter analyze && flutter test   # Flutter 프로젝트 생성 후
```

## Flutter 프로젝트 생성

`app/` 에는 폴더 골격만 있다. Flutter SDK 설치 후 한 번 실행한다. MVP는 iOS만 만든다.

```bash
cd app && flutter create --org com.moo --project-name moo --platforms ios .
```

iOS 시뮬레이터에서 로컬 API 사용: `flutter run --dart-define=API_BASE_URL=http://localhost:3000`
