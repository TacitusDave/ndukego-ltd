# NHGP — Build Progress & Master Todo List

_Updated: 2026-08-28 | Session 25_

> This file is the single source of truth for what's done, what's in progress, and what
> remains until 100% production-ready. Read it at the start of every session.

---

## Project Vision (from spec)

Build Nigeria's most trusted, transparent, and professional real estate operations platform
for Ndukego Investment & Properties Limited. Three portals: Public Website (customers +
visitors), Admin Portal (staff), API (backend). Eventually: Executive Dashboard, AI
Assistant, Mobile App.

**Brand promise:** Trust · Transparency · Professionalism
**Design feel:** Clean enterprise SaaS (Linear / Stripe Dashboard energy) — not flashy

---

## PHASE 1 — Foundation (MVP) `⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ ~100% done`

Target: Live and usable by company staff and customers.

### 1A. Infrastructure & Foundation ✅ COMPLETE

- [x] Turborepo monorepo — web :3000, admin :3001, api :4000
- [x] Prisma schema — full domain model for all 13 business capabilities
- [x] Database migration — applied to Neon PostgreSQL
- [x] Database seed — 46 permissions, 10 system roles, 8 departments, super-admin user
- [x] Shared packages — `@nhgp/lib`, `@nhgp/types`, `@nhgp/config`, `@nhgp/validation`, `@nhgp/database`
- [x] `@nhgp/assets` — brand logo components using real PNG files (logo.png, logo-icon.png, logo-xicon.png)

### 1B. API — NestJS backend :4000 ✅ COMPLETE (Phase 1 scope)

- [x] AuthModule — JWT login, refresh, logout, RBAC guards, `@Public()` decorator
- [x] AuditModule — immutable audit log service
- [x] StorageModule — local file storage, static `/uploads` serving
- [x] HealthController — `GET /health`
- [x] PropertyModule — full CRUD, media upload, status transitions
  - [x] Public endpoints: `GET /properties/public`, `GET /properties/public/:id`
  - [x] Inquiry endpoint: `POST /properties/public/inquiry`
  - [x] Inquiry email confirmation wired
- [x] EstateModule — full CRUD + `GET /estates/public`
- [x] CompanyModule — company info + branch management
- [x] DashboardModule — `GET /dashboard/stats` (8 stat tiles)
- [x] CustomerModule — paginated list, create, get, update, deactivate, activate, soft-delete
- [x] Inquiry model — dedicated `inquiries` table, all form submissions captured
- [x] EmailModule — Nodemailer, graceful SMTP degradation, welcome/reservation/inquiry emails
- [x] Auth — customer register/login/profile endpoints
- [x] ReservationModule — public POST, admin list/detail, status machine, email on transitions
- [x] FavoritesModule — toggle, status check
- [x] Customer profile update — PATCH endpoint
- [x] Super admin TOTP login — `POST /auth/super/login`, reads `SUPER_ADMIN_TOTP_SECRET` env var
- [ ] **MISSING: UNDER_NEGOTIATION reservation status** — spec defines it; not yet in transitions

### 1C. Admin Portal — Next.js, :3001 ✅ COMPLETE (Phase 1 scope)

- [x] Auth — login page, JWT cookies, route guard, deactivated-account error message
- [x] **Super admin TOTP login** — `/super` hidden page; two invisible entry points on login page
- [x] Dashboard — 8 stat tiles, recent properties, status breakdown, activity feed
- [x] Properties — list, create, detail/edit, status transitions, photo upload + gallery
- [x] Estates — list, create, detail (phases, blocks, infrastructure, site plan, building types)
- [x] Customers — list, create, detail (with reservation + sales activity tables)
- [x] Reservations — list (search + status filter), detail/manage (status update + notes + sale conversion)
- [x] Sales — `/sales` list + `/sales/:id` detail (financials, payment history, full status transitions)
- [x] Employees — list, create, detail, role assignment, deactivate/delete
- [x] Inquiries — list (search + status filter), inline status update (NEW→CONTACTED→CONVERTED→CLOSED)
- [x] Staff password change — `/settings/password` with strength meter
- [x] Company settings — `/settings` (company info, branches, contacts)
- [x] Mobile responsive — slide-in drawer sidebar, hamburger menu
- [x] Design system — always-dark sidebar, crimson accents, Fraunces/DM Sans, light-only forced theme

