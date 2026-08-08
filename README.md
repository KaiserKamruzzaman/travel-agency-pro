# Wanderlust Travel — Sales Tracker (Phase 1)

Travel agency sales tracking system. This is Phase 1 only: database schema,
role-based authentication (owner vs. employee), and manual sale entry with
basic CRUD. See `travel-agency-sales-tracker-requirements.md` for the full
product spec and later phases.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma ORM
- NextAuth.js (Auth.js v5) — credentials login, JWT sessions

## Setup

1. Start Postgres and point `DATABASE_URL` at it (see `.env.example`).
2. Install dependencies and apply the schema:

   ```bash
   npm install
   npx prisma migrate dev
   npm run db:seed
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000 and log in with a seeded account:

   | Role     | Email                    | Password      |
   | -------- | ------------------------ | -------------- |
   | Owner    | owner@wanderlust.test    | owner123       |
   | Employee | alice@wanderlust.test    | employee123    |
   | Employee | bob@wanderlust.test      | employee123    |

## What's implemented

- **Schema** (`prisma/schema.prisma`): `Organization` → `Branch` →
  `User` (owner/employee) → `Sale`, with `organizationId` on every core
  table for future multi-tenancy, soft sale statuses
  (issued/cancelled/refunded/void) instead of hard deletes, and
  created-by/updated-by audit fields on every sale.
- **Auth**: credentials login (`src/auth.ts`), password hashing via
  bcrypt, JWT sessions carrying `role`/`organizationId`/`branchId`.
  Route protection in `src/proxy.ts` (Next's middleware, renamed per the
  16.x convention); `src/auth.config.ts` is split out edge-safe so
  Prisma/bcrypt never get bundled into the Edge runtime.
- **Authorization** (`src/lib/authz.ts`): every `/api/sales*` route
  re-derives scope from the session server-side — employees only ever
  see/mutate their own sales, owners see the whole organization
  read-only. Verified directly against the API (not just hidden UI) —
  cross-employee reads/writes 404, unauthenticated requests 401.
- **Sale CRUD**: manual entry form (`src/components/sale-form.tsx`) with
  the required fields enforced (passenger name, route, sale price, sale
  date), sales list (`/sales`), edit page, and void (soft delete).

## Explicitly not built yet (later phases)

Owner dashboard/drill-down, reporting engine, exports, and the
PDF/LLM-assisted entry path are out of scope for this pass — see the
requirements doc's Phase 2–4 breakdown.

## Useful scripts

- `npm run db:migrate` — create/apply a Prisma migration
- `npm run db:seed` — reset seed data (organization, branches, users, sample sales)
- `npm run db:studio` — Prisma Studio to browse the database
