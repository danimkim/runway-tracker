# Runway Tracker

A personal finance tracker specifically designed for managing dual-currency assets (KRW/GBP) and calculating financial survival. Unlike traditional budgeting apps, it works backward from a target end date to answer: **"Given my current savings, what is my daily spending ceiling?"**

## Motivation

Managing finances in a foreign country without a local income source presents unique challenges. **Runway Tracker** was built to address two primary needs:

- **Runway-Centric Budgeting**: Living on fixed savings (KRW) that must be converted into a local currency (GBP) requires a "runway" mindset. This app focuses on the future—calculating exactly how much you can afford to spend daily or weekly to reach your target date without exhausting your funds.
- **Receipt Digitisation**: To eliminate the clutter of physical paper receipts, the app allows users to upload and store receipt images for every transaction, maintaining a clean, digital financial record.

## Key Features

- **Dual-Currency Runway Calculation** — Integrated KRW and GBP balance tracking to calculate remaining days and dynamic daily budget limits.
- **Deterministic GBP Balance** — Ensures data integrity by calculating GBP balance as: `Initial + Total FX Deposits − Total Transactions`.
- **Smart Exchange Integration** — Fetches live KRW/GBP rates via [Frankfurter API](https://www.frankfurter.app/) with daily caching.
- **Transaction Management** — Organised views for GBP spending and KRW exchange records with manual category tagging.
- **Mobile-First Design** — A refined, purple-grey design system optimised for mobile browsers (430px max-width) using the Plus Jakarta Sans typeface.

## Demo

https://runway-tracker-iota.vercel.app/

<details>
<summary>Test Account</summary>
ID: user@example.com <br />
PW: testuser!
</details>

## Technical Challenges & Solutions

### Banking Data Integration via PDF Parsing

As an individual developer, accessing official banking APIs in South Korea is often restricted. To overcome this:

**The Solution**: Instead of direct API integration, the app implements a parsing logic for transaction history PDFs exported from the bank. This allows for accurate data synchronisation while remaining independent of restricted financial APIs.

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Framework       | Next.js 16 + React 19 + TypeScript     |
| Database        | Supabase (PostgreSQL + RLS + Auth)     |
| Styling         | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Charts          | Recharts                               |
| Testing         | Vitest + Playwright                    |
| Package manager | Yarn                                   |

## Project Structure

```
src/
├── app/                  # Routing only: pages, layouts, and route handlers
│   ├── (auth)/           # Login, signup, password reset, onboarding routes
│   ├── (protected)/      # Authenticated app routes
│   ├── api/              # Upload API endpoints
│   └── auth/callback/    # Supabase auth callback
├── components/           # Shared UI used across multiple features
│   ├── charts/
│   ├── icons/
│   └── layout/
├── features/             # Domain modules: actions, data, components, utils
│   ├── auth/
│   ├── onboarding/
│   ├── dashboard/
│   ├── settings/
│   └── transactions/
├── lib/                  # Shared infrastructure and pure domain logic
│   ├── supabase/         # client, server, middleware, generated types
│   ├── tossbank/         # Toss Bank PDF parser
│   ├── __test__/         # Tests for shared lib modules
│   ├── balance.ts        # GBP/KRW reverse-calculation
│   ├── exchange-rate.ts
│   └── runway.ts
└── proxy.ts

supabase/
├── migrations/           # Database migrations
└── functions/            # Supabase Edge Functions

tests/
└── e2e/                  # Playwright tests for full app flows
```

Vitest unit tests live next to the module they cover, under each feature or shared module's `__test__/` folder.