### 1D. Public Website — Next.js, :3000 ✅ COMPLETE (Phase 1 scope)

- [x] Light-only theme, global morphing crimson gradient + grid overlay, 3px crimson scrollbar
- [x] Navbar — centered logo, hamburger dropdown with all nav + CTA
- [x] Footer — crimson CTA band + 4-col section (live estate data) + dark bottom bar
- [x] Homepage — hero, 4 service cards, featured properties, process steps, trust section
- [x] Properties listing `/properties` — sticky filters (search + category + state), grid, map view
- [x] Property detail `/properties/:id`
  - [x] **Gallery redesigned** — Airbnb-style grid (desktop: cover 2/3 + 2 stacked thumbnails), mobile swipeable + dot indicators, full lightbox (arrows + thumbnail strip + keyboard + swipe)
  - [x] Specs, description, amenities, map embed
  - [x] **"Speak to an Agent"** — in left column below metadata; no photo; phone +234 903 550 5663; Call + Enquiry CTAs
  - [x] Reserve button + inquiry form sidebar
- [x] Estates page `/estates`
- [x] About page `/about` — story, values, leadership (3 exec cards), team section
  - [x] Executive titles: CEO & Executive Director · Executive Director & Head of Digital Operations · Executive Director
- [x] Contact page `/contact` — Google Maps embed, real contacts, inquiry form
- [x] Services pages — Real Estate, LPO Financing, Investment Financing, Consultancy
- [x] **Projects page** — live data from `/estates/public` (real estate names, status, location, plots)
- [x] **Insights page** — working category filters (client component), article cards link to contact
- [x] Customer auth — `/login`, `/register`
- [x] Customer account — dashboard, reservations, favorites, profile edit
- [x] Terms of Service `/terms`, Privacy Policy `/privacy`
- [x] Vercel Speed Insights wired
- [x] Instagram link: https://www.instagram.com/ndukego.ltd
- [ ] **BUG-01:** React `key` prop warning — some list on homepage (low priority)

### 1E. Phase 1 Final Checklist (before maximum live use)

- [x] Domain connected — ndukegoltd.com
- [x] API deployed — Railway
- [x] Web + Admin deployed — Vercel
- [x] Super admin TOTP configured — `SUPER_ADMIN_TOTP_SECRET` set in Railway
- [ ] **SMTP env vars** — add to Railway API env to enable real email sending (currently logs to console)
- [ ] **Change super admin password** — currently `ChangeMeNow123!` in DB seed
- [x] **Real company data** — estates, property listings with photos, staff accounts created ✅
- [x] **Cookie consent banner** — NDPA-compliant, localStorage persistence, Accept/Essential/Learn more ✅
- [ ] End-to-end test: visitor → property → inquiry → email confirmation
- [ ] End-to-end test: visitor → reserve → email → admin confirms → customer gets update
- [ ] Mobile device testing (iOS Safari, Android Chrome)

---

## PHASE 2 — Business Operations `⬛⬛⬛⬜⬜⬜⬜⬜⬜⬜ ~35% done`

> Note: Several Phase 2 items were built ahead of schedule during Phase 1 sessions.
> The items below reflect what is genuinely still outstanding.

### 2A. Employee & Workforce Management ✅ MOSTLY COMPLETE

- [x] Admin: Employee list, create, edit, deactivate, delete
- [x] Admin: Role assignment to employees
- [x] Admin: Employee profile page (personal info, role, department)
- [x] Admin: Staff password change
- [ ] Admin: Department management UI (schema + data exists, no admin page to manage departments)
- [ ] Public: Staff login display uses Employee name/role

### 2B. Document & Records Management ✅ CORE COMPLETE (session 20)

