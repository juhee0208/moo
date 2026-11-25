FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# 운영에 필요한 패키지만 설치 (lock 파일 기준)
COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node src ./src
COPY --chown=node:node migrations ./migrations

USER node
EXPOSE 3000

CMD ["node", "src/server.js"]
