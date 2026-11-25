# 06. 분석 이벤트

분석 도구는 `TODO`. 도구가 정해져도 이벤트 이름은 유지한다.

| 이벤트 | 발생 시점 | 속성 |
|---|---|---|
| `onboarding_complete` | 온보딩 완료 | |
| `login_complete` | 소셜 로그인 성공 | `provider` |
| `signup_terms_complete` | 신규 가입 약관 완료 | |
| `home_view` | 홈 렌더링 완료 | |
| `home_banner_click` | Hero Banner 터치 | `bannerId` |
| `search_start` | 검색창 진입 | `mode`: `normal` / `add` |
| `search_submit` | 검색 실행 | `tab`: `FD6` / `CE7` |
| `search_tab_change` | 검색 결과 음식점 · 카페 탭 전환 (D77) | `tab` |
| `search_result_click` | 검색 결과 선택 | |
| `place_view` | 맛집 상세 렌더링 | |
| `place_kakaomap_open` | 카카오맵에서 보기 / 길찾기 | `type`: `view` / `route` |
| `place_save` | 맛집 저장 성공 | |
| `place_unsave` | 맛집 저장 해제 | |
| `group_view` | 그룹 홈 진입 | |
| `group_create` | 그룹 생성 성공 | |
| `group_detail_view` | 그룹 상세 진입 | |
| `group_invite_share` | 카카오톡으로 초대 공유 | |
| `invite_link_reissue` | 초대 링크 재발급 (D70 · D73) | `source`: `manual` / `auto_expired` / `auto_member_removed` |
| `invite_inbox_open` | 초대장 열림 | `source`: `link` / `my` |
| `invite_reject` | 초대 거절(삭제) | |
| `group_join` | 그룹 참여 성공 | `source`: `inbox` / `preview` |
| `group_place_add` | 그룹 맛집 추가 | `source`: `select_bs` / `add_mode` (D78) |
| `group_place_remove` | 그룹 맛집 삭제 | |
| `group_place_remove_undo` | 삭제 Toast의 [되돌리기] (D79) | |
| `group_place_auto_removed` | 폐업 맛집 자동 삭제 (서버, `place_auto_remove_enabled` on 이후에만) | |
| `group_leave` | 그룹 나가기 | |
| `group_delete` | 그룹 삭제 성공 | |
| `member_remove` | 멤버 내보내기 성공 | |
| `referral_share` | 친구 초대하기(앱 추천) 공유 | |
| `my_view` | 마이 진입 | |
| `notification_view` | 알림함 진입 | |
| `notice_open` | 공지사항(블로그 링크) 열기 (D57) | |
| `faq_view` | FAQ 진입 | |
| `profile_update` | 프로필 수정 성공 | |
| `logout` | 로그아웃 | |
| `withdraw_complete` | 회원 탈퇴 완료 | |
