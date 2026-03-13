import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { getConfig, setConfig } from '../config.js';

const BLOCKLIST_PATH = path.join(process.cwd(), 'data', 'blocklist.json');
const ADMIN_KEY = process.env.ADMIN_PASSWORD || 'cherri3'; // CHANGE THIS PASSWORD

async function readBlocklist() {
  try {
    const raw = await fs.readFile(BLOCKLIST_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.entries ?? [];
  } catch {
    return [];
  }
}

async function writeBlocklist(entries) {
  await fs.mkdir(path.dirname(BLOCKLIST_PATH), { recursive: true });
  const tmp = BLOCKLIST_PATH + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(entries, null, 2));
  await fs.rename(tmp, BLOCKLIST_PATH);
}

function requireAdmin(request, reply) {
  const key = request.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export default async function adminRoutes(fastify) {
  fastify.post('/maintenance', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body || {};
    const next = setConfig({
      maintenance: {
        enabled: Boolean(body.enabled),
        message: body.message || getConfig().maintenance.message,
      },
    });
    reply.send(next.maintenance);
  });

  fastify.post('/motd', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body || {};
    const next = setConfig({
      motd: {
        enabled: Boolean(body.enabled),
        text: body.text || getConfig().motd.text,
      },
    });
    reply.send(next.motd);
  });

  fastify.get('/blocklist', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const entries = await readBlocklist();
    reply.send(entries);
  });

  fastify.post('/blocklist', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const body = request.body || {};
    if (!body.pattern) {
      reply.code(400).send({ error: 'pattern is required' });
      return;
    }
    const entries = await readBlocklist();
    const entry = {
      id: String(Date.now()),
      pattern: body.pattern,
      reason: body.reason || 'Blocked by administrator',
      category: body.category || 'Custom',
      addedAt: new Date().toISOString(),
    };
    entries.push(entry);
    await writeBlocklist(entries);
    reply.send(entry);
  });

  fastify.delete('/blocklist/:id', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const id = request.params.id;
    const entries = await readBlocklist();
    const next = entries.filter((e) => e.id !== id);
    await writeBlocklist(next);
    reply.send({ ok: true });
  });

  fastify.get('/stats', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const gamesPath = path.join(process.cwd(), 'data', 'games.json');
    const appsPath = path.join(process.cwd(), 'data', 'apps.json');
    const [gamesRaw, appsRaw, blocklist] = await Promise.all([
      fs.readFile(gamesPath, 'utf-8').catch(() => '{}'),
      fs.readFile(appsPath, 'utf-8').catch(() => '{}'),
      readBlocklist(),
    ]);
    const games = JSON.parse(gamesRaw || '{}');
    const apps = JSON.parse(appsRaw || '{}');
    const uptime = process.uptime();
    reply.send({
      gamesCount: (games.games || []).length,
      appsCount: (apps.apps || []).length,
      blocklistCount: blocklist.length,
      proxyEngine: 'custom',
      uptime,
      nodeVersion: process.version,
      memory: process.memoryUsage(),
      host: os.hostname(),
    });
  });
}