- [x] API: `POST /documents/upload` — multer multipart, 20MB limit, PDF/Word/Excel/image
- [x] API: `GET /documents` — paginated list, filter by category/status/entityType/entityId
- [x] API: `GET /documents/:id` — full detail + version history + access logs
- [x] API: `GET /documents/:id/download` — stream file with correct Content-Disposition
- [x] API: `PATCH /documents/:id/status` — approval workflow (UPLOADED→VERIFIED→APPROVED→PUBLISHED→ARCHIVED)
- [x] API: `DELETE /documents/:id` — soft delete with audit log
- [x] Document versioning — v1 created on upload, schema supports further versions
- [x] Document categories and classification (12 categories, 44 document types)
- [x] Admin: Documents list page with search + category/status/entity filters
- [x] Admin: Upload page — file picker, all metadata fields, direct FormData POST via proxy
- [x] Admin: Document detail page — metadata, version history, approval action buttons
- [x] Admin: Status transition buttons (Verify / Approve / Reject / Publish / Archive)
- [x] Storage: Local filesystem (StorageService), interface ready to swap to R2/S3 via env `STORAGE_PROVIDER`
- [ ] Customer portal: Approved documents visible to relevant customer
- [ ] Admin: Document list filtered per property/estate/customer detail pages (links to /documents?entityId=…)

### 2C. Inspection & Site Visit Management ✅ CORE COMPLETE (session 21)

- [x] API: `POST /inspections` — schedule, `VALID_TRANSITIONS` state machine
- [x] API: `GET /inspections` — paginated list, filter by status/type/inspector/property/search
- [x] API: `GET /inspections/:id` — full detail with property/inspector/customer relations
- [x] API: `PATCH /inspections/:id/start` — SCHEDULED → IN_PROGRESS
- [x] API: `PATCH /inspections/:id/complete` — IN_PROGRESS → COMPLETED (recommendation + score + summary)
- [x] API: `PATCH /inspections/:id/cancel` — cancel with reason
- [x] API: `PATCH /inspections/:id/fail` — mark failed with reason
- [x] Admin: Inspections list page — paginated table, status/type/search filters
- [x] Admin: Schedule inspection form — property ID, inspector ID, optional customer, type, datetime, notes
- [x] Admin: Inspection detail page — timeline, property/inspector/customer cards, outcome section, action buttons (Start / Complete / Fail / Cancel)
- [ ] Customer: Book a site visit request from property detail page
- [ ] Admin: Inspection report photo upload

### 2D. Sales Tracking & Full Reservation Lifecycle ✅ MOSTLY COMPLETE

- [x] Admin: Convert reservation → Sale record
- [x] Sale model: sale date, agreed price, payment terms, discount
- [x] Admin: Sale list page + detail page (full status transitions)
- [x] Admin: Reservation timeline view — full status-change history with timestamps, actor, notes (session 21)
- [ ] Extend reservation statuses: UNDER_NEGOTIATION, UNDER_CONTRACT

### 2E. Financial Recording ✅ CORE COMPLETE (session 21)

- [x] API: `POST /payments` — record payment, updates Sale.totalPaid/balanceDue in transaction
- [x] API: `GET /payments` — list with filters (saleId, customerId, status)
- [x] API: `GET /payments/:id` — full detail with sale + customer + employee relations
- [x] API: `PATCH /payments/:id/verify` — verify payment, sets verifiedAt
- [x] API: `PATCH /payments/:id/reject` — reject + reverse Sale totals in transaction
- [x] Admin: Record payment inline on Sale detail page (amount, type, method, date, reference, bank, notes)
- [x] Admin: Verify / Reject buttons on pending payments
- [x] Admin: Payment status badges (Pending / Verified / Rejected)
- [ ] Admin: Generate receipt PDF (printable / downloadable)
- [ ] Admin: Payment history per customer (cross-sale view)
- [ ] Note: NO online payment processing — all payments physical at company office

### 2F. CRM — Inquiry & Lead Management ✅ MOSTLY COMPLETE

