# 07. 개발 설계서

기획 문서(01~06, `screens/*.md`)와 2026-11-13 검토 결정(D32~)을 개발 관점으로 옮긴 문서다. **무엇을** 만드는지는 기획 문서, **어떻게** 만드는지는 이 문서가 기준이다.

- 기술 스택은 아직 미정이다(`open-questions.md`). 이 문서는 스택과 무관한 설계(데이터 모델, API 계약, 상태 전이, 연동 방식)만 다룬다. 테이블·필드·엔드포인트 이름은 제안이며, 스택 확정 시 관례에 맞게 바꿔도 된다(의미는 유지).
- 수치는 모두 설정값이다. 본문의 숫자는 기본값일 뿐 하드코딩하지 않는다(2절).
- `TODO`는 미결 사항 또는 카카오 확인 대기 항목이다.

---

## 0. 이번 설계에 반영된 결정 (D32~)

| # | 결정 | 영향 범위 |
|---|---|---|
| D32 | 사용자당 그룹 **5개** (만든 + 참여 합계). D02 대체 | 상수, 그룹 생성·참여 검증, Dialog 문구 |
| D33 | 그룹당 맛집 **100개**. 기존 500 대체 | 상수, 저장 검증, 탭 표기 `N/100`, Toast 문구 |
| D34 | 상한은 요금제별로 덮어쓸 수 있게 설계 (유료 BM 대비) | `plan_limits` (2절) |
| D35 | 카카오 좌표 저장 허용 여부 확인을 **개발 착수 선행 조건**으로 | 9절 |
| D36 | 폐업 맛집은 즉시 삭제 유지. 단 **좌표 기반 재조회가 가능해질 때까지 자동 삭제 비활성**(미확인 시 숨김만) | 기능 플래그 `place_auto_remove_enabled` |
| D37 | 그룹 맛집 개수(`N/100`)는 숨긴 맛집 포함, 서버 저장 수 기준 | 그룹 상세 |
| D38 | 맛집 상세 재조회 실패 → Toast ⚠️`맛집 정보를 불러오지 못했어요.` → 이전 화면 | 신규 메시지 `MOOHAPP_TOAST_PLACE_LOAD_FAIL` |
| D39 | 그룹 맛집 지도 `MOOHAPP_GROUP_MAP` 추가(`TODO`: 좌표 저장 허용 시에만). 불허 시 `[지도]` 아이콘 제거 | 화면 목록 |
| D40 | 초대 링크 공유는 **생성자만**. 멤버에게 `[공유]`·친구 초대 화면 미노출 | 권한 매트릭스 |
| D41 | 생성자가 친구 초대 화면을 열 때 링크가 만료돼 있으면 **자동 재발급**. 수동 `[재발급]`(유효 링크 강제 무효화)은 유지 | 초대 링크 API |
| D42 | 초대장의 초대자는 항상 **생성자** | 초대장 화면 |
| D43 | 대기 초대는 **링크에 종속**. 링크가 만료/무효되면 목록에서 자동 제외 | 대기 초대 조회 |
| D44 | `NOTI_INVITE_RECEIVED` 삭제. `invite_inbox_open` 경로에서 `notification` 제거 | 알림, 분석 |
| D45 | 지연 딥링크 미도입. Universal Link / App Link + 정적 랜딩 1장("설치 후 링크를 다시 눌러주세요") | 11절 |
| D46 | 정적 랜딩 페이지는 WEB 제외 범위의 예외 | 11절 |
| D47 | 생성자 탈퇴 시 만든 그룹 삭제(D13 유지) | 7.8절 |
| D50 | 배너·공지사항·FAQ는 원격 설정 JSON으로 관리(개발자가 수정). 어드민 없음 | 신규 화면 `MOOHAPP_NOTICE_LIST` / `MOOHAPP_NOTICE_DETAIL` / `MOOHAPP_FAQ` |
| D51~D54 | MVP: Android 제외, 하단 탭 3개, 약관 필수 3개, 앱 권한 요청 없음 | 화면 · 약관 범위 |
| D55 | 초대는 카카오톡 공유 + `iosExecutionParams`(토큰). 랜딩 · AASA · assetlinks 없음 (D45·D46 대체) | 1 · 8.4 · 11절 |
| D56 | 폐업 자동 삭제 시 멤버 알림함 `PLACE_AUTO_REMOVED` | 3.5 |
| D57 | 공지 = 블로그 링크, FAQ = 앱 화면(원격 JSON) | 12절 `notices` 미사용 |
| D61 | 탈퇴 시 Apple revoke + 카카오 · 네이버 · Google 연결 끊기 | 7.8 |
| D63 | 서버: Oracle Cloud Always Free(춘천/서울). `config.json` · 배너 이미지도 이 서버 도메인에서 제공 | 1절 |
| D66 | 내주변 · 위치 권한 · 위치기반서비스 약관 삭제 (MVP 이후 계획에서도 제외) | 약관 enum, 지도 검색 API, 7.3, 원격 설정 배너 타입 |

---

## 1. 시스템 구성

```text
┌──────────────────────┐        ┌──────────────────────────────────┐
│  MOOH 앱 (iOS/Android) │──HTTPS──▶  MOOH API 서버                      │
│  - 카카오맵 SDK(지도)   │        │  - 인증/세션, 그룹·초대·저장 로직    │
│  - 소셜 로그인 SDK      │        │  - 카카오 로컬 API 프록시(키 보관)   │
│  - 원격 설정 로더       │        │  - 폐업 확인 기록                    │
└───────┬──────────────┘        └──────┬──────────────┬────────────┘
        │ 지도 타일/마커                 │              │
        ▼                               ▼              ▼
   카카오맵 SDK 서버              카카오 로컬 API      DB / 오브젝트 스토리지
                                                       (커버·프로필 이미지)
┌──────────────────────────┐
│ API 서버 도메인 (Oracle)     │  원격 설정 JSON(config.json), 배너 이미지
│                            │  (초대 랜딩 · AASA · assetlinks 없음, D55)
└──────────────────────────┘
```

