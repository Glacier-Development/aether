# Aether (Custom Proxy)

Aether is a sleek, dark, glassmorphism-styled web unblocker / proxy site. It provides a **Games hub**, **proxied browser**, **Apps launcher**, **Addons**, **Settings**, and a hidden **Admin Panel**, all powered by a custom Node.js proxy instead of third‑party engines.

## Features

- **Games**: Curated grid of 25+ popular browser games with search and category filters.
- **Browser**: Minimal browser chrome UI with address bar and in‑frame proxied browsing.
- **Apps**: Icon launcher for 20+ popular web apps that open in the proxied browser.
- **Addons**: Client‑side toggles for behaviors like clean URLs, ad‑style blocking switches, UA spoof UI, etc.
- **Settings**: Accent color, font size, search engine, panic URL, and basic cloak options.
- **Admin Panel**: Maintenance mode, MOTD, blocklist manager, and stats, accessible via `Ctrl+K`.
- **Custom Proxy**: Simple HTTP fetch‑based proxy at `/api/proxy?url=...` plus `/api/check-url` blocklist lookups.

## One‑command setup

```bash
npm run fresh-start
```

This will install dependencies, build the client, and start the Fastify server on port 3000.

## Development

- Run both server and Vite dev client:

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3000`, and Vite dev server on `http://localhost:5173` (API requests are proxied to the backend).

## Deployment

### Vercel

1. Push this repo to Git.
2. Import it into Vercel.
3. Make sure `vercel.json` is present:

```json
{
  "builds": [{ "src": "server/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server/index.js" }]
}
```

4. Set environment variables if needed (e.g. `ADMIN_PASSWORD`).

### Railway

The repo includes `railway.json`:

- Build: `npm install && npm run build`
- Start: `npm start`

Create a new Railway project from this repo and Railway will infer defaults from `railway.json`.

### Render

The included `render.yaml` defines a simple Node web service:

```yaml
services:
  - type: web
    name: aether
    env: node
    buildCommand: "npm install && npm run build"
    startCommand: "npm start"
```

Create a new Render Blueprint deployment pointing at this repo.

### Docker / VPS

Build and run with Docker:

```bash
docker build -t aether .
docker run -p 3000:3000 --env NODE_ENV=production aether
```

Example Nginx reverse proxy on a VPS:

```nginx
server {
  listen 80;
  server_name aether.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Configuration

### Admin password

- Default admin password: `cherri3` (client‑side for the panel prompt and server‑side via `ADMIN_PASSWORD`).
- **Change in production** by setting:

```bash
export ADMIN_PASSWORD="a-strong-secret"
```

The backend validates all `/api/admin/*` requests with the `X-Admin-Key` header against this value.

### Data files

- `data/config.json` – MOTD and maintenance mode flags/message.
- `data/games.json` – Games catalogue (categories + `games[]`).
- `data/apps.json` – Apps catalogue (`apps[]`).
- `data/blocklist.json` – Block entries (`id`, `pattern`, `reason`, `category`, `addedAt`).

You can edit these JSON files directly or use the admin panel for blocklist and MOTD.

#### Adding games

- Edit `data/games.json`.
- Add new entries to the `games` array with:
  - `id`, `name`, `category`, `thumbnail`, `url`, `useProxy`, `description`, `plays`.

#### Adding apps

- Edit `data/apps.json`.
- Add entries under `apps` with:
  - `id`, `name`, `category`, `icon`, `url`, `color`.

### Blocklist via admin panel

- Press `Ctrl+K`, authenticate, then open the **Blocklist** tab.
- Use **Add Block** to add wildcard patterns (e.g. `*.example.com`, `*porn*`).
- Remove entries with the trash icon.
- The browser section and proxy endpoint both consult the blocklist before loading.

## Architecture overview

- **Backend**
  - Node.js + Fastify.
  - Static assets served from `dist` (Vite build output).
  - `/api/games`, `/api/apps`, `/api/config`, `/api/check-url`, `/api/proxy`, and `/api/admin/*`.
  - Data persisted in flat JSON files under `data/` using atomic writes.
- **Frontend**
  - Vanilla JS + Vite bundling.
  - Hash‑based router in `client/src/main.js`.
  - Sections in `client/src/sections/*`.
  - Reusable UI components (modals, toasts, blocked screen) in `client/src/components/*`.
  - Design tokens and layout in `client/src/styles/*`.
- **Proxy**
  - Simple `fetch`‑based HTTP proxy at `/api/proxy`.
  - URL checked against `data/blocklist.json` and `/api/check-url` before loading.

## Credits

- Fastify (HTTP server).
- Micromatch (wildcard URL matching).
- Inter & JetBrains Mono fonts (Google Fonts).

