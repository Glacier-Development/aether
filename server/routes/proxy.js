import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import micromatch from 'micromatch';

const BLOCKLIST_PATH = path.join(process.cwd(), 'data', 'blocklist.json');
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const tokenStore = new Map(); // token -> { url, createdAt }

function pruneTokens() {
  const now = Date.now();
  for (const [token, data] of tokenStore.entries()) {
    if (now - data.createdAt > TOKEN_TTL_MS) tokenStore.delete(token);
  }
}

function createToken() {
  return crypto.randomBytes(24).toString('base64url');
}

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

const SKIP_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'x-frame-options',
  'content-security-policy',
  'frame-ancestors',
]);

function shouldSkipHeader(name) {
  const lower = name.toLowerCase();
  if (SKIP_HEADERS.has(lower)) return true;
  if (lower.startsWith('content-security-policy')) return true;
  return false;
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

  fastify.post('/proxy/create', async (request, reply) => {
    reply.type('application/json');
    const body = request.body || {};
    const target = typeof body.url === 'string' ? body.url.trim() : '';
    if (!target) {
      return reply.code(400).send({ error: 'Missing url in body' });
    }

    const blocklist = await readBlocklist();
    const blocked = isBlocked(target, blocklist);
    if (blocked) {
      return reply.code(403).send({
        error: 'Blocked',
        reason: blocked.reason || 'Blocked by administrator',
      });
    }

    try {
      new URL(target);
    } catch {
      return reply.code(400).send({ error: 'Invalid URL' });
    }

    pruneTokens();
    const token = createToken();
    tokenStore.set(token, { url: target, createdAt: Date.now() });
    return reply.code(200).send({ token });
  });

  fastify.get('/proxy/:token', async (request, reply) => {
    const token = request.params.token;
    const data = tokenStore.get(token);
    if (!data) {
      return reply.code(404).type('text/html').send('<body>Session expired or invalid.</body>');
    }

    const targetUrl = data.url;
    try {
      const upstream = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'user-agent': request.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/119.0',
          'accept': request.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': request.headers['accept-language'] || 'en-US,en;q=0.9',
        },
      });

      reply.code(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (!shouldSkipHeader(key)) {
          reply.header(key, value);
        }
      });
      reply.send(upstream.body);
    } catch (err) {
      request.log.error(err);
      return reply.code(502).type('text/html').send('<body>Proxy error. Try again.</body>');
    }
  });

  // Legacy query-param support (redirect to token)
  fastify.get('/proxy', async (request, reply) => {
    const target = request.query.url;
    if (!target) {
      return reply.code(400).send({ error: 'Missing url parameter' });
    }
    const blocklist = await readBlocklist();
    const blocked = isBlocked(target, blocklist);
    if (blocked) {
      return reply.code(403).send({
        error: 'Blocked',
        reason: blocked.reason || 'Blocked by administrator',
      });
    }
    try {
      new URL(target);
    } catch {
      return reply.code(400).send({ error: 'Invalid URL' });
    }
    pruneTokens();
    const token = createToken();
    tokenStore.set(token, { url: target, createdAt: Date.now() });
    return reply.redirect(302, `/api/proxy/${token}`);
  });
}