**카카오 로컬 API는 서버에서만 호출한다.**
- REST API 키를 앱에 넣지 않는다(키 유출·쿼터 탈취 방지).
- 폐업 확인 결과를 서버가 직접 기록해야 한다(클라이언트가 보고한 "미확인"을 믿으면 악의적 삭제가 가능).
- 저장 맛집 여부(`saved`) 표시를 서버가 응답에 합쳐 줄 수 있다.
- 서버는 카카오 응답을 **저장·캐싱하지 않고** 가공해 바로 반환한다(`04-external-api.md` 3절). 프로세스 메모리 내 요청 단위 재사용만 허용.

카카오맵 SDK(지도 표시)는 앱 네이티브 키로 앱에서 직접 사용한다.

---

## 2. 설정값과 요금제 상한

### 2.1. 서버 상수 (기본값)

| 키 | 기본값 | 비고 |
|---|---|---|
| `MAX_GROUPS_PER_USER` | 5 | 만든 + 참여 합계 (D32) |
| `MAX_PLACES_PER_GROUP` | 100 | D33 |
| `MAX_MEMBERS_PER_GROUP` | 20 | 생성자 포함 |
| `GROUP_NAME_MAX_LENGTH` / `GROUP_DESC_MAX_LENGTH` | 15 / 15 | 앞뒤 공백 제거 후, 문자(grapheme) 단위 |
| `INVITE_LINK_TTL_DAYS` | 3 | 활성화 시점부터 |
| `INVITE_DRAFT_TTL_HOURS` | 24 | 그룹 생성 화면 임시 토큰 정리 |
| `GROUP_PLACES_PAGE_SIZE` | 20 | 그룹 상세 페이지 = 카카오 재조회 단위 |
| `PLACE_MISSING_DELETE_THRESHOLD` | 2 | 서로 다른 날 연속 미확인 횟수 |
| `HOME_RECENT_GROUPS_MAX` / `HOME_RECENT_PLACES_MAX` / `HOME_FRIENDS_MAX` | 5 / 5 / 6 | |
| `SHARED_BADGE_MIN_MEMBERS` | 2 | |
| `RECENT_SEARCH_MAX` | 10 | 앱 로컬 |

### 2.2. 요금제별 덮어쓰기 (D34)

상한 3종(그룹 수, 그룹당 맛집 수, 그룹당 멤버 수)은 사용자 요금제로 결정한다. 지금은 `FREE` 하나뿐이다.

```text
plan_limits(plan_code PK, max_groups, max_places_per_group, max_members_per_group)
  FREE | 5 | 100 | 20
users.plan_code DEFAULT 'FREE'
```

- 그룹 수 상한: **해당 사용자**의 요금제 기준
- 그룹당 맛집·멤버 상한: **그룹 생성자**의 요금제 기준 (유료 생성자의 그룹이 커지는 모델)
- 앱은 하드코딩하지 않고 `GET /me` 응답의 `limits`와 그룹 응답의 `limits`를 사용한다.
- 다운그레이드 시 초과분 처리: `TODO` (유료 BM 결정 시. 기존 데이터는 유지하고 신규 추가만 막는 방식 권장)

### 2.3. 기능 플래그

| 플래그 | 기본 | 설명 |
|---|---|---|
| `place_auto_remove_enabled` | `false` | D36. 좌표 기반 재조회 가능 + 카카오 확인 완료 후 `true` |
| `place_coords_enabled` | `false` | 카카오가 좌표 저장을 허용하면 `true` (9절, D39) |

서버 설정으로 관리하고, 앱에 필요한 값(`place_coords_enabled` → 그룹 지도 아이콘 노출)은 `GET /app/bootstrap`으로 내려준다.

---

## 3. 데이터 모델

표기: `PK` 기본키, `FK` 외래키, `UQ` 유일 제약. 시각은 모두 UTC `timestamptz`.

### 3.1. 사용자 · 인증

```text
users
  id                PK
  nickname          NOT NULL
  profile_image_key NULL             -- 오브젝트 스토리지 키
  plan_code         FK plan_limits DEFAULT 'FREE'
  created_at, updated_at

social_accounts
  id PK
  user_id           FK users ON DELETE CASCADE
  provider          ENUM(KAKAO, NAVER, APPLE, GOOGLE)
  provider_user_id  NOT NULL
  apple_refresh_token NULL           -- 탈퇴 시 Apple 토큰 revoke 용 (암호화 저장)
  UQ(provider, provider_user_id)     -- 계정 병합 없음: provider별 1계정

user_agreements
  user_id FK, terms_code ENUM(AGE_14, SERVICE, PRIVACY), version, agreed_at
  PK(user_id, terms_code, version)

sessions / refresh_tokens            -- 스택 확정 시 결정. 로그아웃 = 해당 토큰 폐기
```

### 3.2. 그룹 · 멤버

```text
groups
  id PK
  owner_id          FK users
  name              VARCHAR  -- 1~15자
  description       VARCHAR  -- 1~15자
  cover_image_key   NULL     -- NULL이면 앱이 기본 이미지
  status            ENUM(ACTIVE, DELETED)
  delete_reason     ENUM(OWNER_DELETED, OWNER_WITHDRAWN) NULL
  member_count      INT      -- 비정규화, 멤버십 변경 트랜잭션에서 갱신
  place_count       INT      -- 비정규화, 그룹 맛집 변경 트랜잭션에서 갱신
  created_at, updated_at, deleted_at
  INDEX(owner_id, status)

group_members
  id PK
  group_id FK, user_id FK
  role     ENUM(OWNER, MEMBER)
  status   ENUM(ACTIVE, LEFT, REMOVED)
  joined_at, ended_at
  UQ(group_id, user_id)              -- 재참여 시 같은 행을 ACTIVE로 되살림
  INDEX(user_id, status)
```

