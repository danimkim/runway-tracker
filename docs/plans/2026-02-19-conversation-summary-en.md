# Smart Money Tracker - Conversation Summary

Date: 2026-02-19

---

## Project Goal

Build a personal finance dashboard that automatically captures spending from a Toss Bank debit card and visualizes daily, weekly, and monthly total expenses. The user prefers React, TypeScript, and Next.js for the frontend; all other tech choices were recommended based on the app's requirements.

---

## Key Decisions

### 1. Data Ingestion Method → Open Banking API

Four options were considered:

| Option | Method | Difficulty |
|---|---|---|
| A | Email parsing (Gmail API) | Medium |
| B | SMS parsing (Android app + Webhook) | High |
| C | Open Banking API (금융결제원) | High |
| D | Manual CSV upload | Low |

**Decision: Option C** — Open Banking API via Korea's Financial Settlement Institute (금융결제원), using the sandbox test environment for personal use.

---

### 2. Scale → Personal first, then public service

The app will start as a single-user personal tool and gradually expand to a multi-user public service. To enable this without major refactoring, the database schema was designed with multi-user structure from the start (`user_id` foreign keys, Row Level Security).

---

### 3. Sync Frequency → 5-minute polling via pg_cron

Real-time Webhook requires regulatory approval, so periodic polling every 5–10 minutes was chosen. Supabase's `pg_cron` runs inside the PostgreSQL database, bypassing Vercel's serverless function time limits (10s on free tier). The analogy used: Vercel functions are like "a part-time worker who only shows up when a customer arrives," while pg_cron is "a factory timer that runs automatically regardless of who's present."

---

### 4. Dashboard Scope → Basic first, then expand

- **Phase 1 (now):** Daily / weekly / monthly total spending charts
- **Phase 2:** Category breakdown, merchant rankings, transaction filters
- **Phase 3:** Budget alerts, month-over-month comparison, multi-user public service

---

### 5. Deployment → Vercel + Supabase

Three architecture options were proposed:

| Option | Stack | Decision |
|---|---|---|
| A | Next.js + Supabase (recommended) | ✅ Selected |
| B | Next.js + Node.js backend + Neon DB | — |
| C | Next.js + Vercel Cron + PlanetScale | — |

**Decision: Option A** — Two services only (Vercel + Supabase). Supabase bundles PostgreSQL, Auth, Storage, Edge Functions, and pg_cron in one platform, making A→C scale-up straightforward.

---

## Architecture

```
[User]
  ├── Signup/Login ──→ [Supabase Auth] ──→ JWT
  └── Dashboard access ──→ JWT verified ──→ own data only

[Next.js on Vercel]
  ├── /login              Login + Signup
  ├── /dashboard          Chart dashboard
  ├── /transactions       Transaction list + receipt upload
  ├── /auth/callback      Open Banking OAuth callback
  └── /settings           Account linking, logout

[Supabase PostgreSQL]
  ├── profiles
  ├── open_banking_tokens
  ├── transactions
  └── pg_cron ──→ every 5 min ──→ Edge Function

[Supabase Edge Function]
  └── Polls Open Banking API ──→ saves to DB

[금융결제원 Open Banking API]
[Frankfurter API] ── used when KRW deduction not available
```

---

## Database Schema

