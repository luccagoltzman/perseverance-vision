# Servidor multiplayer apenas (WebSocket). O frontend fica na Vercel.
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
# postinstall gera ícones PWA — só necessário no build do frontend (Vercel)
RUN npm ci --ignore-scripts

COPY server ./server

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "run", "start:mp"]