- [x] Admin: Inquiry list with search + status filter
- [x] Admin: Inquiry status tracking (NEW → CONTACTED → CONVERTED → CLOSED)
- [x] Admin: Staff notes on inquiries — inline expandable panel, amber indicator, saved per-inquiry (session 21)
- [x] Admin: Formal inquiry → Reservation pipeline — "Reserve" button converts inquiry to reservation, creates customer record if needed (session 22)
- [ ] Admin: Customer communication history (all interactions per customer in one view)

### 2G. Notifications ✅ PARTIAL

- [x] Email: Reservation confirmation → customer
- [x] Email: Reservation status update → customer
- [x] Email: Inquiry confirmation → customer
- [ ] In-app notifications for staff (new reservation, new inquiry, document uploaded)
- [ ] Email: New inquiry received → notify assigned sales agent
- [ ] Email: Document approved → notify customer
- [ ] Email: Appointment/site visit confirmed → notify customer
- [ ] SMS notifications (future — Termii for Nigeria)

### 2H. Company & Platform Settings ✅ MOSTLY COMPLETE

- [x] Admin: Company settings page (name, contact info, social links)
- [x] Admin: Branch management UI — inline edit + soft-delete (session 21)
- [x] Admin: Department management UI — full CRUD with employee count guard on delete (session 21)
- [ ] Admin: System configuration (reservation expiry days, currencies)

---

## PHASE 3 — Business Intelligence `⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% done`

Build after Phase 2 is stable.

### 3A. Executive Dashboard

- [ ] KPI overview: total properties, active reservations, sales this month/year, leads
- [ ] Revenue trend chart (monthly/quarterly)
- [ ] Inventory utilization: Published vs Reserved vs Sold
- [ ] Estate/Development progress overview
- [ ] Top-performing sales staff
- [ ] Customer acquisition funnel
- [ ] Configurable date ranges

### 3B. Advanced Reporting

- [ ] Property performance report (views, favorites, inquiries, reservations per property)
- [ ] Sales performance report (per staff, per period)
- [ ] Customer lifecycle report
- [ ] Payment status report (outstanding, received, overdue)
- [ ] Export to PDF / Excel

### 3C. AI & Knowledge Services

- [ ] AI Knowledge Base — import property data, company FAQs
- [ ] Customer assistant — answer questions about properties, estates, pricing
- [ ] Employee assistant — help draft communications, summarize customer history
- [ ] Property recommendations — suggest suitable properties based on inquiry history
- [ ] Auto-generate marketing descriptions from property attributes
- [ ] Flag incomplete listings before publication
- [ ] **Rule: AI may recommend/assist but never execute irreversible actions without human approval**
- [ ] Integration: Claude API (preferred) or OpenAI

---

## PHASE 4 — Growth & Expansion `⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% done`

Build after Phase 3 demonstrates ROI.

- [ ] Mobile applications (iOS + Android) — React Native, reusing the existing API
- [ ] GIS / Interactive Map — search properties on a full map, draw plot boundaries
- [ ] Smart estate integrations — construction progress updates, sensor data
- [ ] Government API integrations — title verification, planning approvals
- [ ] Partner/Vendor portal — contractors, surveyors, legal advisors
- [ ] Multi-company support — subsidiaries or related businesses
- [ ] Predictive analytics — AI-driven market forecasting and demand prediction

---

## PRODUCTION DEPLOYMENT CHECKLIST `⬛⬛⬛⬜⬜⬜⬜⬜⬜⬜ ~35% done`

### Infrastructure

- [x] **Domain name** — ndukegoltd.com registered and connected
- [x] **API hosting** — Railway (auto-deploys from GitHub main branch)
- [x] **Web + Admin hosting** — Vercel (auto-deploys from GitHub main branch)
- [x] **Database** — Neon PostgreSQL, migrated, seeded
- [ ] **File storage** — migrate from local filesystem to Cloudflare R2 / AWS S3 (needed for production media reliability)
- [ ] **Email SMTP** — configure Resend/SendGrid/Gmail App Password in Railway env

