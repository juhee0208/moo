// DB 마이그레이션 실행: npm run migrate (컨테이너 안에서는 node src/db/migrate.js)
// 새 마이그레이션 파일: npm run migrate:create -- <이름>  → migrations/<timestamp>_<이름>.sql
// 배포 시 API 컨테이너를 교체하기 전에 일회성 컨테이너로 한 번만 실행한다. (infra/scripts/deploy.sh)
const path = require('node:path');
const { runner } = require('node-pg-migrate');
const { db } = require('../config/env');

async function migrate() {
  const applied = await runner({
    databaseUrl: db,
    dir: path.join(__dirname, '../../migrations'),
    migrationsTable: 'pgmigrations',
    direction: 'up',
    count: Infinity,
    singleTransaction: true, // 하나라도 실패하면 이번 실행 전체 롤백
    verbose: false,
  });

  console.log(
    applied.length
      ? `Applied migrations: ${applied.map((m) => m.name).join(', ')}`
      : 'No pending migrations',
  );
}

migrate().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
