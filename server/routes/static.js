import path from 'path';
import { promises as fs } from 'fs';

export default async function staticRoutes(fastify) {
  fastify.get('/api/config', async (request, reply) => {
    const { getConfig } = await import('../config.js');
    const cfg = getConfig();
    return {
      maintenance: cfg.maintenance,
      motd: cfg.motd,
    };
  });

  fastify.get('/api/games', async (request, reply) => {
    reply.type('application/json');
    const gamesPath = path.join(process.cwd(), 'data', 'games.json');
    try {
      const data = await fs.readFile(gamesPath, 'utf-8');
      const parsed = data.trim() ? JSON.parse(data) : {};
      const payload = {
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        games: Array.isArray(parsed.games) ? parsed.games : [],
      };
      return reply.code(200).send(payload);
    } catch {
      return reply.code(200).send({ categories: [], games: [] });
    }
  });

  fastify.get('/api/apps', async (request, reply) => {
    reply.type('application/json');
    const appsPath = path.join(process.cwd(), 'data', 'apps.json');
    try {
      const data = await fs.readFile(appsPath, 'utf-8');
      const parsed = data.trim() ? JSON.parse(data) : {};
      const payload = {
        apps: Array.isArray(parsed.apps) ? parsed.apps : [],
      };
      return reply.code(200).send(payload);
    } catch {
      return reply.code(200).send({ apps: [] });
    }
  });
}

