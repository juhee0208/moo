#!/usr/bin/env sh
# 배포 서버에서 실행: ./deploy.sh <API_IMAGE>
# 예) ./deploy.sh registry.example.com/team/moo-api:42
set -eu

API_IMAGE="${1:?usage: deploy.sh <API_IMAGE>}"
cd "$(dirname "$0")/.."

export API_IMAGE
docker compose -f compose.prod.yaml pull api
docker compose -f compose.prod.yaml up -d --wait api

# 롤백용으로 마지막 배포 이미지 기록
echo "$API_IMAGE" > .last_deployed_image
