# 05. 시스템 메시지 · 빈 화면 문구

- 모든 문구는 메시지 ID 기준으로 상수/리소스 파일에 분리한다.
- `⚠️` 표시는 **문구 확정 전**(초안). 구현은 하되 바꾸기 쉽게 둘 것.
- `{변수}`는 런타임에 치환. 상한 숫자는 하드코딩하지 않고 서버가 준 상한을 `{max}`로 넣는다 (요금제 대비).

## 1. Toast / Dialog

| 상황 | 메시지 ID | 방식 | 문구 | 버튼 | 처리 |
|---|---|---|---|---|---|
| 소셜 로그인 실패 | `MOOHAPP_TOAST_LOGIN_FAIL` | Toast · error | 로그인에 실패했어요. 잠시 후 다시 시도해 주세요. | - | 로그인 화면 유지 |
| 필수 약관 미동의 | - | 버튼 비활성 | - | - | [확인] 비활성 |
| 검색 공백 입력 | - | 실행 차단 | - | - | 검색 안 함 |
| 맛집 저장 성공 | `MOOHAPP_TOAST_PLACE_SAVE_SUCCESS` | Toast · success | 맛집을 저장했어요. | - | 저장 상태 갱신 |
| 맛집 저장 해제 | `MOOHAPP_TOAST_PLACE_UNSAVE_SUCCESS` | Toast · success | 저장을 해제했어요. | - | 저장 상태 갱신 |
| 맛집 저장 실패 | `MOOHAPP_TOAST_PLACE_SAVE_FAIL` | Toast · error | 저장하지 못했어요. 잠시 후 다시 시도해 주세요. | - | 선택 상태 유지 |
| 같은 그룹 중복 추가 | `MOOHAPP_TOAST_PLACE_DUPLICATED` | Toast · info | 이미 이 그룹에 저장된 맛집이에요. | - | 중복 생성 차단 |
| 그룹 맛집 상한 도달 | `MOOHAPP_TOAST_GROUP_PLACE_LIMIT` | Toast · warning | 이 그룹에는 맛집을 최대 {max}개까지 저장할 수 있어요. | - | 추가 차단 |
| 그룹 생성 실패 | `MOOHAPP_TOAST_GROUP_CREATE_FAIL` | Toast · error | 그룹을 만들지 못했어요. 잠시 후 다시 시도해 주세요. | - | 입력값 유지 |
| 그룹 수 상한 도달 | `MOOHAPP_DIALOG_GROUP_LIMIT` | Dialog · alert | ⚠️ 그룹은 최대 {max}개까지 만들거나 참여할 수 있어요. | [확인] | 생성·참여 차단 |
| 그룹 멤버 20명 도달 | `MOOHAPP_DIALOG_GROUP_MEMBER_LIMIT` | Dialog · alert | 이 그룹은 참여 가능한 인원을 모두 채웠어요. | [확인] | 참여 차단 |
| 만료된 초대 링크 | `MOOHAPP_DIALOG_INVITE_EXPIRED` | Dialog · alert | 초대 링크가 만료되었어요.<br>새 링크를 요청해주세요. | [확인] | 홈 이동 (비로그인은 온보딩/로그인) |
| 무효 초대 링크 (재발급됨 · 알 수 없는 토큰, D72) | `MOOHAPP_DIALOG_INVITE_DISABLED` | Dialog · alert | 사용할 수 없는 초대 링크예요. | [확인] | 홈 이동 (비로그인은 온보딩/로그인) |
| 삭제된 그룹 접근 | `MOOHAPP_TOAST_GROUP_DELETED` | Toast · info | 삭제된 그룹이에요. | - | 현재 화면 유지 (`02-policies.md` 8.2) |
| 그룹 접근 권한 없음 | `MOOHAPP_DIALOG_GROUP_FORBIDDEN` | Dialog · alert | 이 그룹에 접근할 수 없어요. | [확인] | 그룹 홈 이동 |
| 그룹 삭제 확인 | `MOOHAPP_DIALOG_GROUP_DELETE_CONFIRM` | Dialog | 그룹을 삭제할까요?<br>그룹에 저장된 맛집과 공유 정보가 모두 삭제되며 복구할 수 없어요. | [취소] / [삭제] | 권한 재검증 후 삭제 |
| 그룹 삭제 성공 | - | 이동 | - | - | 메시지 없이 그룹 홈 |
| 그룹 삭제 실패 | `MOOHAPP_TOAST_GROUP_DELETE_FAIL` | Toast · error | 그룹을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요. | - | 현재 화면 유지 |
| 그룹 나가기 확인 | `MOOHAPP_DIALOG_GROUP_LEAVE_CONFIRM` | Dialog | ⚠️ 그룹에서 나갈까요? | [취소] / [나가기] | 나간 뒤 메시지 없이 그룹 홈 |
| 멤버 내보내기 확인 | `MOOHAPP_DIALOG_MEMBER_REMOVE_CONFIRM` | Dialog | 이 멤버를 그룹에서 내보낼까요? | [취소] / [내보내기] | 멤버 권한 제거 |
| 카카오맵 연결 실패 | `MOOHAPP_TOAST_KAKAOMAP_FAIL` | Toast · error | 카카오맵을 연결하지 못했어요. 잠시 후 다시 시도해 주세요. | - | 상세 유지 |
| 맛집 정보 불러오기 실패 | `MOOHAPP_TOAST_PLACE_LOAD_FAIL` | Toast · error | ⚠️ 맛집 정보를 불러오지 못했어요. | - | 이전 화면 (D38) |
| 주소 복사 | `MOOHAPP_TOAST_ADDRESS_COPY` | Toast · success | 주소를 복사했어요. | - | 클립보드 저장 |
| 초대 링크 재발급 확인 | `MOOHAPP_DIALOG_INVITE_REISSUE_CONFIRM` | Dialog | ⚠️ 새 링크를 만들까요?<br>이전 링크는 더 이상 사용할 수 없어요. | [취소] / [새로 만들기] | 기존 링크 무효 |
| 초대 거절(삭제) 확인 | `MOOHAPP_DIALOG_INVITE_REJECT_CONFIRM` | Dialog | ⚠️ 선택한 초대를 삭제할까요? | [취소] / [삭제] | 대기 초대 삭제 |
| 네트워크 오류 | `MOOHAPP_TOAST_NETWORK_ERROR` | Toast · error | 네트워크 연결을 확인해 주세요. | - | 변경값 유지, 재시도 허용 |
| 세션 만료 | `MOOHAPP_DIALOG_SESSION_EXPIRED` | Dialog · alert | 로그인이 만료되었어요. 다시 로그인해 주세요. | [확인] | 로그인 후 가능하면 원래 화면 |
| 로그아웃 확인 | `MOOHAPP_DIALOG_LOGOUT_CONFIRM` | Dialog | ⚠️ 로그아웃할까요? | [취소] / [로그아웃] | 로컬 세션 삭제 |
| 회원 탈퇴 확인 | `MOOHAPP_DIALOG_WITHDRAW_CONFIRM` | Dialog | ⚠️ 정말 탈퇴할까요?<br>내가 만든 그룹 {n}개가 함께 삭제되며 복구할 수 없어요. | [취소] / [탈퇴] | 가입한 provider로 재로그인 후 탈퇴 처리 (D82) |
| 그룹 맛집 추가 (추가 모드) | `MOOHAPP_TOAST_GROUP_PLACE_ADDED` | Toast · success | ⚠️ '{그룹명}'에 추가했어요. | - | 결과 카드 `추가됨` (D78) |
| 그룹 맛집 삭제 | `MOOHAPP_TOAST_GROUP_PLACE_REMOVED` | Toast · info | ⚠️ 맛집을 삭제했어요. | [되돌리기] | 되돌리기 = 다시 추가 (D79) |
| 초대 일부 참여 | `MOOHAPP_TOAST_INVITE_JOIN_PARTIAL` | Toast · warning | ⚠️ {n}개 그룹에 참여했어요. {m}개는 참여하지 못했어요. | - | 성공 수에 따라 이동 (D74) |
| 초대 참여 모두 실패 | `MOOHAPP_TOAST_INVITE_JOIN_FAIL` | Toast · error | ⚠️ 그룹에 참여하지 못했어요. | - | 초대장 유지. 1개만 선택했으면 해당 코드의 Dialog (D74) |
| 멤버 내보내기 완료 | `MOOHAPP_TOAST_MEMBER_REMOVED` | Toast · success | ⚠️ 멤버를 내보냈어요. 초대 링크도 새로 만들었어요. | - | 링크 자동 재발급 (D73) |
| 새 초대 링크 생성 | `MOOHAPP_TOAST_INVITE_REISSUED` | Toast · success | ⚠️ 새 초대 링크를 만들었어요. | - | 유효기간 갱신 표시 (D70) |
| 카카오톡 공유 실패 | `MOOHAPP_TOAST_KAKAO_SHARE_FAIL` | Toast · error | ⚠️ 카카오톡 공유를 열지 못했어요. | - | 친구 초대 화면 유지 |
| 그룹 수정 성공 | `MOOHAPP_TOAST_GROUP_UPDATE_SUCCESS` | Toast · success | ⚠️ 그룹 정보를 수정했어요. | - | 그룹 상세 |
| 그룹 수정 실패 | `MOOHAPP_TOAST_GROUP_UPDATE_FAIL` | Toast · error | ⚠️ 그룹 정보를 수정하지 못했어요. 잠시 후 다시 시도해 주세요. | - | 입력값 유지 |
| 닉네임 형식 오류 | - | 인라인 | ⚠️ 2~10자로 입력해 주세요. / 이모지는 쓸 수 없어요. | - | [저장] 비활성 (D81) |
| 프로필 저장 실패 | `MOOHAPP_TOAST_PROFILE_UPDATE_FAIL` | Toast · error | ⚠️ 프로필을 저장하지 못했어요. | - | 입력값 유지 |
| 탈퇴 재로그인 계정 불일치 | `MOOHAPP_DIALOG_WITHDRAW_REAUTH_MISMATCH` | Dialog · alert | ⚠️ 가입한 계정과 다른 계정이에요.<br>처음 가입한 계정으로 로그인해 주세요. | [확인] | 탈퇴 화면 유지 (D82) |
| 탈퇴 실패 | `MOOHAPP_TOAST_WITHDRAW_FAIL` | Toast · error | ⚠️ 탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요. | - | 탈퇴 화면 유지 |

