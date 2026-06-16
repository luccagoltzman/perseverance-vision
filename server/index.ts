import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  x: number;
  z: number;
  y: number;
  yaw: number;
  sprint: boolean;
  moving: boolean;
  waveUntil: number;
}

const PORT = Number(process.env.PORT) || 3001;
const MAX_PLAYERS = 48;
const MAX_NAME = 20;
const MIN_NAME = 2;

const players = new Map<string, Player>();

function sanitizeName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length < MIN_NAME || trimmed.length > MAX_NAME) return null;
  if (!/^[\p{L}\p{N}\s._-]+$/u.test(trimmed)) return null;
  return trimmed;
}

function sanitizeChat(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > 160) return null;
  return trimmed;
}

function playerSnapshot(p: Player) {
  return {
    id: p.id,
    name: p.name,
    x: p.x,
    z: p.z,
    y: p.y,
    yaw: p.yaw,
    sprint: p.sprint,
    moving: p.moving,
    waveUntil: p.waveUntil,
  };
}

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(payload: unknown, exceptId?: string) {
  const data = JSON.stringify(payload);
  for (const p of players.values()) {
    if (p.id !== exceptId && p.ws.readyState === p.ws.OPEN) {
      p.ws.send(data);
    }
  }
}

const httpServer = createServer((req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  res.writeHead(200, {
    ...cors,
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end(`Mars Field multiplayer — ${players.size} explorador(es) online\n`);
});

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  let playerId: string | null = null;

  ws.on('message', (raw) => {
    let msg: { type: string; [key: string]: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', message: 'Mensagem inválida' });
      return;
    }

    if (msg.type === 'ping') {
      send(ws, { type: 'online', count: players.size });
      return;
    }

    if (msg.type === 'join') {
      if (playerId) return;
      if (players.size >= MAX_PLAYERS) {
        send(ws, { type: 'error', message: 'Sala cheia. Tente novamente em instantes.' });
        ws.close();
        return;
      }

      const name = sanitizeName(String(msg.name ?? ''));
      if (!name) {
        send(ws, { type: 'error', message: 'Nome inválido (2–20 caracteres, sem símbolos especiais).' });
        return;
      }

      const duplicate = [...players.values()].some(
        (p) => p.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) {
        send(ws, { type: 'error', message: 'Este nome já está em uso. Escolha outro.' });
        return;
      }

      playerId = randomUUID();
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnRadius = 2 + Math.random() * 4;

      const player: Player = {
        id: playerId,
        name,
        ws,
        x: Math.sin(spawnAngle) * spawnRadius,
        z: 8 + Math.cos(spawnAngle) * spawnRadius,
        y: 0,
        yaw: Math.PI,
        sprint: false,
        moving: false,
        waveUntil: 0,
      };

      players.set(playerId, player);

      const others = [...players.values()]
        .filter((p) => p.id !== playerId)
        .map(playerSnapshot);

      send(ws, {
        type: 'welcome',
        id: playerId,
        players: others,
        online: players.size,
      });

      broadcast({ type: 'player_joined', player: playerSnapshot(player), online: players.size }, playerId);
      broadcast({ type: 'online', count: players.size });
      console.log(`+ ${name} (${players.size} online)`);
      return;
    }

    if (!playerId) return;
    const player = players.get(playerId);
    if (!player) return;

    if (msg.type === 'state') {
      player.x = clamp(Number(msg.x), -68, 68);
      player.z = clamp(Number(msg.z), -68, 68);
      player.y = clamp(Number(msg.y), 0, 8);
      player.yaw = Number(msg.yaw) || 0;
      player.sprint = Boolean(msg.sprint);
      player.moving = Boolean(msg.moving);
      player.waveUntil = Number(msg.waveUntil) || 0;

      broadcast(
        {
          type: 'state',
          id: playerId,
          x: player.x,
          z: player.z,
          y: player.y,
          yaw: player.yaw,
          sprint: player.sprint,
          moving: player.moving,
          waveUntil: player.waveUntil,
        },
        playerId,
      );
      return;
    }

    if (msg.type === 'chat') {
      const text = sanitizeChat(String(msg.text ?? ''));
      if (!text) return;
      const payload = {
        type: 'chat' as const,
        id: playerId,
        name: player.name,
        text,
        ts: Date.now(),
      };
      broadcast(payload);
      return;
    }

    if (msg.type === 'wave') {
      player.waveUntil = Date.now() + 1800;
      broadcast(
        {
          type: 'state',
          id: playerId,
          x: player.x,
          z: player.z,
          y: player.y,
          yaw: player.yaw,
          sprint: player.sprint,
          moving: player.moving,
          waveUntil: player.waveUntil,
        },
        playerId,
      );
    }
  });

  ws.on('close', () => {
    if (!playerId) return;
    const player = players.get(playerId);
    players.delete(playerId);
    broadcast({ type: 'player_left', id: playerId, online: players.size });
    broadcast({ type: 'online', count: players.size });
    if (player) console.log(`- ${player.name} (${players.size} online)`);
  });
});

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Mars Field multiplayer em port ${PORT} (/ws)`);
});
