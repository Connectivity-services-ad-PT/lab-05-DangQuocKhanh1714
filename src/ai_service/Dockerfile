FROM node:20-alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY package*.json ./
# Đổi từ npm ci --only=production thành:
RUN npm install --omit=dev
COPY server.js .
EXPOSE 4010
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4010/health || exit 1
CMD ["node", "server.js"]