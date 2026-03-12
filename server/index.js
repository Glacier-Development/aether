import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCompress from '@fastify/compress';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({
  logger: process.env.NODE_ENV !== 'production',
});

await app.register(fastifyCompress);
await app.register(fastifyStatic, {
  root: path.join(__dirname, '../dist'),
  prefix: '/',
});

app.addHook('onRequest', async (req, reply) => {
  const config = getConfig();
  const isApiRoute = req.url.startsWith('/api/');
  const isStaticAsset = req.url.match(/\.(js|css|png|svg|ico|woff2|wasm|json)$/);

  const isAdminAuthed = false;

  if (config.maintenance?.enabled && !isApiRoute && !isStaticAsset && !isAdminAuthed) {
    reply.type('text/html').send(renderMaintenancePage(config.maintenance.message));
  }
});

await app.register((await import('./routes/proxy.js')).default, { prefix: '/api' });
await app.register((await import('./routes/admin.js')).default, { prefix: '/api/admin' });
await app.register((await import('./routes/static.js')).default);

app.setNotFoundHandler((req, reply) => {
  reply.sendFile('index.html');
});

const PORT = process.env.PORT || 3000;
app.listen({ port: Number(PORT), host: '0.0.0.0' }, (err, address) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
  // eslint-disable-next-line no-console
  console.log(`Aether running on ${address}`);
});

function renderMaintenancePage(message) {
  const safeMessage =
    typeof message === 'string' && message.trim().length > 0
      ? message
      : "We're performing maintenance. Back soon!";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Aether – Maintenance</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #050814;
      --card: #0b1020;
      --accent: #63b3ed;
      --text: #e2e8f0;
      --muted: #718096;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top, #1a365d 0, var(--bg) 45%);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .card {
      max-width: 420px;
      width: 90%;
      background: radial-gradient(circle at top left, rgba(99,179,237,0.16), transparent 55%), var(--card);
      border-radius: 18px;
      padding: 32px 28px 26px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7);
      border: 1px solid rgba(255,255,255,0.04);
      position: relative;
      overflow: hidden;
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
      background: radial-gradient(circle at 30% 0, #90cdf4, #3182ce);
      box-shadow: 0 0 32px rgba(99,179,237,0.6);
    }
    .icon svg {
      width: 30px;
      height: 30px;
      color: white;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      letter-spacing: -0.03em;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: var(--muted);
      margin-bottom: 18px;
    }
    .msg {
      font-size: 13px;
      line-height: 1.6;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(15,23,42,0.9);
      border: 1px solid rgba(99,179,237,0.3);
      color: #cbd5f5;
    }
    .brand {
      margin-top: 20px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: rgba(160,174,192,0.9);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pill {
      height: 6px;
      width: 6px;
      border-radius: 999px;
      background: #48bb78;
      box-shadow: 0 0 12px rgba(72,187,120,0.8);
    }
  </style>
</head>
<body>
  <main class="card" aria-labelledby="title">
    <div class="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.83 0 1.6.52 1.9 1.32.1.25.16.52.16.8s-.06.55-.16.8A1.99 1.99 0 0 1 19.4 15Z" />
      </svg>
    </div>
    <h1 id="title">We&apos;ll be right back</h1>
    <p>Aether is in maintenance mode while we tune the network and proxy stack.</p>
    <div class="msg">${safeMessage}</div>
    <div class="brand">
      <span class="pill"></span>
      <span>Aether Proxy</span>
    </div>
  </main>
</body>
</html>`;
}

