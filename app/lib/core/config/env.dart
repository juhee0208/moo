/// 실행 환경별 API 주소. 빌드/실행 시 --dart-define 으로 주입한다.
///
/// Android Emulator : http://10.0.2.2:3000
/// iOS Simulator    : http://localhost:3000
/// 실제 기기         : http://<PC_LAN_IP>:3000
/// 스테이징/운영      : https://stg-api.example.com / https://api.example.com
const apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000',
);