- `groups.updated_at`("최근 수정순" 기준)은 그룹 정보 수정, 맛집 추가·삭제, 멤버 참여·이탈 시 갱신한다.
- **삭제된 그룹은 행을 남긴다**(`status=DELETED`). 예전 링크·카드 접근 시 "삭제된 그룹이에요." 판별에 필요하다. 이름·설명·커버는 삭제 시점에 비운다(알림 문구용 그룹명은 알림 행에 스냅샷 저장).
- 사용자의 그룹 수 = `group_members WHERE user_id=? AND status='ACTIVE'` 건수 (OWNER 포함, 삭제된 그룹의 멤버십은 삭제 시 `REMOVED` 처리되므로 자동 제외).

### 3.3. 그룹 맛집

```text
group_places
  id PK
  group_id          FK groups
  kakao_place_id    VARCHAR NOT NULL
  place_name        VARCHAR NOT NULL  -- 사용자가 저장 시점에 확인한 이름
  place_url         VARCHAR NULL      -- 없으면 id로 생성
  x, y              DECIMAL NULL      -- TODO: place_coords_enabled 전까지 항상 NULL (D35)
  added_by          FK users NULL     -- 탈퇴 시 NULL
  status            ENUM(ACTIVE, MISSING_1)
  last_checked_on   DATE NULL         -- 미확인 카운트용, 하루 1회 (KST 기준 날짜)
  created_at
  UQ(group_id, kakao_place_id)
  INDEX(group_id, created_at DESC)
  INDEX(kakao_place_id)
```

- 저장 금지 필드(주소, 전화, 카테고리, 응답 원문)는 컬럼 자체를 만들지 않는다.
- 삭제(사용자 삭제·자동 삭제)는 **행 삭제**(D14/Q3 "즉시 삭제"). 분석용으로는 이벤트만 남긴다.

### 3.4. 초대

```text
invite_links
  id PK
  group_id   FK groups NULL           -- DRAFT 동안 NULL
  token      CHAR(22) UQ              -- 128bit 난수, base62. 추측 불가
  created_by FK users
  status     ENUM(DRAFT, ACTIVE, EXPIRED, DISABLED, GROUP_DELETED)
  activated_at NULL, expires_at NULL  -- expires_at = activated_at + TTL
  created_at
  INDEX(group_id, status)

pending_invites
  id PK
  user_id        FK users
  group_id       FK groups
  invite_link_id FK invite_links      -- D43: 링크 종속
  status         ENUM(PENDING, JOINED, REJECTED)
  created_at, updated_at
  UQ(user_id, group_id)               -- 같은 그룹 재진입 시 link_id 갱신 + PENDING 복귀
```

- 기획 문서의 링크 상태 `PENDING`은 대기 초대 상태와 이름이 겹쳐 **`DRAFT`로 바꿔 부른다**(의미 동일).
- 그룹당 `ACTIVE` 링크는 최대 1개.
- 만료는 배치로 상태를 바꾸지 않아도 되게 **`expires_at < now()`를 만료로 판정**한다. 표시용 상태 정리는 주기 배치로 한다.
- 초대장 목록 = `pending_invites(PENDING)` ⋈ `invite_links(ACTIVE, 미만료)` ⋈ `groups(ACTIVE)`. 하나라도 어긋나면 자동 제외(D43, 8.2).

### 3.5. 알림

```text
notifications
  id PK
  user_id   FK users ON DELETE CASCADE
  type      ENUM(GROUP_DELETED, MEMBER_REMOVED, PLACE_AUTO_REMOVED)   -- D44: INVITE_RECEIVED 없음, D56: 폐업 삭제
  reason    ENUM(OWNER_DELETED, OWNER_WITHDRAWN) NULL
  group_id  FK groups
  group_name_snapshot VARCHAR       -- 그룹 삭제 후에도 문구 표시
  status    ENUM(UNREAD, READ)
  created_at
  INDEX(user_id, created_at DESC)
```

- 보관 기간·최대 개수: `TODO` (`open-questions.md`). 결정되면 정리 배치 추가.
- 폐업 자동 삭제 알림(D56): `type=PLACE_AUTO_REMOVED`, 그룹명 · 상호명은 스냅샷으로 저장(`group_name_snapshot` + `place_name_snapshot` 추가). 그 그룹의 현재 멤버 전원에게 생성

### 3.6. 앱 로컬 저장소 (서버 저장 안 함)

| 항목 | 이유 |
|---|---|
| 온보딩 완료 여부 | 기기 단위 (`screens/auth.md`) |
| 최근 검색어 10개 | 기기 단위, 서버 불필요 |
| 세션 토큰 | 보안 저장소(Keychain / Keystore) |
| 비밀 초대장에서 로그인 중인 초대 토큰 | 로그인 완료 후 자동 참여용 (7.5) |

---

## 4. 상태 전이

```text
그룹          ACTIVE ──(생성자 삭제 / 생성자 탈퇴)──▶ DELETED
멤버십        (참여) ─▶ ACTIVE ──(나가기)──▶ LEFT
                          └──(내보내기 / 그룹 삭제)──▶ REMOVED
              LEFT·REMOVED ──(새 링크로 재참여)──▶ ACTIVE
초대 링크      DRAFT ──(그룹 생성 완료)──▶ ACTIVE ──(expires_at 경과)──▶ EXPIRED
              DRAFT ──(24h 경과, 정리 배치)──▶ 삭제
              ACTIVE ──(수동 재발급)──▶ DISABLED
              ACTIVE·EXPIRED ──(그룹 삭제)──▶ GROUP_DELETED
              EXPIRED ──(생성자가 초대 화면 진입: 자동 재발급, D41)──▶ (새 링크 ACTIVE)
대기 초대      PENDING ──(참여)──▶ JOINED
              PENDING ──(휴지통)──▶ REJECTED
              PENDING ──(같은 그룹 링크로 재진입)──▶ PENDING (link_id 갱신)
              REJECTED·JOINED ──(재진입, 비멤버인 경우)──▶ PENDING
그룹 맛집      ACTIVE ──(미확인, 플래그 on)──▶ MISSING_1 ──(다른 날 또 미확인)──▶ 삭제
              MISSING_1 ──(확인됨)──▶ ACTIVE
알림          UNREAD ──(알림함 진입)──▶ READ
```

