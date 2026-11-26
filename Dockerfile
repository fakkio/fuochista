FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production DATABASE_PATH=/data/fuochista.db PORT=5000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
VOLUME /data
EXPOSE 5000
CMD ["node", "src/server.ts"]
