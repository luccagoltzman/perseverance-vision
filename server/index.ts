import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';

const MAX_HP = 100;
const LASER_DAMAGE = 25;
const RESPAWN_MS = 5000;
const SHOOT_COOLDOWN_MS = 850;
const LASER_RANGE = 28;
const LASER_HALF_ANGLE = 0.22;

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
  inRover: boolean;
  hp: number;
  alive: boolean;
  laserEquipped: boolean;
  respawnAt: number;
  lastShotAt: number;
}

const PORT = Number(process.env.PORT) || (process.env.NODE_ENV === 'production' ? 8080 : 3001);
const MAX_PLAYERS = 48;
const MAX_NAME = 20;
const MIN_NAME = 2;

const players = new Map<string, Player>();
const respawnTimers = new Map<string, ReturnType<typeof setTimeout>>();

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
    inRover: p.inRover,
    hp: p.hp,
    alive: p.alive,
    laserEquipped: p.laserEquipped,
    respawnAt: p.respawnAt,
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

function broadcastAll(payload: unknown) {
  const data = JSON.stringify(payload);
  for (const p of players.values()) {
    if (p.ws.readyState === p.ws.OPEN) p.ws.send(data);
  }
}

function randomSpawn() {
  const spawnAngle = Math.random() * Math.PI * 2;
  const spawnRadius = 2 + Math.random() * 4;
  return {
    x: Math.sin(spawnAngle) * spawnRadius,
    z: 8 + Math.cos(spawnAngle) * spawnRadius,
    y: 0,
    yaw: Math.PI,
  };
}

function findLaserTarget(shooter: Player): Player | null {
  const dirX = Math.sin(shooter.yaw);
  const dirZ = Math.cos(shooter.yaw);
  const minDot = Math.cos(LASER_HALF_ANGLE);

  let best: Player | null = null;
  let bestDist = LASER_RANGE;

  for (const target of players.values()) {
    if (target.id === shooter.id || !target.alive) continue;

    const dx = target.x - shooter.x;
    const dz = target.z - shooter.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > LASER_RANGE || dist < 0.6) continue;

    const nx = dx / dist;
    const nz = dz / dist;
    const dot = nx * dirX + nz * dirZ;
    if (dot < minDot) continue;

    if (dist < bestDist) {
      bestDist = dist;
      best = target;
    }
  }

  return best;
}

function scheduleRespawn(player: Player) {
  const existing = respawnTimers.get(player.id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    respawnTimers.delete(player.id);
    respawnPlayer(player.id);
  }, RESPAWN_MS);

  respawnTimers.set(player.id, timer);
}

function respawnPlayer(id: string) {
  const player = players.get(id);
  if (!player || player.alive) return;

  const spawn = randomSpawn();
  player.x = spawn.x;
  player.z = spawn.z;
  player.y = spawn.y;
  player.yaw = spawn.yaw;
  player.hp = MAX_HP;
  player.alive = true;
  player.respawnAt = 0;
  player.laserEquipped = false;
  player.inRover = false;
  player.moving = false;
  player.sprint = false;

  broadcastAll({ type: 'player_respawned', player: playerSnapshot(player) });
}

function killPlayer(victim: Player, killerId: string | null) {
  victim.hp = 0;
  victim.alive = false;
  victim.respawnAt = Date.now() + RESPAWN_MS;
  victim.laserEquipped = false;
  victim.moving = false;

  broadcastAll({
    type: 'player_died',
    id: victim.id,
    respawnAt: victim.respawnAt,
    killerId,
  });

  scheduleRespawn(victim);
}

function applyDamage(victim: Player, attacker: Player, damage: number) {
  if (!victim.alive) return;

  victim.hp = Math.max(0, victim.hp - damage);

  broadcastAll({
    type: 'player_hit',
    victimId: victim.id,
    attackerId: attacker.id,
    hp: victim.hp,
    damage,
  });

  if (victim.hp <= 0) {
    killPlayer(victim, attacker.id);
  }
}

function handleShoot(shooter: Player) {
  if (!shooter.alive || !shooter.laserEquipped || shooter.inRover) return;

  const now = Date.now();
  if (now - shooter.lastShotAt < SHOOT_COOLDOWN_MS) return;
  shooter.lastShotAt = now;

  broadcastAll({
    type: 'laser_shot',
    id: shooter.id,
    x: shooter.x,
    z: shooter.z,
    y: shooter.y,
    yaw: shooter.yaw,
  });

  const target = findLaserTarget(shooter);
  if (target) {
    applyDamage(target, shooter, LASER_DAMAGE);
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
      const spawn = randomSpawn();

      const player: Player = {
        id: playerId,
        name,
        ws,
        x: spawn.x,
        z: spawn.z,
        y: spawn.y,
        yaw: spawn.yaw,
        sprint: false,
        moving: false,
        waveUntil: 0,
        inRover: false,
        hp: MAX_HP,
        alive: true,
        laserEquipped: false,
        respawnAt: 0,
        lastShotAt: 0,
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
        self: {
          hp: player.hp,
          alive: player.alive,
          laserEquipped: player.laserEquipped,
          respawnAt: player.respawnAt,
        },
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
      if (!player.alive) return;

      player.x = clamp(Number(msg.x), -68, 68);
      player.z = clamp(Number(msg.z), -68, 68);
      player.y = clamp(Number(msg.y), 0, 8);
      player.yaw = Number(msg.yaw) || 0;
      player.sprint = Boolean(msg.sprint);
      player.moving = Boolean(msg.moving);
      player.waveUntil = Number(msg.waveUntil) || 0;
      player.inRover = Boolean(msg.inRover);

      broadcast(
        {
          type: 'state',
          id: playerId,
          ...playerSnapshot(player),
        },
        playerId,
      );
      return;
    }

    if (msg.type === 'equip_laser') {
      if (!player.alive || player.inRover) return;
      player.laserEquipped = true;
      const payload = {
        type: 'state' as const,
        id: playerId,
        ...playerSnapshot(player),
      };
      send(player.ws, payload);
      broadcast(payload, playerId);
      return;
    }

    if (msg.type === 'stow_laser') {
      player.laserEquipped = false;
      const payload = {
        type: 'state' as const,
        id: playerId,
        ...playerSnapshot(player),
      };
      send(player.ws, payload);
      broadcast(payload, playerId);
      return;
    }

    if (msg.type === 'shoot') {
      handleShoot(player);
      broadcast(
        {
          type: 'state',
          id: playerId,
          ...playerSnapshot(player),
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
      if (!player.alive) return;
      player.waveUntil = Date.now() + 1800;
      broadcast(
        {
          type: 'state',
          id: playerId,
          ...playerSnapshot(player),
        },
        playerId,
      );
    }
  });

  ws.on('close', () => {
    if (!playerId) return;
    const player = players.get(playerId);
    const timer = respawnTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      respawnTimers.delete(playerId);
    }
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
