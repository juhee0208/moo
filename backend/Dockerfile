# syntax=docker/dockerfile:1

# Node 버전 고정 (올릴 때는 이 한 줄만 바꾸고 테스트 → 배포)
ARG NODE_IMAGE=node:24.22.3-alpine3.24

# ---------- base: 공통 ----------
FROM ${NODE_IMAGE} AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---------- deps: 운영 의존성만 ----------
FROM base AS deps
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# ---------- test: docker build --target test 로만 실행 ----------
FROM base AS test
RUN --mount=type=cache,target=/root/.npm npm ci
COPY src ./src
COPY test ./test
RUN npm test

# ---------- runtime: 운영 이미지 (기본 빌드 대상) ----------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production
WORKDIR /app

# 실행에 필요 없는 패키지 매니저 제거 (npm 내장 패키지 취약점이 운영 이미지에 남지 않게)
# → 컨테이너 안에서는 npm 대신 node 로 직접 실행한다. 예) node src/db/migrate.js
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

# 파일은 root 소유로 두고 node 사용자로 실행 → 앱이 자기 코드를 수정할 수 없음
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY migrations ./migrations

# 어떤 커밋으로 만든 이미지인지 기록 (Jenkins가 --build-arg 로 전달)
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.title="moo-api" \
      org.opencontainers.image.revision=$GIT_SHA
ENV APP_VERSION=$GIT_SHA

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "src/server.js"]