---

## 5. API 설계

공통:
- 인증: `Authorization: Bearer <access token>`. 표시 없는 엔드포인트는 모두 인증 필요.
- 오류 응답: `{ "code": "GROUP_LIMIT_EXCEEDED", "message": "...", "details": {} }`. 앱은 `code`로 메시지 ID를 매핑한다(10절). 서버 `message`는 디버그용이며 화면에 노출하지 않는다.
- 변경 요청은 `Idempotency-Key` 헤더를 받는다(CTA 중복 터치·재시도 대비).
- 목록은 커서 페이지네이션(`?cursor=&size=`).

### 5.1. 앱 · 인증 · 사용자

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/app/bootstrap` (비인증) | 최소 지원 버전, 기능 플래그, 원격 설정 URL |
| POST | `/auth/social` (비인증) | `{provider, token}` → `{accessToken, refreshToken, isNewUser}`. 신규면 약관 전까지 `signupPending` 상태 |
| POST | `/auth/signup` | 약관 동의 `{agreements:[AGE_14, SERVICE, PRIVACY]}` → 가입 확정. 필수 3개 누락 시 400 |
| POST | `/auth/refresh` (비인증) | 토큰 갱신. 실패 → 앱은 세션 만료 Dialog |
| POST | `/auth/logout` | refresh 토큰 폐기 |
| GET | `/me` | 프로필, `limits`, 그룹 수, 대기 초대 수, 안 읽은 알림 수 |
| PATCH | `/me` | 닉네임·프로필 이미지 키 |
| GET | `/me/withdraw-preview` | 삭제될 내 그룹 수 `{ownedGroupCount}` (탈퇴 Dialog `{n}`) |
| DELETE | `/me` | 회원 탈퇴 (7.8) |
| POST | `/uploads` | 이미지 업로드용 서명 URL 발급 `{purpose: COVER|PROFILE}` |

### 5.2. 홈

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/home/recent-groups` | 최근 수정순 5개 |
| GET | `/home/recent-places` | 내 그룹 맛집 최근 저장순, 장소 ID 기준 중복 제거 5개 + 카카오 재조회 결과 + 저장된 그룹 태그 |
| GET | `/home/friends` | 7.10 |
| GET | `/friends/{userId}/shared-groups` | 함께 참여 중인 그룹 바텀시트 |

섹션별 독립 호출(홈 섹션 독립 로딩·스켈레톤).

### 5.3. 검색 · 맛집 (카카오 프록시)

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/search/places?query=&page=` | 키워드 검색. 공백만 → 400 (앱에서 먼저 차단). 응답에 `saved` 플래그 |
| GET | `/places/{kakaoPlaceId}?name=&x=&y=` | 맛집 상세 재조회. 저장된 맛집이면 서버가 이름·좌표를 DB에서 채움. 못 찾으면 `404 PLACE_NOT_FOUND` → D38 Toast |
| GET | `/places/{kakaoPlaceId}/my-groups` | 이 맛집이 저장된 내 그룹 ID 목록 (그룹 선택 BS 초기 체크) |

- 검색 결과에서 상세로 갈 때는 앱이 이미 가진 결과 객체를 화면 인자로 넘겨 **추가 호출 없이** 표시한다(메모리 전달만, 디스크 저장 금지). 저장된 맛집(홈·그룹)에서 진입할 때만 `/places/{id}`를 호출한다.
- `saved` 판정: 응답의 각 `id`가 내 ACTIVE 그룹들의 `group_places.kakao_place_id`에 있는지 서버가 확인. 검색 결과 · 상세의 저장 상태 표시에 사용.

### 5.4. 저장 (그룹 선택 바텀시트)

| 메서드 | 경로 | 설명 |
|---|---|---|
| PUT | `/places/{kakaoPlaceId}/groups` | `{groupIds:[...], placeName, placeUrl}` → 원하는 최종 상태. 서버가 현재 상태와 비교해 그룹별 추가/삭제 수행 |

응답:

```json
{
  "results": [
    { "groupId": 1, "action": "ADDED",   "ok": true },
    { "groupId": 2, "action": "REMOVED", "ok": true },
    { "groupId": 3, "action": "ADDED",   "ok": false, "code": "GROUP_PLACE_LIMIT_EXCEEDED" }
  ],
  "savedGroupIds": [1]
}
```

- 그룹별 독립 트랜잭션(부분 실패 허용, `02-policies.md` 12절). 앱은 실패한 그룹만 재시도.
- 추가 시 이미 있으면 `ok:true, action:"NONE"`(동시 추가 시 첫 요청 유지, 11절).
- 결과에 따라 앱 Toast: 추가 성공 → 저장 성공, 최종 0개 → 저장 해제, 실패 포함 → 해당 오류.

### 5.5. 그룹

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/groups?sort=RECENT\|NAME\|MEMBERS\|PLACES` | 본인 | 그룹 홈 |
| POST | `/invite-links/draft` | 로그인 | 그룹 생성 화면 진입 시 DRAFT 토큰 발급 (그룹 수 상한 도달 시 409) |
| POST | `/groups` | 로그인 | `{name, description, coverImageKey?, draftToken}` → 그룹 + OWNER 멤버십 + 링크 ACTIVE 확정 |
| GET | `/groups/{id}` | 멤버 | 헤더·탭 카운트(`placeCount`, `memberCount`, `limits`), 내 역할 |
| PATCH | `/groups/{id}` | 생성자 | 이름·설명·커버 |
| DELETE | `/groups/{id}` | 생성자 | 7.7 |
| POST | `/groups/{id}/leave` | 멤버(OWNER 제외) | 나가기 |
| GET | `/groups/{id}/places?cursor=` | 멤버 | 20개씩 + 카카오 재조회 결과 병합 (7.6) |
| POST | `/groups/{id}/places` | 멤버 | 그룹 상세 `[맛집 추가]` 단건 추가 |
| DELETE | `/groups/{id}/places/{kakaoPlaceId}` | 멤버 | 삭제. 이미 없으면 204 |
| GET | `/groups/{id}/members` | 멤버 | 생성자 먼저, 이후 참여순 |
| DELETE | `/groups/{id}/members/{userId}` | 생성자 | 내보내기 (본인 불가). 이미 나간 대상이면 204 |
| GET | `/groups/{id}/map-places` | 멤버 | `TODO` `place_coords_enabled` 시에만 (D39). 저장 좌표로 마커 |