```sql
profiles (id, email, created_at)

open_banking_tokens (
  id, user_id, access_token, refresh_token,
  expires_at, bank_account_no, created_at, updated_at
)

transactions (
  id, user_id,
  transaction_id TEXT UNIQUE,       -- prevents duplicates at DB level
  amount NUMERIC(15,2),             -- original amount (e.g. 3.80)
  currency CHAR(3),                 -- ISO code (GBP, USD, KRW)
  exchange_rate NUMERIC(15,4),      -- actual rate (reverse-calculated) or estimated
  krw_amount INTEGER,               -- KRW equivalent
  is_estimated_rate BOOLEAN,        -- true = Frankfurter API estimate
  merchant_name TEXT,
  category TEXT,
  receipt_url TEXT,                 -- Supabase Storage path
  transacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### Multi-currency handling

1. **KRW transaction** → `exchange_rate = 1`, `is_estimated_rate = false`
2. **Foreign currency + KRW deduction available from Open Banking API** → store actual KRW, reverse-calculate rate, `is_estimated_rate = false`
3. **Foreign currency + no KRW deduction** → call Frankfurter API for historical rate, `is_estimated_rate = true`

The dashboard supports both KRW-unified totals and per-currency foreign totals (e.g. total in GBP).

---

## Pages

| Route | Description | Auth Required |
|---|---|---|
| `/login` | Login + Signup | No |
| `/dashboard` | Spending charts | Yes |
| `/transactions` | Transaction list + receipt upload | Yes |
| `/auth/callback` | Open Banking OAuth callback | Yes |
| `/settings` | Account linking, logout | Yes |

Unauthenticated access to protected routes is handled by a single Next.js middleware that redirects to `/login`.

---

## Error Handling

| Scenario | Handling |
|---|---|
| Access token expiry | Auto-refresh via refresh token; prompt re-link on failure |
| Open Banking API outage | Track failure count; notify user after 3 consecutive failures |
| Duplicate transaction | Blocked at DB level by `transaction_id UNIQUE` constraint |
| Frankfurter API failure | Store `krw_amount = null`, `is_estimated_rate = true`; retry later |
| Unresolvable KRW amount | Show foreign amount only with `*` indicator in dashboard |
| Unauthenticated access | Middleware redirects to `/login` |
| Session expiry | Supabase Auth auto-refresh; prompt re-login on failure |

---

## Testing Strategy

- **Unit tests (Vitest):** Exchange rate calculation, daily/weekly/monthly aggregation, Open Banking API response parsing
- **Integration tests:** OAuth flow (mocked), polling → DB save → dashboard query
- **E2E tests (Playwright):** Login → account linking → dashboard, transaction list + receipt upload

---

## Implementation Plan (13 Tasks)

| Task | Description |
|---|---|
| 1 | Initialize Next.js project with all dependencies |
| 2 | Supabase schema migration + RLS + Storage bucket |
| 3 | Supabase client setup for browser, server, middleware + TypeScript types |
| 4 | Auth middleware (redirect unauthenticated users to /login) |
| 5 | Login / Signup page |
| 6 | Exchange rate utility — TDD with Vitest |
| 7 | Spending aggregation utility — TDD with Vitest |
| 8 | Open Banking OAuth flow + Settings page |
| 9 | Polling Edge Function + pg_cron schedule |
| 10 | Dashboard page (SpendingChart + currency selector) |
| 11 | Transactions page + receipt upload (Supabase Storage) |
| 12 | E2E tests (Playwright) |
| 13 | Full verification + Vercel deployment |

---

## Upgrade Roadmap

| Phase | Scope |
|---|---|
| Phase 1 (current) | Basic charts, transaction list, receipt attachment |
| Phase 2 | Category classification, merchant rankings, filter/search |
| Phase 3 | Budget alerts, month-over-month comparison, multi-user public service |

---

## Execution Method

Implementation will run in a **separate Claude Code session** using the `executing-plans` skill:

```bash
cd /path/to/smart-money-tracker
claude
# then in the new session:
/executing-plans docs/plans/2026-02-18-smart-money-tracker.md
```

### Prerequisites before starting

- [ ] Create a Supabase project → note Project URL, anon key, service_role key
- [ ] Register a test app at https://developers.openbanking.or.kr → obtain client_id and client_secret

---

## Artifacts

- Design document: `docs/plans/2026-02-18-smart-money-tracker-design.md`
- Implementation plan: `docs/plans/2026-02-18-smart-money-tracker.md`
- Full conversation log (Korean): `docs/plans/2026-02-19-conversation-log.md`
