import { promises as fs } from 'fs';
import path from 'path';
import micromatch from 'micromatch';

const BLOCKLIST_PATH = path.join(process.cwd(), 'data', 'blocklist.json');

async function readBlocklist() {
  try {
    const raw = await fs.readFile(BLOCKLIST_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.entries ?? [];
  } catch {
    return [];
  }
}

export function isBlocked(url, blocklist) {
  try {
    const u = new URL(url);
    const hostname = u.hostname;
    return blocklist.find((entry) => {
      const pattern = entry.pattern || '';
      return (
        micromatch.isMatch(hostname, pattern) ||
        micromatch.isMatch(u.href, pattern)
      );
    });
  } catch {
    return null;
  }
}

export default async function proxyRoutes(fastify) {
  fastify.get('/check-url', async (request, reply) => {
    const url = request.query.url;
    if (!url) {
      return { blocked: false };
    }
    const blocklist = await readBlocklist();
    const match = isBlocked(url, blocklist);
    if (!match) {
      return { blocked: false };
    }
    return {
      blocked: true,
      reason: match.reason || 'Blocked by administrator',
      category: match.category || 'Custom',
    };
  });

  fastify.get('/proxy', async (request, reply) => {
    const target = request.query.url;
    if (!target) {
      reply.code(400).send({ error: 'Missing url parameter' });
      return;
    }

    const blocklist = await readBlocklist();
    const blocked = isBlocked(target, blocklist);
    if (blocked) {
      reply.code(403).send({
        error: 'Blocked',
        reason: blocked.reason || 'Blocked by administrator',
        category: blocked.category || 'Custom',
      });
      return;
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      reply.code(400).send({ error: 'Invalid URL' });
      return;
    }

    try {
      const controller = new AbortController();
      const upstream = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          'user-agent': request.headers['user-agent'] || '',
        },
        signal: controller.signal,
      });

      reply.code(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
          reply.header(key, value);
        }
      });
      reply.send(upstream.body);
    } catch (err) {
      request.log.error(err);
      reply.code(502).send({ error: 'Proxy error' });
    }
  });
}