### 5.6. 초대

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/groups/{id}/invite-link` | **생성자** (D40) | 현재 링크. 만료면 자동 재발급 후 반환 (D41) |
| POST | `/groups/{id}/invite-link/reissue` | 생성자 | 기존 ACTIVE → DISABLED, 새 링크 발급 |
| GET | `/invites/{token}/resolve` (비인증 허용) | - | 링크 진입 판정 (7.4). 로그인 상태면 대기 초대 등록까지 수행 |
| GET | `/invites/{token}/preview` (비인증) | - | 비밀 초대장: 그룹 요약 + 멤버 목록(닉네임·프로필·역할) |
| GET | `/me/invites` | 로그인 | 초대장 목록 (D43 필터 적용). 초대자 = 생성자 (D42) |
| POST | `/me/invites/join` | 로그인 | `{groupIds:[...]}` 다중 참여, 그룹별 결과 반환 (7.5) |
| POST | `/invites/{token}/join` | 로그인 | 비밀 초대장 경유 단건 참여 (로그인 직후 자동 호출) |
| POST | `/me/invites/reject` | 로그인 | `{groupIds:[...]}` 거절(휴지통) |

- 비인증 엔드포인트는 IP 단위 rate limit을 건다(토큰 추측 시도 차단). 토큰이 128bit라 열거 공격은 비현실적이지만 로그·차단은 둔다.
- 비밀 초대장은 비로그인에게 멤버 닉네임·프로필을 공개한다(D31). 이메일·provider 등 다른 개인정보는 응답에 넣지 않는다.

### 5.7. 알림 · 원격 콘텐츠

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/me/notifications?cursor=` | 최신순 |
| POST | `/me/notifications/read-all` | 알림함 진입 시 전부 읽음 |

공지사항·FAQ·배너는 API가 아니라 원격 설정 JSON(12절)에서 읽는다.

---

## 6. 권한 매트릭스 (구현 기준, D40 반영)

| 기능 | 생성자 | 멤버 | 비멤버 | 서버 검증 |
|---|---|---|---|---|
| 그룹 상세·맛집·멤버 조회 | ✅ | ✅ | ❌ | 멤버십 ACTIVE |
| 그룹 정보 수정 | ✅ | ❌ | ❌ | role=OWNER |
| 맛집 추가·삭제 | ✅ | ✅ | ❌ | 멤버십 ACTIVE |
| 초대 링크 조회·공유 | ✅ | ❌ | ❌ | role=OWNER |
| 초대 링크 재발급 | ✅ | ❌ | ❌ | role=OWNER |
| 멤버 내보내기 | ✅ | ❌ | - | role=OWNER, 대상≠본인 |
| 그룹 나가기 | ❌ | ✅ | - | role=MEMBER |
| 그룹 삭제 | ✅ | ❌ | ❌ | role=OWNER |
| 초대 참여 | - | - | ✅ | 7.5 검증 |

모든 권한은 **서버에서 매 요청 검증**한다. 앱은 UI 노출 제어만 한다: 멤버에게는 그룹 상세 헤더 `[공유]` 숨김, 그룹 상세 설정 메뉴는 `그룹 나가기`만.

비멤버(내보내짐 포함)가 그룹 API 호출 → `403 GROUP_FORBIDDEN`. 그룹 `DELETED` → `410 GROUP_DELETED` (403보다 우선).

---

## 7. 핵심 로직

### 7.1. 상한 검증과 동시성

상한 검증은 **잠금 + 재계산**으로 한다(비정규화 카운트만 믿지 않음).

| 동작 | 잠금 대상 | 검증 |
|---|---|---|
| 그룹 생성 | `users` 행 (본인) | 내 ACTIVE 멤버십 수 < `max_groups` |
| 그룹 참여 | `users` 행(본인) → `groups` 행 순서 | 내 그룹 수 < 상한, 그룹 `member_count` < 상한, 그룹·링크 상태 |
| 맛집 추가 | `groups` 행 | `place_count` < 상한, `UQ(group_id, kakao_place_id)` |

- 잠금 순서를 항상 `users → groups`로 고정해 교착을 막는다.
- 맛집 중복은 유일 제약 위반을 잡아 `NONE` 처리한다.

### 7.2. 회원가입 · 로그인

1. 앱이 provider SDK로 토큰 획득 → `POST /auth/social`
2. 서버가 provider 토큰 검증 → `social_accounts`로 사용자 조회
3. 없으면 `signupPending` 사용자 생성, `isNewUser=true` → 앱은 약관 화면
4. `POST /auth/signup`: 필수 약관(`AGE_14`, `SERVICE`, `PRIVACY`) 확인
5. 약관 화면 `[X]`: 가입 중단. `signupPending` 사용자는 24시간 후 정리 배치로 삭제

Apple 로그인은 `authorization_code`로 refresh token을 받아 암호화 저장한다(탈퇴 시 revoke 필수, 앱스토어 심사).

### 7.3. (삭제 — D66, 위치 사후 동의 없음)

### 7.4. 초대 링크 진입 판정 (`/invites/{token}/resolve`)