### Environment Variables

- [x] `DATABASE_URL` — Neon connection string set in Railway
- [x] `JWT_SECRET` / `JWT_REFRESH_SECRET` — set in Railway
- [x] `SUPER_ADMIN_TOTP_SECRET` — set in Railway (`IBVSDUVB5OHXQLWO5AD6`)
- [x] `NEXT_PUBLIC_API_URL` — set in Vercel (both web + admin)
- [ ] `SUPER_ADMIN_PASSWORD` — change from seed default `ChangeMeNow123!`
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — not yet set
- [ ] `WEB_URL` — set to https://ndukegoltd.com in Railway
- [ ] `NEXT_PUBLIC_API_BASE` — confirm set to Railway API URL in Vercel

### Security Hardening

- [x] HTTPS enforced — Vercel handles automatically
- [x] Super admin 2FA — TOTP via Google Authenticator
- [ ] Rate limiting on API auth endpoints (prevent brute force)
- [ ] CORS configuration — restrict to ndukegoltd.com and admin subdomain only
- [ ] Input sanitization audit — review all public API endpoints
- [ ] Remove all `console.log` debug statements from production API

### Data & Legal

- [x] Terms of Service page `/terms`
- [x] Privacy Policy page `/privacy`
- [x] About page — real company description, leadership titles
- [x] Contact info — real phone, email, address in footer + contact page
- [ ] **Real company data** — estate records, property listings with photos, staff accounts (user task)
- [ ] **Cookie consent banner** — required for NDPA compliance

### Testing Before Launch

- [ ] Full end-to-end flow: browse → reserve → receive email
- [ ] Full admin flow: create property → publish → manage reservation → convert to sale
- [ ] Test on mobile (iOS Safari + Android Chrome)
- [ ] Test on slow 3G connection
- [ ] Security scan (exposed .env, open admin routes, etc.)

### Go-Live Steps (remaining)

1. [x] Deploy API to Railway ✅
2. [x] Deploy web + admin to Vercel ✅
3. [x] Connect ndukegoltd.com domain ✅
4. [ ] Set SMTP env vars in Railway
5. [ ] Set `WEB_URL` + `NEXT_PUBLIC_API_BASE` in Railway/Vercel
6. [ ] Change super admin password
7. [ ] Create real staff accounts (not seeded test data)
8. [ ] Enter real estate + property data with photos
9. [ ] Run all end-to-end tests on live domain
10. [ ] Add cookie consent banner
11. [ ] Announce to company

---

## What's Stubbed (schema exists, no UI yet)

| Model | Schema | API | Admin UI | Customer UI |
|---|---|---|---|---|
| Employee | ✅ | ✅ | ✅ | n/a |
| Inspection | ✅ | ✅ | ✅ | Request only |
| Appointment | ✅ | ❌ | ❌ | ❌ |
| Document | ✅ | ✅ | ✅ | ❌ |
| Sale | ✅ | ✅ | ✅ | n/a |
| Payment | ✅ | ✅ | ✅ (on Sale page) | ❌ |
| PropertyFavorite | ✅ | ✅ | n/a | ✅ |
| Notification | ✅ | ❌ | ❌ | ❌ |
| AuditLog | ✅ | Partial | View only | n/a |

---

## Known Issues / Bugs

| ID | Location | Description | Priority |
|---|---|---|---|
| BUG-01 | apps/web | React `key` prop warning — some list on homepage | Low |
| ~~BUG-02~~ | ~~apps/api~~ | ~~Inquiry submission doesn't send confirmation email~~ | ~~FIXED~~ |
| ~~BUG-03~~ | ~~apps/web~~ | ~~Favorites — customer can view saved properties but cannot add/remove~~ | ~~FIXED~~ |
| ~~BUG-04~~ | ~~apps/web~~ | ~~Profile page is read-only — no edit form~~ | ~~FIXED~~ |
| ~~BUG-05~~ | ~~apps/api~~ | ~~Inquiry submission returns 500 — raw SQL used wrong column names for unmapped Prisma fields; fixed by switching to prisma.inquiry.create()~~ | ~~FIXED~~ |
| ~~BUG-06~~ | ~~Railway~~ | ~~Inspection routes 404 on Railway — Turbo build cache caused Railway to deploy stale NestJS dist without inspection module; fixed by bypassing Turbo in railway.toml buildCommand (explicit per-package pnpm builds)~~ | ~~FIXED~~ |

