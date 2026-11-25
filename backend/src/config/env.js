// 환경변수는 이 파일에서만 읽는다. (값은 compose.yaml / 운영 서버 .env 에서 주입)
module.exports = {
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
};
