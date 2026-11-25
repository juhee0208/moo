#!/usr/bin/env sh
# 배포 서버에서 실행: ./deploy.sh <API_IMAGE>
# 예) ./deploy.sh registry.example.com/team/moo-api:42
#
# 순서: 이미지 pull → DB 마이그레이션(일회성 컨테이너) → API 교체 → healthy 대기
# 마이그레이션이 실패하면 API는 교체하지 않고 이전 버전이 계속 동작한다.
set -eu

API_IMAGE="${1:?usage: deploy.sh <API_IMAGE>}"
cd "$(dirname "$0")/.."

export API_IMAGE
COMPOSE="docker compose -f compose.prod.yaml"

$COMPOSE pull api
$COMPOSE up -d --wait postgres
$COMPOSE run --rm --no-deps api node src/db/migrate.js
$COMPOSE up -d --wait api

# 롤백용으로 직전 / 현재 배포 이미지 기록
[ -f .last_deployed_image ] && cp .last_deployed_image .previous_deployed_image
echo "$API_IMAGE" > .last_deployed_image
