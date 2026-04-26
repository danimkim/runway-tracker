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

## DEMO (TBA)

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
├── app/               # Routing only — pages, layouts, route handlers
│   ├── (auth)/        # Login, onboarding
│   ├── (dashboard)/   # Protected pages
│   └── auth/callback/ # Supabase OAuth callback
├── components/
│   ├── ui/            # shadcn/ui primitives
│   └── layout/        # BottomNav, SubPageHeader, etc.
├── features/          # Domain modules
│   ├── auth/
│   ├── dashboard/
│   └── transactions/
├── lib/
│   ├── supabase/      # client, server, middleware, types
│   ├── balance.ts     # GBP/KRW reverse-calculation
│   ├── exchange-rate.ts
│   └── runway.ts
└── proxy.ts
```
