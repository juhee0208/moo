# 01. 서비스 개요

## 1. 서비스 정의

MOOH는 사용자가 맛집을 검색해 저장한 뒤, 목적에 따라 그룹으로 관리하고 초대한 친구와 함께 편집하는 맛집 지도 앱이다.

- **배경**: 맛집 정보는 검색·지도·SNS에 흩어져 있어, 다시 가고 싶은 곳을 정리하거나 친구와 같이 관리하기 어렵다.
- **가설**: 맛집을 발견한 직후 1~2단계 안에 그룹에 저장할 수 있고, 친구와 같은 목록을 편집할 수 있으면 저장·재방문 행동이 늘어난다.
- **타겟**: 맛집을 자주 찾고 저장하며, 친구·연인·가족과 방문 후보를 공유하는 개인 사용자.

## 2. 핵심 경험

`맛집 검색 → 그룹에 저장 → 카카오톡으로 초대 → 멤버와 공동 관리`

## 3. 서비스 범위

- **플랫폼**: MVP는 **iOS App Store만** (D52). Android Play Store는 MVP 이후
- **제외**: WEB 서비스(초대 랜딩 없음 — 카카오톡 공유, D55), 운영자 어드민(배너·FAQ는 원격 설정, 공지는 블로그 — D50·D57), 리뷰·별점, 댓글·피드, 친구 요청/수락, 주문·예약, 그룹 채팅, 공개 그룹, 실시간 위치 공유, **푸시 알림**
- **가입**: 자체 회원가입 없음. 소셜 로그인 전용 (카카오 / 네이버 / Apple / Google)
- **로그인 필수**: 앱 이용은 로그인 후 가능. 예외는 초대 링크로 들어온 경우의 `비밀 초대장` 열람뿐 (`screens/invite.md`)
- **연령**: 만 14세 이상만 가입 가능
- **MVP에서 빠지는 것 (D51)**: Android, 포오호·초오호 상표. 전체 순서는 `08-roadmap.md`

## 4. UI 콘셉트

- 토스·배달의민족처럼 간결하고 기능 중심인 UI, 밝고 친근한 브랜드
- 모오 캐릭터는 온보딩·빈 화면·안내 영역에서 보조적으로 사용
- 핵심 행동(저장)은 최대 1~2단계 안에 완료
- 이미지 형태: 프로필 `원형`, 맛집 `라운드 정사각`, 그룹 커버 `라운드 직사각`
- 맛집 사진은 API로 받을 수 없으므로 **기본 이미지(또는 카테고리 아이콘)** 사용 → `04-external-api.md`

## 5. 하단 내비게이션

`홈 / 그룹 / 마이` (3탭, D66)

| 탭 | 역할 |
|---|---|
| 홈 | 검색 진입, 배너, 최근 그룹, 최근 저장 맛집, 함께하는 친구 |
| 그룹 | 내가 참여한 그룹 목록·관리 |
| 마이 | 프로필, 초대장, 알림함, 환경설정, 서비스 정보 |

## 6. 화면 구조

```text
Splash
├─ Onboarding → Login → (신규) Signup Terms → Home
└─ (초대 링크 진입) 로그인: Invite Inbox / 비로그인: Invite Preview → Login → 참여

Home
├─ Search → Place Detail → Group Select BS → (Group Create)
├─ Group Detail
├─ Friend Groups BS
└─ My
Group Home
├─ Group Create
└─ Group Detail
   ├─ 맛집 탭 / 멤버 탭
   ├─ [맛집 추가] → Search (추가 모드, D78)
   ├─ Group Map (TODO: 좌표 저장 허용 시)
   ├─ Group Edit
   └─ Group Invite (생성자 전용)
My
├─ Invite Inbox ("mooh: 초대장")
├─ 친구 초대하기 (OS 공유 시트)
├─ Notifications (알림함)
├─ 공지사항 (네이버 블로그 링크, D57)
├─ FAQ
├─ Settings (환경설정: 회원 탈퇴 · 앱 버전 · 오픈소스 라이선스, D84) → Withdraw
└─ Profile Edit
```

## 7. 화면 ID 목록

| 화면 ID | 화면명 | 문서 |
|---|---|---|
| `MOOHAPP_SPLASH` | 스플래시 | auth |
| `MOOHAPP_ONBOARDING` | 온보딩 | auth |
| `MOOHAPP_LOGIN` | 로그인 | auth |
| `MOOHAPP_SIGNUP_TERMS` | 신규 가입 약관 | auth |
| `MOOHAPP_HOME` | 홈 | home |
| `MOOHAPP_FRIEND_GROUPS_BS` | 함께 참여 중인 그룹 바텀시트 | home |
| `MOOHAPP_SEARCH` | 통합 검색 (`[음식점] [카페]` 탭, 추가 모드) | search-place |
| `MOOHAPP_PLACE_DETAIL` | 맛집 상세 | search-place |
| `MOOHAPP_GROUP_SELECT_BS` | 그룹 선택 바텀시트 | search-place |
| `MOOHAPP_GROUP_HOME` | 그룹 홈 | group |
| `MOOHAPP_GROUP_CREATE` | 새 그룹 만들기 | group |
| `MOOHAPP_GROUP_DETAIL` | 그룹 상세 (맛집/멤버 탭) | group |
| `MOOHAPP_GROUP_MAP` | 그룹 맛집 지도 (`TODO`: 좌표 저장 허용 시에만, D39) | group |
| `MOOHAPP_GROUP_EDIT` | 그룹 수정 | group |
| `MOOHAPP_GROUP_INVITE` | 친구 초대 (생성자 전용) | group |
| `MOOHAPP_INVITE_INBOX` | mooh: 초대장 (풀팝업, 로그인 전용) | invite |
| `MOOHAPP_INVITE_PREVIEW` | 비밀 초대장 (비로그인 전용) | invite |
| `MOOHAPP_MY_HOME` | 마이 | my |
| `MOOHAPP_NOTIFICATIONS` | 알림함 | my |
| `MOOHAPP_SETTINGS` | 환경설정 | my |
| `MOOHAPP_PROFILE_EDIT` | 프로필 수정 | my |
| `MOOHAPP_WITHDRAW` | 회원 탈퇴 | my |
| `MOOHAPP_FAQ` | FAQ | my |

## 8. 공통 UI 컴포넌트

Search Bar · Hero Banner · Inline Banner · Group Card · Place Card · Member Avatar · Group Tag · Shared Badge · Save Button · Map Marker(그룹 지도 TODO) · Bottom Navigation · Bottom Sheet · Full Popup · Confirmation Dialog · Toast · Empty State · Skeleton · Spinner

## 9. 공통 UX 규칙

- 하위 화면은 Stack(Push)으로 진입. 선택·입력 보조 기능은 Bottom Sheet / Full Popup / Dialog
- 입력 화면에서 닫기·뒤로가기 시 **이탈 확인 Dialog 없음**, 입력값 폐기, 임시 저장 없음
- 서버 변경 요청 중에는 CTA 로딩 상태 + 중복 터치 차단
- 이전 화면 복귀 시 검색어·검색 탭·스크롤 유지
- 권한이 없는 기능은 노출하지 않거나 비활성화
- 빈 화면에는 캐릭터 + 안내 문구 + 다음 행동 CTA 제공
- 로딩: 홈/목록은 스켈레톤, 버튼은 Spinner