판정 순서(`screens/invite.md` 1절 + 결정 반영):

| 순서 | 조건 | 응답 `result` | 앱 처리 |
|---|---|---|---|
| 1 | 토큰 없음 / `GROUP_DELETED` 또는 그룹 DELETED | `GROUP_DELETED` | Toast, 현재 화면 유지(첫 진입이면 홈, 비로그인은 온보딩/로그인) |
| 2 | `EXPIRED` 또는 `expires_at` 경과 | `EXPIRED` | 만료 Dialog → 홈 (비로그인 온보딩/로그인) |
| 3 | `DISABLED` | `DISABLED` | 무효 Dialog → 동일 |
| 4 | 로그인 + 이미 멤버/생성자 | `ALREADY_MEMBER` | 그룹 상세 |
| 5 | 로그인 + 유효 | `INBOX` | 대기 초대 upsert(link_id 갱신) → 초대장(이 그룹 기본 체크) |
| 6 | 비로그인 + 유효 | `PREVIEW` | 비밀 초대장 |

- 그룹 삭제 판정을 만료보다 먼저 한다(삭제된 그룹의 만료 링크는 "삭제된 그룹"으로 안내, `02-policies.md` 8.2).
- 정원·내 그룹 수는 여기서 검증하지 않는다(참여 확정 시점).

### 7.5. 참여 확정

`POST /me/invites/join` (다중) — 그룹마다 독립 트랜잭션, 7.1 잠금 후 재검증:

1. 그룹 ACTIVE? 아니면 `GROUP_DELETED`
2. 대기 초대의 링크가 ACTIVE·미만료? 아니면 `INVITE_EXPIRED` / `INVITE_DISABLED`
3. 이미 멤버? → 성공 처리(멱등)
4. 정원 → `GROUP_MEMBER_LIMIT_EXCEEDED`
5. 내 그룹 수 → `GROUP_LIMIT_EXCEEDED` (요청 순서대로 처리, 상한 도달 이후 그룹은 전부 이 코드)
6. 멤버십 ACTIVE(재참여면 행 복구), `member_count++`, `groups.updated_at` 갱신, 대기 초대 `JOINED`

응답 후 이동: 1개 성공 → 그 그룹 상세, 2개 이상 → 그룹 홈 (⚠️ 기획 확인 필요 항목, 현재 안 그대로).

비밀 초대장 경로(`POST /invites/{token}/join`): 앱이 로그인 시작 전에 토큰을 로컬에 보관 → 로그인(신규면 약관까지) 완료 직후 자동 호출 → 성공 시 그룹 상세, 실패 시 해당 Dialog → 홈. 로그인 취소 시 토큰 폐기. 대기 초대 행을 거치지 않고 위 1~6 검증만 수행한다.

### 7.6. 그룹 상세 맛집 목록과 폐업 확인

`GET /groups/{id}/places?cursor=`:

1. `group_places`에서 최신순 20개 로드
2. 각 맛집 카카오 재조회(서버 병렬, 동시 요청 수 제한·타임아웃)
   - 좌표 있음(`place_coords_enabled`): `place_name` + `x,y` + 작은 `radius`로 키워드 검색 → 같은 `id` 탐색
   - 좌표 없음: `place_name`으로 키워드 검색 → 최대 45개(3페이지)에서 같은 `id` 탐색
3. 찾으면 실시간 정보(카테고리·주소·전화) 병합해 응답, 상태가 `MISSING_1`이면 `ACTIVE`로 복구
4. 못 찾으면 응답에서 **제외**(숨김)
   - `place_auto_remove_enabled=false`(현재): 상태 변경 없음 (D36)
   - `true`: `last_checked_on`이 오늘이 아니면 → `ACTIVE`는 `MISSING_1`, `MISSING_1`이면 행 삭제 + `place_count--` + 분석 이벤트 `group_place_auto_removed`
5. 카카오 호출 자체가 실패(타임아웃·429·5xx)한 항목은 **미확인으로 세지 않는다**. 응답에 `{ unavailable: true }`로 이름만 표시
6. 응답 헤더 정보의 `placeCount`는 숨김 포함 DB 값 (D37)

한 화면 진입 = 카카오 최대 20~60회 호출이다(좌표 없으면 3페이지까지). 쿼터 계산(`open-questions.md`) 시 이 값을 사용한다.

### 7.7. 그룹 삭제 (생성자 직접 삭제)

한 트랜잭션:

1. 권한·상태 재검증 (OWNER, ACTIVE)
2. `groups.status=DELETED, delete_reason=OWNER_DELETED, deleted_at`, 이름·설명·커버 키 보관 후 비움
3. 모든 ACTIVE 멤버십 → `REMOVED` (생성자 포함)
4. 링크 → `GROUP_DELETED`, 대기 초대는 조회 조건으로 자동 제외(행 유지 또는 삭제 무관)
5. `group_places` 행 삭제
6. 생성자 제외 멤버 전원에게 `notifications(GROUP_DELETED, OWNER_DELETED, group_name_snapshot)`
7. 커밋 후 커버 이미지 비동기 삭제

### 7.8. 회원 탈퇴

1. 내가 만든 ACTIVE 그룹마다 7.7 수행(`reason=OWNER_WITHDRAWN`) (D47)
2. 참여 중인 그룹 멤버십 → `LEFT`, 해당 그룹 `member_count--`
3. `group_places.added_by` → NULL (다른 멤버의 그룹 데이터는 유지)
4. Apple 계정이면 토큰 revoke, 각 provider 연결 해제(가능한 provider만)
5. 개인 데이터 파기: `users`(닉네임·프로필), `social_accounts`, `user_agreements`, `pending_invites`, `notifications`, 세션 전부 삭제. 프로필 이미지 비동기 삭제
6. `group_members`에는 탈퇴자 행이 남지 않도록 삭제(개인 식별 가능 데이터 최소화)
7. 복구 불가. 법령상 보관 의무 데이터가 생기면(유료화 시 결제 기록 등) 별도 분리 보관 `TODO`

