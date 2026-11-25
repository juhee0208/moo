#!/usr/bin/env sh
# 배포 서버에서 cron 으로 실행: PostgreSQL 덤프를 backups/ 에 남기고 14일 지난 파일 삭제
set -eu

cd "$(dirname "$0")/.."
mkdir -p backups

STAMP="$(date +%Y%m%d-%H%M%S)"
docker compose -f compose.prod.yaml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/moo-$STAMP.dump"

find backups -name 'moo-*.dump' -mtime +14 -delete
