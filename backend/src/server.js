const { createApp } = require('./app');
const { createPool } = require('./db/pool');
const { port } = require('./config/env');

const pool = createPool();
const app = createApp(pool);

// 0.0.0.0: 컨테이너 외부(포트 매핑)에서 들어오는 요청을 받기 위해 모든 인터페이스에 바인딩
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`MOO API running on port ${port}`);
});

// 컨테이너 종료(SIGTERM) 시 연결 정리
function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