---

## Session Log

| Session | Date | What was built |
|---|---|---|
| 1 | 2026-07-27 | Prisma schema, DB migration, seed, AuthModule, shared packages |
| 2 | 2026-07-27 | PropertyModule, EstateModule, CompanyModule, DashboardModule, StorageModule |
| 3 | 2026-07-27 | Admin portal — auth, dashboard, properties, estates, customers |
| 4 | 2026-07-27 | Public website — homepage, properties, property detail, inquiry, estates, about, contact |
| 5 | 2026-07-27 | @nhgp/assets logo (real PNGs), EmailModule, Customer auth, ReservationModule, Admin reservations, Customer account section |
| 6 | 2026-07-27 | Favorites API + toggle button, Profile editing, Employee management (API + admin UI), Inquiries page, Terms & Privacy pages, logo fix, inquiry email wired |
| 7 | 2026-07-27 | Branding fix (Ndukego Homes Gallery everywhere), design system (dark theme #050505 + crimson #C1121F), font system (Fraunces/DM Sans/JetBrains Mono) |
| 8 | 2026-07-27 | Theme toggle (light/dark/system) on web + admin, CSS variable token system, ThemeProvider + ThemeToggle components, Company settings page built |
| 9 | 2026-07-27 | Admin sidebar CSS variable tokens (light/dark), Staff password change page, Reports page (stats + pipeline + geographic breakdown), Documents placeholder, About page built, dark-mode badge fixes across all pages, property/estates/properties page theme fixes |
| 10 | 2026-07-30 | API crash fix (employee.service.ts calculatePagination), web login/register logo fix, company identity realignment (Ndukego Investment & Properties Ltd), premium navbar rebuild (glassmorphism + corporate links + Services dropdown), corporate footer rebuild (4-col, correct contacts), homepage rebuild (premium dark hero + Framer Motion + 4 service cards + process steps + trust section), framer-motion + @react-three/fiber + drei + three installed |
| 10b | 2026-07-30 | Full light-theme overhaul of public web: removed dark mode entirely (forcedTheme="light"), global morphing crimson gradient (position:fixed, gradient-morph 24s keyframe), global 60px grid overlay, 3px thin crimson scrollbar, navbar centered-logo+hamburger redesign, footer crimson CTA band + 4-col section, homepage all sections converted to transparent/semi-transparent backgrounds |
| 11 | 2026-07-30 | Admin portal redesign: globals.css (light-only, always-dark sidebar tokens, crimson scrollbar), ThemeProvider (forcedTheme="light"), sidebar (premium dark, grouped nav, correct branding, crimson active states), header (ThemeToggle removed, clean minimal), login (split-screen dark brand panel + white form), metadata title updated; all 7 web service/project/insight pages created with AnimateIn, full content, crimson design system |
| 12 | 2026-07-30 | Hard delete for properties + estates; Estate badge on property cards; Per-estate site plan management (upload + building type editor); API proxy route; Contact page rebuild (Maps embed + real contacts); FooterCtaBand extracted as client component; Prisma schema + db push for buildingTypesConfig |
| 13 | 2026-07-31 | Amenities toggle system (Property + Estate, 30+ items, emoji grid on web); Sales agent card on property detail; Per-property/estate Google Maps URL field; Properties listing Map View (Leaflet + OpenStreetMap, red pins); Schema updated (amenities + mapUrl), db push completed |
| 14 | 2026-08-01 | Inquiries fix (dedicated Inquiry model + raw SQL); Employee/Customer deactivate + delete (soft-delete + User sync); Login deactivated-account message; Estate section redesign |
| 15 | 2026-08-01 | Admin Sales pages: /sales list + /sales/:id detail (financials, payment history, full status transitions) |
| 16 | 2026-08-02 | Inquiry status updates (PATCH + inline dropdown + status filter); Dashboard 8 stat tiles; Reservation→Sale conversion form; Customer detail activity tables; Web state filter fixed |
| 17 | 2026-08-03 | Production build prep — fixed all build errors: Admin mobile responsive (Shell client + drawer sidebar); Investments→Investment rename; Featured estate cards fix; Footer live estate data; Admin ThemeProvider removed; Delete UX loading overlay; Dashboard stats crash fix; Favicon set; packages/assets tsconfig fix; pnpm build PASSES CLEAN |
| 18 | 2026-08-13 | Super admin TOTP auth (/super login page + env var secret + hidden entry points); Web login URL fixed (localhost → Vercel); Co-Authored-By removed from all 44 commits; Instagram link set; About page rewrite (Leadership + Team sections, executive property-card style, social slots); Speed Insights wired; Projects page rebuilt with live API estate data; Insights category filters fixed (client component); Article card links fixed |
| 19 | 2026-08-14 | Property gallery redesigned — Airbnb-style grid (desktop: cover 2/3 + 2 stacked), mobile swipeable + dot indicators, full lightbox (arrows + thumbnail strip + keyboard + swipe + blur backdrop); "Speak to an Agent" section redesigned (no photo, left column under metadata, +234 903 550 5663, Call + Enquiry CTAs); Gallery ring/scale fixes; About executive titles updated (CEO & Executive Director · Executive Director & Head of Digital Operations · Executive Director); README fully rewritten with logo + badges + documentation |
| 20 | 2026-08-14 | Cookie consent banner (NDPA-compliant, localStorage, Accept/Essential/Learn more); Document management system — full API (upload/list/find/download/status-change/soft-delete, 44 document types, audit + version history); Admin documents list page (search + filters); Admin upload form (file picker + all metadata fields); Admin document detail page (approval workflow, status actions, version history) |
| 21 | 2026-08-14 | Payment recording system — full API (record/verify/reject with transaction-safe Sale balance updates); Admin inline payment form on Sale detail; Inspection management system — full API with VALID_TRANSITIONS state machine (schedule/start/complete/fail/cancel); Admin inspections list, schedule form, detail page with action buttons; Railway auto-deploy reconnected to renamed GitHub repo; Staff notes on inquiries (inline expandable panel + PATCH API); Branch edit/delete + Department management (CRUD + employee count guard); Reservation status timeline (vertical audit history with actor + status transition badges) |
| 22 | 2026-08-14 | Inquiry → Reservation one-click pipeline — "Reserve" button on inquiry row, API converts inquiry to PENDING reservation (auto-creates customer if new), returns reservation number + link |
| 23 | 2026-08-14 | Fix inquiry form 500 error — replaced raw SQL INSERT with prisma.inquiry.create() to fix column name mismatch for unmapped camelCase Prisma fields |
| 24 | 2026-08-14 | Fix inspection routes 404 on Railway — Turbo cache was serving stale NestJS dist without inspection module despite code being correct; changed railway.toml buildCommand to bypass Turbo entirely (explicit per-package pnpm builds ensure fresh nest build every deploy) |
| 25 | 2026-08-28 | Fix site plan manager image upload + save-then-logout bugs — root cause was 15min access_token cookie maxAge matching JWT expiry; extended cookie lifetime to 7 days, added 401-refresh-retry to all server actions (authPost/authPatch/authDelete) and the proxy route (including multipart/form-data retry); fixed handleImageUpload try/finally so button always re-enables; RBAC sidebar filtering + employee/customer page action guards built (permissions context, canSeeSection, isSuperAdminOrExecutive); Removed hardcoded PROTOTYPES from estate site plan; RBAC extended to all remaining admin pages: property create/status/delete, estate create, reservation confirm/cancel/convert-to-sale, inspection schedule/start/complete/fail/cancel, sale status/payment-record/payment-verify |