### 7.9. 링크 자동 재발급 (D41)

`GET /groups/{id}/invite-link`(생성자 전용):
- ACTIVE·미만료 → 그대로 반환
- 만료 → 기존 링크 `EXPIRED` 확정, 새 `ACTIVE` 링크 발급(`activated_at=now`) 후 반환
- 수동 `[재발급]`은 `reissue` 엔드포인트만. 확인 Dialog는 앱에서

### 7.10. 함께하는 친구

```text
내 ACTIVE 그룹들의 ACTIVE 멤버 중 나를 제외한 사용자, 중복 제거
정렬: 함께하는 그룹들의 max(groups.updated_at) DESC   -- "최근 공동 활동순"의 구현 정의
표시: 닉네임, 프로필, 함께 참여 중인 그룹 수
```

친구 초대하기(앱 추천) 가입자는 무관하다.

### 7.11. 배치 작업

| 작업 | 주기 | 내용 |
|---|---|---|
| DRAFT 링크 정리 | 1시간 | 생성 후 24시간 지난 DRAFT 삭제 |
| 링크 만료 상태 정리 | 1일 | `expires_at` 경과 ACTIVE → EXPIRED (판정은 시각 기준이라 표시용) |
| 가입 미완료 사용자 정리 | 1일 | `signupPending` 24시간 경과 삭제 |
| 알림 정리 | `TODO` | 보관 기간 결정 후 |

---

## 8. 앱 클라이언트 설계

### 8.1. 화면 목록 변경분

| 화면 ID | 변경 |
|---|---|
| `MOOHAPP_GROUP_MAP` | 추가, `TODO` `place_coords_enabled` 시에만. 아니면 그룹 상세 `[지도]` 아이콘 미노출 (D39) |
| `MOOHAPP_NOTICE_LIST` / `MOOHAPP_NOTICE_DETAIL` | 추가. 마이 > 공지사항 (D50) |
| `MOOHAPP_FAQ` | 추가. 마이 > FAQ, 질문 목록 + 아코디언 (D50) |
| `MOOHAPP_GROUP_INVITE` | 생성자 전용으로 변경 (D40) |

### 8.2. 데이터 갱신 규칙

- 서버 데이터는 화면 진입·포그라운드 복귀·변경 완료 시 재조회(`02-policies.md` 11절).
- 카카오 유래 데이터(주소·전화·카테고리·검색 결과)는 **화면 메모리에만** 보관한다. 디스크 캐시·HTTP 캐시 금지(응답에 `Cache-Control: no-store`).
- 뒤로가기 복원(검색어·결과·스크롤·지도 중심·줌)은 화면 상태 보존으로 처리하고 재호출하지 않는다.
- 낙관적 업데이트는 쓰지 않는다. 변경은 서버 응답 후 반영(실패 시 이전 상태 유지 정책과 일치).

### 8.3. 상한 표시

탭 표기 `맛집 N/{max}` · `멤버 N/{max}`, FAB·CTA 비활성 판단은 모두 서버가 준 `limits`로 한다. 문구의 숫자도 `{max}` 변수로 치환한다(요금제 대비).

> **D55 (2026-11-19)**: 아래 8.4의 Universal Link · 랜딩 방식은 **쓰지 않는다.** 카카오톡 공유 메시지 버튼 → `kakao{네이티브앱키}://kakaolink?token=...` 로 앱 실행 → resolve(7.4). 앱 미설치 시 카카오가 App Store로 보낸다. 카카오 콘솔에서 카카오톡 공유 사용 설정 · iOS `LSApplicationQueriesSchemes`에 `kakaolink` 필요.

### 8.4. 딥링크 라우팅

```text
https://mooh.app/invite/{token}
  ├─ 앱 설치됨 → Universal Link / App Link로 앱 실행 → resolve (7.4)
  └─ 미설치 → 랜딩 페이지 (11절)
앱 실행 중 링크 수신 → 현재 화면 위에서 resolve (실패 Toast는 현재 화면 유지)
```

---

## 9. 카카오 연동 선행 작업 (D35)

개발 착수 전에 끝낸다.

| 항목 | 결과에 따른 분기 |
|---|---|
| 데브톡: 장소 ID·장소명 저장, 그룹 상세 재조회 구조 허용 여부 | 불허 시 저장 구조 재설계 → 사용자 확인 |
| 데브톡: **사용자가 저장한 맛집의 좌표 저장** 허용 여부 | 허용 → `place_coords_enabled=true`, `GROUP_MAP` 구현, 이후 `place_auto_remove_enabled` 검토. 불허 → `[지도]` 아이콘 제거, 자동 삭제 계속 off(D36 재논의) |
| 무료 쿼터 vs 예상 호출량 | 7.6 호출 수 기준. 초과 예상 시 페이지 크기 축소·재조회 범위 조정 검토 |

카카오 API 응답 처리 공통:
- `road_address_name` 비어 있으면 `address_name`
- 429 → 지수 백오프 1회 재시도 후 `KAKAO_UNAVAILABLE` (앱: 기존 데이터 유지 + 재시도)
- 크롤링 금지, `place_url`은 앱/웹 열기 용도로만

---

## 10. 오류 코드 ↔ 메시지 매핑

