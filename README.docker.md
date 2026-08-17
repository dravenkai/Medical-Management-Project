# Running everything with Docker Compose

This spins up all 5 pieces of the project as separate containers on one shared network:

| Service          | What it is                          | URL (host machine)     |
|-------------------|--------------------------------------|-------------------------|
| `mysql`            | MySQL 8, 2 databases, 1 named volume | `localhost:3306`         |
| `backend`          | PHP API                             | http://localhost:8000    |
| `azuremed-hub`     | Next.js storefront + its own API    | http://localhost:3000    |
| `admin-dashboard`  | Vite/React admin panel              | http://localhost:5173    |
| `bot`               | Python Telegram bot                 | (no HTTP port — polls Telegram) |

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running (Windows/macOS/Linux — this is the only prerequisite, no local Node/PHP/MySQL/Python install needed).

## First-time setup (you)

```powershell
# 1. Copy the env template and fill in real values
Copy-Item .env.example .env
notepad .env   # fill in NEXTAUTH_SECRET, BOT_API_SECRET, BOT_TOKEN, MYSQL_ROOT_PASSWORD, etc.

# 2. Build all images and start everything
docker compose up --build -d

# 3. Watch logs (optional)
docker compose logs -f

# 4. Check everything is healthy
docker compose ps
```

First boot creates the `mysql_data` volume and runs both schema files automatically
(`backend/database/schema.sql` → `medical_project` DB, `azuremed-hub/config/azuremed_schema.sql` →
`azuremed_hub` DB). This only happens on a genuinely empty volume — see "Resetting the database" below.

Once it's up:
- Storefront: http://localhost:3000
- Admin dashboard: http://localhost:5173 (demo login: `admin@medical.local` / `admin123`, from `backend/README.md`)
- PHP API directly: http://localhost:8000
- Telegram bot: message your bot on Telegram directly, no local URL

## Stopping / restarting

```powershell
docker compose down          # stop containers, KEEP the mysql_data volume (data survives)
docker compose up -d         # start again later — fast, no rebuild
docker compose up --build -d # rebuild after you change code
```

## Resetting the database (wipes all data)

```powershell
docker compose down -v   # -v also deletes the mysql_data volume
docker compose up --build -d
```

## Sharing this with a friend

Your friend needs Docker Desktop installed — nothing else (no Node, PHP, MySQL, or Python setup).

1. **You**: push the repo to GitHub/GitLab (`.env` is gitignored, so secrets never get committed —
   `.env.example` ships instead as the template).
2. **Your friend**:
   ```powershell
   git clone https://github.com/dravenkai/Medical-Management-Project.git
   cd Medical-Management-Project
   Copy-Item .env.example .env
   notepad .env   # fill in their own values (or you can share the real .env with them privately/securely — never via git)
   docker compose up --build -d
   ```
   That's the "single command" (well, one `git clone` + one `docker compose up --build -d`) — it builds all
   4 custom images, pulls MySQL, wires up networking, and seeds the database identically on their machine.
   No "works on my machine" drift, since none of the app runtimes (Node, PHP, Python, MySQL) are installed
   on the host at all — they only exist inside the containers, pinned to the versions in each Dockerfile.

## Notes / gotchas
- `NEXT_PUBLIC_*` and `VITE_*` variables are baked into the browser bundle at **build time**, not read at
  container start — if you change one in `.env`, you must `docker compose up --build` (not just restart) for
  it to take effect.
- The bot needs a real `BOT_TOKEN` from [@BotFather](https://t.me/BotFather) to start successfully; without
  one it will crash-loop (harmless — the other 4 services are unaffected). Same `BOT_API_SECRET` value is
  wired into both `azuremed-hub` and `bot` automatically.
- MySQL root password/user is shared dev-only convenience across both apps' databases — fine behind the
  internal Docker network, don't reuse it anywhere public-facing.
