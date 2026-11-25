const express = require('express');

function createApp(pool) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  // 서버 및 DB 연결 상태 확인 (Docker healthcheck · Jenkins smoke test에서 사용)
  app.get('/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
      console.error('Health check failed:', error.message);
      res.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  // 도메인 라우터는 src/modules/<domain>/ 에 추가한 뒤 여기서 연결한다.
  // 예) app.use('/api/v1/groups', groupsRouter(pool));

  return app;
}

module.exports = { createApp };