| HTTP | 코드 | 앱 메시지 ID |
|---|---|---|
| 400 | `VALIDATION_FAILED` | (필드 인라인 안내) |
| 401 | `SESSION_EXPIRED` | `MOOHAPP_DIALOG_SESSION_EXPIRED` |
| 403 | `GROUP_FORBIDDEN` | `MOOHAPP_DIALOG_GROUP_FORBIDDEN` |
| 404 | `PLACE_NOT_FOUND` | `MOOHAPP_TOAST_PLACE_LOAD_FAIL` ⚠️ (신규, D38) |
| 409 | `GROUP_LIMIT_EXCEEDED` | `MOOHAPP_DIALOG_GROUP_LIMIT` (문구 `{max}`개) |
| 409 | `GROUP_MEMBER_LIMIT_EXCEEDED` | `MOOHAPP_DIALOG_GROUP_MEMBER_LIMIT` |
| 409 | `GROUP_PLACE_LIMIT_EXCEEDED` | `MOOHAPP_TOAST_GROUP_PLACE_LIMIT` (문구 `{max}`개) |
| 409 | `PLACE_DUPLICATED` | `MOOHAPP_TOAST_PLACE_DUPLICATED` |
| 410 | `GROUP_DELETED` | `MOOHAPP_TOAST_GROUP_DELETED` |
| 410 | `INVITE_EXPIRED` | `MOOHAPP_DIALOG_INVITE_EXPIRED` |
| 410 | `INVITE_DISABLED` | `MOOHAPP_DIALOG_INVITE_DISABLED` |
| 502/503 | `KAKAO_UNAVAILABLE` | `MOOHAPP_TOAST_MAP_LOAD_FAIL` 또는 화면별 실패 처리 |
| - | (네트워크 실패) | `MOOHAPP_TOAST_NETWORK_ERROR` |

`05-messages.md` 수정 필요: 그룹 수 Dialog·맛집 수 Toast 문구를 `{max}` 변수로, `MOOHAPP_TOAST_PLACE_LOAD_FAIL` 추가, `NOTI_INVITE_RECEIVED` 삭제.

---

> **D55 (2026-11-19)로 이 절은 사용하지 않는다.** 원격 설정 JSON(`/config.json`)만 API 서버 도메인에서 제공한다.

## 11. 초대 랜딩 페이지 (D45, D46)

`mooh.app` 정적 호스팅. 범위는 아래뿐이다.

| 경로 | 내용 |
|---|---|
| `/invite/{token}` | MOOH 로고·캐릭터, "MOOH 앱에서 초대를 확인하세요", App Store / Play Store 버튼, **"설치 후 이 링크를 다시 눌러주세요"** 안내. 그룹 정보는 표시하지 않음(서버 호출 없음) |
| `/.well-known/apple-app-site-association` | iOS Universal Link, `/invite/*` |
| `/.well-known/assetlinks.json` | Android App Link |
| `/config.json` | 원격 설정 (12절) |

- 랜딩 문구는 ⚠️초안.
- 앱 설치된 사용자는 OS가 링크를 앱으로 바로 열기 때문에 이 페이지를 보지 않는다.

---

## 12. 원격 설정 JSON (D50)

개발자가 직접 수정해 배포한다. 앱은 실행 시 1회 + 포그라운드 복귀 시 로드하고, 실패하면 마지막 성공본(로컬 저장) 또는 빈 상태로 표시한다. 자체 콘텐츠라 로컬 캐시해도 된다.

```json
{
  "version": 3,
  "banners": [
    {
      "id": "b-2026-11-01",
      "type": "PLACE",
      "label": "이번 주 추천",
      "title": "을지로 노포 투어",
      "subtitle": "오래된 맛집 모음",
      "imageUrl": "https://mooh.app/assets/banner1.png",
      "target": { "kakaoPlaceId": "12345", "placeName": "..." },
      "startAt": "2026-11-01T00:00:00+09:00",
      "endAt": "2026-11-30T23:59:59+09:00"
    },
    { "id": "b2", "type": "LINK", "title": "...", "target": { "url": "https://blog.naver.com/..." } }
  ],
  "notices": [
    { "id": "n1", "title": "MOOH 출시 안내", "body": "본문(마크다운)", "publishedAt": "2026-11-20T10:00:00+09:00", "pinned": true }
  ],
  "faq": [
    { "id": "f1", "category": "그룹", "question": "그룹은 몇 개까지 만들 수 있나요?", "answer": "..." }
  ]
}
```

- 배너는 기간 밖이거나 `target`이 비어 있으면 노출하지 않는다.
- 공지 정렬: `pinned` 먼저, 이후 `publishedAt` 내림차순. 상세는 `body` 마크다운 렌더링.
- 스키마가 바뀌면 `version`을 올리고, 앱은 모르는 필드·타입을 무시한다.

---

## 13. 분석 이벤트 변경분

- `invite_inbox_open`의 진입 경로: `link` / `my` (D44, `notification` 제거)
- 추가: `notice_view`, `faq_view`
- `group_place_auto_removed`: 플래그 on 이후에만 발생
- 분석 도구: `TODO` (스택 확정 시)

---

## 14. 보안 · 개인정보 체크리스트

- [ ] 카카오 REST 키·소셜 시크릿은 서버에만. 앱에는 카카오맵 네이티브 키·provider 클라이언트 ID만
- [ ] 초대 토큰 128bit 난수, 비인증 엔드포인트 rate limit
- [ ] 비밀 초대장 응답은 닉네임·프로필·역할만
- [ ] 이미지 업로드는 서명 URL + 크기·형식 제한
- [ ] 탈퇴 시 개인 데이터 즉시 파기, Apple 토큰 revoke, 카카오 · 네이버 · Google 연결 끊기 (D61)
- [ ] 카카오 유래 데이터 `no-store`, 로그에 응답 원문 남기지 않기

---

## 15. 남은 TODO (이 문서 기준)

| 항목 | 막히는 부분 |
|---|---|
| 기술 스택 | 전체 구현 |
| 카카오 데브톡 회신 (좌표 저장 등) | 7.6 재조회 방식, `GROUP_MAP`, 자동 삭제 |
| 카카오 쿼터 계산 | 7.6 페이지 크기 |
| 알림 보관 기간·개수 | 7.11 알림 정리 |
| ~~폐업 자동 삭제 알림 여부~~ | D56으로 해소 |
| 다중 참여 후 이동 위치 | 7.5 |
| 요금제 다운그레이드 처리 | 2.2 |
| 분석 도구 | 13절 |
