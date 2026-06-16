# Servidor multiplayer apenas (WebSocket). O frontend fica na Vercel.
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY server ./server

ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "run", "start:mp"]
