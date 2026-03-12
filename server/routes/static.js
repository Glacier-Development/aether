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
    const gamesPath = path.join(process.cwd(), 'data', 'games.json');
    const data = await fs.readFile(gamesPath).catch(() => null);
    if (!data) {
      reply.code(200).send({ categories: [], games: [] });
      return;
    }
    reply.type('application/json').send(JSON.parse(data.toString('utf-8')));
  });

  fastify.get('/api/apps', async (request, reply) => {
    const appsPath = path.join(process.cwd(), 'data', 'apps.json');
    const data = await fs.readFile(appsPath).catch(() => null);
    if (!data) {
      reply.code(200).send({ apps: [] });
      return;
    }
    reply.type('application/json').send(JSON.parse(data.toString('utf-8')));
  });
}

