# NHGP — Setup Checklist

This file tracks everything the user needs to configure, obtain, or set up outside of the code.
Claude updates this whenever a new external dependency is needed.

_Last updated: 2026-07-30_

---

## Done ✅

- [x] **Database (Neon PostgreSQL)** — connected, schema migrated, seed run
  - Schema: `neondb` on `ep-lingering-bird-ayo6c799.c-5.us-east-2.aws.neon.tech`
  - Initial migration applied: `20260727103235_initial_schema`
  - Seed applied: 46 permissions, 10 roles, 8 departments, super-admin user created
  - Credentials stored in `apps/api/.env` and `packages/database/.env`

---

## Action required after Session 13 ⚠️

### Restart the API server

New columns were added to both `properties` and `estates` tables (`amenities`, `map_url`) and
pushed to Neon. The Prisma client was regenerated automatically during `pnpm install`.
**Restart the API server** so the new fields are active:

```bash
# In the api terminal, Ctrl+C to stop, then:
pnpm --filter @nhgp/api dev
```

---

## Pending — Action required by you ⚠️

### Environment files (done, but review)

Two `.env` files were created — **do not commit them to git**:

**`apps/api/.env`** — main API config. Review and change:
- `SUPER_ADMIN_PASSWORD=ChangeMeNow123!` — change this to something strong and private
- JWT secrets are randomly generated and stored in this file

**`packages/database/.env`** — used only for `prisma migrate` and `prisma seed`. Contains same DB URL.

### Super admin account

A super admin account was created during seed:
- **Email:** `admin@ndukego.com`
- **Password:** `ChangeMeNow123!`

**Change this password immediately** when the admin portal has a login page, or update it directly in the DB now.

---

## Coming up — will need these soon

### Email provider — SMTP (Phase 1 — now built, add these to `apps/api/.env`)

Email notifications are wired and working. The system will log emails to the console in
development if SMTP is not configured — the app won't crash without it.

Add these to `apps/api/.env` when you're ready to send real emails:

```env
SMTP_HOST=smtp.gmail.com          # or smtp.resend.com, smtp.sendgrid.net, etc.
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
SMTP_FROM=Ndukego Homes <no-reply@ndukegohomes.com>
WEB_URL=http://localhost:3000     # change to your public URL in production
ADMIN_NOTIFICATION_EMAIL=ndukegoinvest.propertiesltd@gmail.com   # optional — this is the default
```

> **Admin alerts:** every inquiry or reservation submitted on the public site is both stored
> in the admin portal (Inquiries / Reservations pages) and emailed to
> `ADMIN_NOTIFICATION_EMAIL` (default `ndukegoinvest.propertiesltd@gmail.com`).
> Real delivery requires the SMTP variables above to be set (Gmail needs an App Password).

**Recommended providers:**
- **Resend** (resend.com) — easiest, has a free tier. Use SMTP relay at `smtp.resend.com:587`
- **Gmail** with an App Password — works for low volume; enable 2FA then create an App Password
- **SendGrid** — enterprise-grade, generous free tier

When SMTP is not set, all email sends are logged to the API console with `[EMAIL STUB]` prefix.

### Hosting (needed before going live)

Recommended setup:
- **API:** Railway.app or Render.com — deploy from GitHub, automatic deploys
- **Admin & Web:** Vercel — connects to GitHub, deploys automatically
- **Database:** Already on Neon — nothing to change

When you're ready to deploy, Claude will create the deployment config files and walk you through the setup.

### Domain name

- Register your domain (e.g. `ndukegohomes.com` or `ndukegoproperties.com`) at Namecheap or GoDaddy
- Point it to Vercel (for the public site) and your API host
- No action needed from Claude for this

### File storage (needed when document upload is built — Phase 2)

Currently using local filesystem storage — fine for development. For production:
- **Recommended:** Cloudflare R2 (S3-compatible, cheaper than AWS S3, no egress fees)
- OR: AWS S3 if you already have an AWS account
- Claude will add the S3 config to `.env` when document management is built:
  ```
  STORAGE_PROVIDER=s3
  STORAGE_S3_BUCKET=nhgp-documents
  STORAGE_S3_REGION=auto
  STORAGE_S3_ACCESS_KEY=...
  STORAGE_S3_SECRET_KEY=...
  STORAGE_S3_ENDPOINT=https://...r2.cloudflarestorage.com
  ```

### Real property data

Before demo'ing to the company:
- At least 1 estate record created in the admin portal
- At least 3–5 property listings with photos
- Staff accounts set up (names + emails for Sales, Property Manager, Admin roles)

---

## Reference: how to start the API locally

```bash
cd apps/api
pnpm run dev       # starts with file-watching on port 4000
```

API will be at: `http://localhost:4000/api/v1`

Health check: `GET http://localhost:4000/api/v1/health`

## Reference: how to run DB migrations

```bash
cd packages/database
pnpm exec prisma migrate dev --name "describe_your_change"
```

## Reference: how to re-run the seed

```bash
cd packages/database
pnpm exec tsx prisma/seed.ts
```
