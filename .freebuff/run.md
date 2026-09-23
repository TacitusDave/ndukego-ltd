# Run doc — NHGP (Ndukego Homes Gallery Project)

This workspace IS the main checkout (no separate worktree/env copying needed).
Monorepo: pnpm workspaces + Turborepo. Apps: `apps/web` (:3000, Next.js 16),
`apps/admin` (:3001, Next.js), `apps/api` (:4000, NestJS + Prisma/Neon Postgres).

## 1. Reproduce the artifacts

1. Install dependencies (pnpm is the enforced package manager, Node >= 22):
   ```bash
   pnpm install
   ```
2. Environment: `apps/api/.env` already exists in this checkout and holds
   `DATABASE_URL`, JWT secrets, and super-admin config. Never commit or paste
   its values; if a fresh checkout is missing it, copy it from the main
   checkout at `C:\Users\david\Desktop\Projects\Ndukego Homes Gallery Project\apps\api\.env`.
   `apps/web` needs no .env for local dev (defaults to `http://localhost:4000/api/v1`).
3. Database (already migrated/seeded on Neon — only needed for a fresh DB):
   ```bash
   pnpm --filter database db:push   # or: npx prisma db push from packages/database
   pnpm --filter database db:seed
   ```
4. Optional email testing: export `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS`
   before starting the API (Gmail App Password). Without them, emails log to
   the API console instead of sending — the app still works.
   `ADMIN_NOTIFICATION_EMAIL` defaults to the company Gmail inbox.

## 2. Run the servers

Production check (what CI validates):
```bash
pnpm --filter web build && pnpm --filter api build
```

Dev servers (detached on Windows — Start-Process with -PassThru, stdout and
stderr redirected to DIFFERENT files):
```powershell
# API on :4000
powershell -NoProfile -Command "(Start-Process -FilePath 'pnpm.cmd' -ArgumentList '--filter','api','dev' -RedirectStandardOutput '.freebuff\api.log' -RedirectStandardError '.freebuff\api.err.log' -WindowStyle Hidden -PassThru).Id"
# Web on :3000 (the preview port)
powershell -NoProfile -Command "(Start-Process -FilePath 'pnpm.cmd' -ArgumentList '--filter','web','dev' -RedirectStandardOutput '.freebuff\web.log' -RedirectStandardError '.freebuff\web.err.log' -WindowStyle Hidden -PassThru).Id"
# Admin on :3001 (optional)
powershell -NoProfile -Command "(Start-Process -FilePath 'pnpm.cmd' -ArgumentList '--filter','admin','dev' -RedirectStandardOutput '.freebuff\admin.log' -RedirectStandardError '.freebuff\admin.err.log' -WindowStyle Hidden -PassThru).Id"
```

Notes learned the hard way:
- Next 16 allows only ONE dev server per app directory (`next dev` exits with
  "Another next dev server is already running" otherwise) — you cannot run a
  second web instance on :3100 from the same folder.
- `pnpm --filter web dev` spawns pnpm → node; kill via the port's PID:
  `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`.
- Health checks: `curl http://localhost:3000/` (web, expect 200),
  `curl http://localhost:4000/api/v1/estates/public?limit=1` (API + DB, expect 200).
