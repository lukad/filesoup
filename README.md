# FileSoup

Peer-to-peer file sharing. Drop a file, get a link, share it. The file transfers directly between browsers—nothing stored on the server.

## Features

- P2P transfer via WebTorrent—files go peer-to-peer, not through your server
- Files auto-expire after 10 minutes of inactivity
- Human-readable IDs (like `garlic-avocado-onion`)
- No account required

## Development

You'll need:
- Rust (1.70+)
- Node.js 18+ and pnpm

### Backend

```bash
cargo run
```

Serves on port 8080.

### Frontend

```bash
cd frontend
pnpm dev
```

Vite serves on port 5173 and proxies API requests to the backend.

## Building

### Backend

```bash
cargo build --release
```

The binary embeds the frontend `dist/` folder.

### Frontend

```bash
cd frontend
pnpm build
```

Outputs to `frontend/dist/`.

## Deployment

Deployed on Fly.io. The `Dockerfile` uses a multi-stage build for a minimal image.

### Environment Variables

- `HSTS_ENABLED` - Set to enable HSTS headers
- `APP_DOMAIN` - Fallback domain for HTTPS redirects (default: `filesoup.io`)

## How It Works

1. Drop a file → WebTorrent creates a torrent client-side
2. Backend generates a unique ID and stores the magnet URI
3. Share the link
4. Recipient opens the link → WebTorrent downloads P2P

Files expire after 10 minutes. Magnet URIs are stored only—no actual file data hits the server.