## 2. 알림함 문구

푸시 없이 알림함에만 쌓인다 (`screens/my.md`). 90일 또는 최근 100개 중 먼저 걸리는 기준으로 정리한다 (D83).

| 알림 종류 | 알림 ID | 문구 | 터치 시 |
|---|---|---|---|
| 그룹 삭제 (생성자가 삭제) | `NOTI_GROUP_DELETED` | ⚠️ '{그룹명}' 그룹이 삭제되었어요. | 이동 없음 |
| 그룹 삭제 (생성자 탈퇴) | `NOTI_GROUP_DELETED` (사유 변수: `OWNER_WITHDRAWN`) | ⚠️ 그룹장이 탈퇴해 '{그룹명}' 그룹이 삭제되었어요. | 이동 없음 |
| 내보내짐 | `NOTI_MEMBER_REMOVED` | ⚠️ '{그룹명}' 그룹에서 내보내졌어요. | 이동 없음 |
| 폐업 맛집 자동 삭제 (D56) | `NOTI_PLACE_AUTO_REMOVED` | '{그룹명}'의 {상호명} 해당 위치는 폐업 또는 이동으로 인해 자동 삭제되었어요! | 이동 없음 |

그룹 삭제는 같은 알림 ID를 쓰고 **사유(`reason`)만 변수로** 문구를 바꾼다: `OWNER_DELETED` / `OWNER_WITHDRAWN`.

## 3. 빈 화면

| 화면 | 문구 | CTA |
|---|---|---|
| 홈 최근 그룹 없음 | 아직 맛집 그룹이 없어요. | 새 그룹 만들기 |
| 홈 최근 추가된 맛집 없음 | ⚠️ 아직 그룹에 추가된 맛집이 없어요. | ⚠️ 맛집 검색하기 (→ 통합 검색) |
| 홈 함께하는 친구 없음 | 친구와 함께 맛집을 모아보세요. | 그룹 만들고 초대하기 |
| 그룹 홈 0건 | 아직 만든 그룹이 없어요.<br>나만의 맛집 리스트를 만들어보세요. | + 새 그룹 |
| 그룹 맛집 0건 | 아직 저장된 맛집이 없어요. | 맛집 추가 |
| 검색 0건 | 검색 결과가 없어요.<br>다른 이름이나 지역으로 검색해 주세요. | - |
| 초대장 0건 | ⚠️ 받은 초대가 없어요. | - |
| 알림함 0건 | ⚠️ 새로운 알림이 없어요. | - |
| FAQ 0건 | ⚠️ 등록된 FAQ가 없어요. | - |
