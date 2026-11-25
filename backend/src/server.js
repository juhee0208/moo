const { createApp } = require('./app');
const { createPool } = require('./db/pool');
const { port } = require('./config/env');

const pool = createPool();
const app = createApp(pool);

// 0.0.0.0: 컨테이너 외부(포트 매핑)에서 들어오는 요청을 받기 위해 모든 인터페이스에 바인딩
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`MOO API running on port ${port}`);
});

// 컨테이너 종료(SIGTERM) 시 새 요청을 막고 진행 중인 요청을 마친 뒤 DB 연결 정리.
// Docker 기본 stop 대기(10초) 안에 끝나도록 8초가 지나면 강제 종료한다.
const SHUTDOWN_TIMEOUT_MS = 8000;
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  setTimeout(() => {
    console.error('Shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  server.closeIdleConnections(); // 대기 중인 keep-alive 연결은 바로 닫는다
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
