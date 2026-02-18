# Smart Money Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 토스뱅크 체크카드 결제 내역을 오픈뱅킹 API로 자동 수집하고, 일별/주별/월별 지출을 시각화하는 대시보드 앱을 구축한다.

**Architecture:** Next.js App Router를 프론트엔드 및 API Routes로 사용하고, Supabase가 PostgreSQL DB + Auth + Storage + Edge Function + pg_cron을 담당한다. pg_cron이 5분마다 Supabase Edge Function을 호출하여 금융결제원 오픈뱅킹 API에서 거래내역을 가져와 저장한다.

**Tech Stack:** Next.js 14 (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Recharts, Supabase (PostgreSQL/Auth/Storage/Edge Functions/pg_cron), Frankfurter API, Vitest, Playwright, Vercel

---

## 사전 준비 (코드 작성 전)

아래 두 가지를 미리 준비해야 한다:

1. **Supabase 프로젝트 생성**
   - https://supabase.com → New Project 생성
   - Project URL, anon key, service_role key를 메모

2. **금융결제원 오픈뱅킹 테스트 계정 신청**
   - https://developers.openbanking.or.kr → 테스트 앱 생성
   - client_id, client_secret 발급
   - Redirect URI 등록: `http://localhost:3000/auth/callback`
   - 테스트 환경 Base URL: `https://testapi.openbanking.or.kr`

---

## 프로젝트 디렉토리 구조 (완성 형태)

```
smart-money-tracker/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx             ← 인증 가드
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   └── settings/page.tsx
│   └── auth/
│       └── callback/route.ts      ← 오픈뱅킹 OAuth 콜백
├── components/
│   ├── charts/SpendingChart.tsx
│   └── transactions/
│       ├── TransactionList.tsx
│       └── ReceiptUpload.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts              ← 브라우저용
│   │   ├── server.ts              ← 서버 컴포넌트용
│   │   └── middleware.ts          ← 미들웨어용
│   ├── open-banking/
│   │   ├── client.ts
│   │   └── types.ts
│   └── utils/
│       ├── exchange-rate.ts
│       └── aggregations.ts
├── middleware.ts
├── supabase/
│   ├── migrations/001_initial.sql
│   └── functions/poll-transactions/index.ts
└── tests/
    ├── unit/
    │   ├── exchange-rate.test.ts
    │   └── aggregations.test.ts
    └── e2e/auth.spec.ts
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json` (자동 생성)
- Create: `tailwind.config.ts`
- Create: `.env.local`

**Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/highmoon/Documents/projects/smart-money-tracker
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

프롬프트에서 모두 기본값(Enter) 선택.

**Step 2: 의존성 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr recharts
npm install -D vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/jest-dom @playwright/test jsdom
```

**Step 3: shadcn/ui 초기화**

```bash
npx shadcn@latest init
```

프롬프트:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Step 4: 필요한 shadcn 컴포넌트 설치**

```bash
npx shadcn@latest add button card tabs input label
```

**Step 5: `.env.local` 생성**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

OPEN_BANKING_CLIENT_ID=your-client-id
OPEN_BANKING_CLIENT_SECRET=your-client-secret
OPEN_BANKING_BASE_URL=https://testapi.openbanking.or.kr
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 6: `vitest.config.ts` 생성**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

**Step 7: `tests/setup.ts` 생성**

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
```

**Step 8: `package.json`에 스크립트 추가**

`package.json`의 `scripts`에 추가:

```json
"test": "vitest",
"test:e2e": "playwright test"
```

**Step 9: 실행 확인**

```bash
npm run dev
```

Expected: `http://localhost:3000` 에서 Next.js 기본 페이지 표시

**Step 10: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Supabase, Recharts, Vitest"
```

---

## Task 2: Supabase 스키마 마이그레이션

**Files:**
- Create: `supabase/migrations/001_initial.sql`

**Step 1: Supabase CLI 설치 및 초기화**

```bash
npm install -D supabase
npx supabase init
npx supabase login
npx supabase link --project-ref your-project-ref
```

`your-project-ref`는 Supabase 대시보드 URL의 프로젝트 ID.

**Step 2: 마이그레이션 파일 생성**

```sql
-- supabase/migrations/001_initial.sql

-- profiles: Supabase Auth users와 연동
create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text,
  created_at timestamptz default now()
);

-- 신규 유저 가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 오픈뱅킹 토큰
create table public.open_banking_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade not null,
  access_token    text not null,
  refresh_token   text not null,
  expires_at      timestamptz,
  bank_account_no text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 거래내역
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  transaction_id    text unique not null,
  amount            numeric(15, 2) not null,
  currency          char(3) not null,
  exchange_rate     numeric(15, 4),
  krw_amount        integer,
  is_estimated_rate boolean default false,
  merchant_name     text,
  category          text,
  receipt_url       text,
  transacted_at     timestamptz not null,
  created_at        timestamptz default now()
);

create index on public.transactions(user_id, transacted_at desc);

-- Row Level Security 활성화
alter table public.profiles enable row level security;
alter table public.open_banking_tokens enable row level security;
alter table public.transactions enable row level security;

-- RLS 정책: 본인 데이터만 접근 가능
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can view own tokens"
  on public.open_banking_tokens for all
  using (auth.uid() = user_id);

create policy "Users can view own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);
```

**Step 3: 마이그레이션 실행**

```bash
npx supabase db push
```

Expected: `Applying migration 001_initial.sql... done`

**Step 4: Supabase Storage 버킷 생성**

Supabase 대시보드 → Storage → New bucket:
- Name: `receipts`
- Public: No (비공개)

또는 SQL로:

```sql
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false);

create policy "Users can upload own receipts"
  on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own receipts"
  on storage.objects for select
  using (auth.uid()::text = (storage.foldername(name))[1]);
```

**Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema and RLS policies"
```

---

## Task 3: Supabase 클라이언트 설정 및 TypeScript 타입

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`
- Create: `lib/supabase/types.ts`

**Step 1: TypeScript 타입 생성**

```bash
npx supabase gen types typescript --linked > lib/supabase/types.ts
```

**Step 2: 브라우저용 Supabase 클라이언트 생성**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 3: 서버 컴포넌트용 Supabase 클라이언트 생성**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**Step 4: 미들웨어용 Supabase 클라이언트 생성**

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from './types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 인증이 필요한 경로 목록
  const protectedPaths = ['/dashboard', '/transactions', '/settings']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인 상태에서 /login 접근 시 /dashboard로 리다이렉트
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 5: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase client setup for browser, server, and middleware"
```

---

## Task 4: 인증 미들웨어

**Files:**
- Create: `middleware.ts`

**Step 1: `middleware.ts` 생성**

```typescript
// middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 2: 동작 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/dashboard` 접근 → `/login`으로 리다이렉트 되어야 함.

Expected: 주소창이 `http://localhost:3000/login`으로 변경됨

**Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add route protection middleware"
```

---

## Task 5: 로그인/회원가입 페이지

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/login/actions.ts`

**Step 1: Server Action 생성**

```typescript
// app/(auth)/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  return { success: '이메일을 확인해주세요.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

**Step 2: 로그인 페이지 생성**

```typescript
// app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { login, signup } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleLogin(formData: FormData) {
    setError(null)
    const result = await login(formData)
    if (result?.error) setError(result.error)
  }

  async function handleSignup(formData: FormData) {
    setError(null)
    setSuccess(null)
    const result = await signup(formData)
    if (result?.error) setError(result.error)
    if (result?.success) setSuccess(result.success)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Smart Money Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form action={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full">로그인</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form action={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">이메일</Label>
                  <Input id="signup-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">비밀번호 (6자 이상)</Label>
                  <Input id="signup-password" name="password" type="password" minLength={6} required />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-500">{success}</p>}
                <Button type="submit" className="w-full">회원가입</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: 동작 확인**

```bash
npm run dev
```

1. `http://localhost:3000/login` 접근 확인
2. 회원가입 탭에서 테스트 계정 생성
3. 로그인 후 `/dashboard`로 리다이렉트 확인 (dashboard 페이지는 아직 없으므로 404 OK)

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: add login/signup page with Supabase Auth"
```

---

## Task 6: 환율 계산 유틸리티 (TDD)

**Files:**
- Create: `lib/utils/exchange-rate.ts`
- Create: `tests/unit/exchange-rate.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// tests/unit/exchange-rate.test.ts
import { describe, it, expect, vi } from 'vitest'
import {
  calculateExchangeRate,
  fetchEstimatedRate,
  buildTransactionRateData,
} from '@/lib/utils/exchange-rate'

describe('calculateExchangeRate', () => {
  it('KRW 거래는 환율 1, is_estimated_rate false 반환', () => {
    const result = calculateExchangeRate({
      amount: 15000,
      currency: 'KRW',
      krwDeducted: null,
    })
    expect(result.exchange_rate).toBe(1)
    expect(result.krw_amount).toBe(15000)
    expect(result.is_estimated_rate).toBe(false)
  })

  it('외화 + KRW 차감액이 있으면 실제 환율 역산', () => {
    const result = calculateExchangeRate({
      amount: 3.80,
      currency: 'GBP',
      krwDeducted: 6506,
    })
    expect(result.krw_amount).toBe(6506)
    expect(result.exchange_rate).toBeCloseTo(1712.1, 0)
    expect(result.is_estimated_rate).toBe(false)
  })

  it('외화 + KRW 차감액 없으면 null 반환 (추정 필요)', () => {
    const result = calculateExchangeRate({
      amount: 3.80,
      currency: 'GBP',
      krwDeducted: null,
    })
    expect(result.krw_amount).toBeNull()
    expect(result.exchange_rate).toBeNull()
    expect(result.is_estimated_rate).toBe(true)
  })
})

describe('fetchEstimatedRate', () => {
  it('Frankfurter API 응답을 환율로 반환', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { KRW: 1712.5 } }),
    })

    const rate = await fetchEstimatedRate('GBP', '2025-02-18')
    expect(rate).toBe(1712.5)
  })

  it('API 실패 시 null 반환', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    const rate = await fetchEstimatedRate('GBP', '2025-02-18')
    expect(rate).toBeNull()
  })
})

describe('buildTransactionRateData', () => {
  it('추정 환율로 krw_amount 계산', () => {
    const result = buildTransactionRateData({
      amount: 3.80,
      estimatedRate: 1712.5,
    })
    expect(result.krw_amount).toBe(6508) // Math.round(3.80 * 1712.5)
    expect(result.exchange_rate).toBe(1712.5)
    expect(result.is_estimated_rate).toBe(true)
  })
})
```

**Step 2: 테스트 실행 - 실패 확인**

```bash
npm test tests/unit/exchange-rate.test.ts
```

Expected: FAIL - `Cannot find module '@/lib/utils/exchange-rate'`

**Step 3: 구현 작성**

```typescript
// lib/utils/exchange-rate.ts

interface RateInput {
  amount: number
  currency: string
  krwDeducted: number | null
}

interface RateResult {
  exchange_rate: number | null
  krw_amount: number | null
  is_estimated_rate: boolean
}

export function calculateExchangeRate({ amount, currency, krwDeducted }: RateInput): RateResult {
  if (currency === 'KRW') {
    return {
      exchange_rate: 1,
      krw_amount: Math.round(amount),
      is_estimated_rate: false,
    }
  }

  if (krwDeducted !== null) {
    return {
      exchange_rate: krwDeducted / amount,
      krw_amount: krwDeducted,
      is_estimated_rate: false,
    }
  }

  return {
    exchange_rate: null,
    krw_amount: null,
    is_estimated_rate: true,
  }
}

export async function fetchEstimatedRate(
  currency: string,
  date: string // YYYY-MM-DD
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/${date}?from=${currency}&to=KRW`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.rates?.KRW ?? null
  } catch {
    return null
  }
}

export function buildTransactionRateData({
  amount,
  estimatedRate,
}: {
  amount: number
  estimatedRate: number
}): RateResult {
  return {
    exchange_rate: estimatedRate,
    krw_amount: Math.round(amount * estimatedRate),
    is_estimated_rate: true,
  }
}
```

**Step 4: 테스트 통과 확인**

```bash
npm test tests/unit/exchange-rate.test.ts
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add lib/utils/exchange-rate.ts tests/unit/exchange-rate.test.ts
git commit -m "feat: add exchange rate utilities with tests"
```

---

## Task 7: 지출 집계 유틸리티 (TDD)

**Files:**
- Create: `lib/utils/aggregations.ts`
- Create: `tests/unit/aggregations.test.ts`

**Step 1: 실패하는 테스트 작성**

```typescript
// tests/unit/aggregations.test.ts
import { describe, it, expect } from 'vitest'
import { groupByDay, groupByWeek, groupByMonth } from '@/lib/utils/aggregations'

const mockTransactions = [
  { transacted_at: '2025-02-18T10:00:00Z', krw_amount: 21400, amount: 12.50, currency: 'GBP' },
  { transacted_at: '2025-02-18T14:00:00Z', krw_amount: 6506, amount: 3.80, currency: 'GBP' },
  { transacted_at: '2025-02-17T09:00:00Z', krw_amount: 42000, amount: 24.99, currency: 'GBP' },
  { transacted_at: '2025-02-10T12:00:00Z', krw_amount: 15000, amount: 15000, currency: 'KRW' },
]

describe('groupByDay', () => {
  it('같은 날짜끼리 krw_amount 합산', () => {
    const result = groupByDay(mockTransactions, 'KRW')
    const feb18 = result.find(r => r.date === '2025-02-18')
    expect(feb18?.total).toBe(27906) // 21400 + 6506
  })
})

describe('groupByWeek', () => {
  it('이번 주 거래를 요일별로 집계', () => {
    const result = groupByWeek(mockTransactions, 'KRW')
    expect(result).toHaveLength(7) // 월~일 7일
    result.forEach(r => {
      expect(r).toHaveProperty('day')
      expect(r).toHaveProperty('total')
    })
  })
})

describe('groupByMonth', () => {
  it('이번 달 거래를 일별로 집계', () => {
    const result = groupByMonth(mockTransactions, 'KRW')
    const day18 = result.find(r => r.date === '18')
    expect(day18?.total).toBe(27906)
  })
})
```

**Step 2: 테스트 실행 - 실패 확인**

```bash
npm test tests/unit/aggregations.test.ts
```

Expected: FAIL - `Cannot find module '@/lib/utils/aggregations'`

**Step 3: 구현 작성**

```typescript
// lib/utils/aggregations.ts

interface Transaction {
  transacted_at: string
  krw_amount: number | null
  amount: number
  currency: string
}

interface AggregationPoint {
  date: string
  total: number
}

function getAmount(tx: Transaction, currency: string): number {
  if (currency === 'KRW') return tx.krw_amount ?? 0
  if (tx.currency === currency) return Number(tx.amount)
  return 0
}

export function groupByDay(
  transactions: Transaction[],
  currency: string
): AggregationPoint[] {
  const map = new Map<string, number>()

  transactions.forEach(tx => {
    const date = tx.transacted_at.slice(0, 10) // YYYY-MM-DD
    const amount = getAmount(tx, currency)
    map.set(date, (map.get(date) ?? 0) + amount)
  })

  return Array.from(map.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function groupByWeek(
  transactions: Transaction[],
  currency: string
): AggregationPoint[] {
  const days = ['월', '화', '수', '목', '금', '토', '일']
  const result: AggregationPoint[] = days.map(day => ({ date: day, total: 0 }))

  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  transactions.forEach(tx => {
    const txDate = new Date(tx.transacted_at)
    const dayIndex = (txDate.getDay() + 6) % 7 // 월=0, 일=6
    if (txDate >= monday) {
      result[dayIndex].total += getAmount(tx, currency)
    }
  })

  return result
}

export function groupByMonth(
  transactions: Transaction[],
  currency: string
): AggregationPoint[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const result: AggregationPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    date: String(i + 1).padStart(2, '0'),
    total: 0,
  }))

  transactions.forEach(tx => {
    const txDate = new Date(tx.transacted_at)
    if (txDate.getFullYear() === year && txDate.getMonth() === month) {
      const day = txDate.getDate() - 1
      result[day].total += getAmount(tx, currency)
    }
  })

  return result
}
```

**Step 4: 테스트 통과 확인**

```bash
npm test tests/unit/aggregations.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add lib/utils/aggregations.ts tests/unit/aggregations.test.ts
git commit -m "feat: add spending aggregation utilities with tests"
```

---

## Task 8: 오픈뱅킹 OAuth 연동

**Files:**
- Create: `lib/open-banking/types.ts`
- Create: `lib/open-banking/client.ts`
- Create: `app/auth/callback/route.ts`
- Create: `app/(protected)/settings/page.tsx`

**Step 1: 오픈뱅킹 타입 정의**

```typescript
// lib/open-banking/types.ts

export interface OBTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
  user_seq_no: string  // 금융결제원 사용자 일련번호
}

export interface OBTransaction {
  tran_date: string       // YYYYMMDD
  tran_time: string       // HHmmss
  inout_type: 'OUT' | 'IN'
  tran_type: string
  tran_amt: string        // 거래 금액
  after_balance_amt: string
  tran_memo: string       // 가맹점명
  branch_name: string
  currency_code?: string  // 외화 코드 (없으면 KRW)
  frgn_currency_tran_amt?: string  // 외화 금액
}

export interface OBTransactionListResponse {
  api_tran_id: string
  rsp_code: string
  rsp_message: string
  fin_use_num: string
  list: OBTransaction[]
}
```

**Step 2: 오픈뱅킹 클라이언트 생성**

```typescript
// lib/open-banking/client.ts
import type { OBTokenResponse, OBTransactionListResponse } from './types'

const BASE_URL = process.env.OPEN_BANKING_BASE_URL!
const CLIENT_ID = process.env.OPEN_BANKING_CLIENT_ID!
const CLIENT_SECRET = process.env.OPEN_BANKING_CLIENT_SECRET!

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    scope: 'login inquiry',
    state,
    auth_type: '0',
  })
  return `${BASE_URL}/oauth/2.0/authorize?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<OBTokenResponse> {
  const res = await fetch(`${BASE_URL}/oauth/2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<OBTokenResponse> {
  const res = await fetch(`${BASE_URL}/oauth/2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json()
}

export async function fetchTransactions(
  accessToken: string,
  finUseNum: string,
  fromDate: string, // YYYYMMDD
  toDate: string
): Promise<OBTransactionListResponse> {
  const params = new URLSearchParams({
    bank_tran_id: `${CLIENT_ID}U${Date.now()}`,
    fintech_use_num: finUseNum,
    inquiry_type: 'A',
    inquiry_base: 'D',
    from_date: fromDate,
    to_date: toDate,
    sort_order: 'D',
    tran_dtime: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14),
  })

  const res = await fetch(
    `${BASE_URL}/v2.0/account/transaction/list/fin_use_num?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
  if (!res.ok) throw new Error(`Transaction fetch failed: ${res.status}`)
  return res.json()
}
```

**Step 3: OAuth 콜백 Route Handler 생성**

```typescript
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken } from '@/lib/open-banking/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/settings?error=${error ?? 'missing_code'}`, request.url)
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const token = await exchangeCodeForToken(code)
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

    // 기존 토큰 upsert
    await supabase
      .from('open_banking_tokens')
      .upsert({
        user_id: user.id,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return NextResponse.redirect(new URL('/dashboard?connected=true', request.url))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url))
  }
}
```

**Step 4: Settings 페이지 생성 (계좌 연동 + 로그아웃)**

```typescript
// app/(protected)/settings/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/open-banking/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { logout } from '@/app/(auth)/login/actions'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: token } = await supabase
    .from('open_banking_tokens')
    .select('bank_account_no, updated_at')
    .eq('user_id', user!.id)
    .single()

  const connectUrl = getAuthorizationUrl(user!.id)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오픈뱅킹 계좌 연동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {token ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600 font-medium">연동 완료</p>
              {token.bank_account_no && (
                <p className="text-sm text-slate-600">계좌: {token.bank_account_no}</p>
              )}
              <p className="text-sm text-slate-400">
                마지막 업데이트: {new Date(token.updated_at).toLocaleString('ko-KR')}
              </p>
              <a href={connectUrl}>
                <Button variant="outline" size="sm">재연동</Button>
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                토스뱅크 계좌를 연동하면 결제 내역이 자동으로 수집됩니다.
              </p>
              <a href={connectUrl}>
                <Button>계좌 연동하기</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">{user!.email}</p>
          <form action={logout}>
            <Button variant="destructive" type="submit">로그아웃</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 5: Protected layout 생성**

```typescript
// app/(protected)/layout.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <>{children}</>
}
```

**Step 6: 동작 확인**

```bash
npm run dev
```

로그인 후 `/settings` 접근 → "계좌 연동하기" 버튼 확인

**Step 7: Commit**

```bash
git add app/ lib/open-banking/
git commit -m "feat: add Open Banking OAuth flow and settings page"
```

---

## Task 9: 폴링 Edge Function + pg_cron

**Files:**
- Create: `supabase/functions/poll-transactions/index.ts`

**Step 1: Edge Function 생성**

```typescript
// supabase/functions/poll-transactions/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OB_BASE_URL = Deno.env.get('OPEN_BANKING_BASE_URL')!
const OB_CLIENT_ID = Deno.env.get('OPEN_BANKING_CLIENT_ID')!
const OB_CLIENT_SECRET = Deno.env.get('OPEN_BANKING_CLIENT_SECRET')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function refreshToken(refreshToken: string) {
  const res = await fetch(`${OB_BASE_URL}/oauth/2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OB_CLIENT_ID,
      client_secret: OB_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json()
}

async function fetchEstimatedRate(currency: string, date: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.frankfurter.app/${date}?from=${currency}&to=KRW`)
    if (!res.ok) return null
    const data = await res.json()
    return data.rates?.KRW ?? null
  } catch {
    return null
  }
}

Deno.serve(async () => {
  // 모든 유저의 토큰 조회
  const { data: tokens, error } = await supabase
    .from('open_banking_tokens')
    .select('*')

  if (error || !tokens?.length) {
    return new Response(JSON.stringify({ message: 'No tokens found' }), { status: 200 })
  }

  for (const tokenRow of tokens) {
    try {
      let { access_token, refresh_token, expires_at, user_id, bank_account_no } = tokenRow

      // 토큰 만료 10분 전이면 갱신
      const expiresAt = new Date(expires_at)
      if (expiresAt.getTime() - Date.now() < 10 * 60 * 1000) {
        const newToken = await refreshToken(refresh_token)
        access_token = newToken.access_token
        refresh_token = newToken.refresh_token
        const newExpiresAt = new Date(Date.now() + newToken.expires_in * 1000).toISOString()

        await supabase
          .from('open_banking_tokens')
          .update({
            access_token,
            refresh_token,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tokenRow.id)
      }

      // 최근 거래내역 조회 (오늘 기준 7일)
      const today = new Date()
      const toDate = today.toISOString().slice(0, 10).replace(/-/g, '')
      const fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10).replace(/-/g, '')

      const tranRes = await fetch(
        `${OB_BASE_URL}/v2.0/account/transaction/list/fin_use_num?` +
        new URLSearchParams({
          bank_tran_id: `${OB_CLIENT_ID}U${Date.now()}`,
          fintech_use_num: bank_account_no,
          inquiry_type: 'A',
          inquiry_base: 'D',
          from_date: fromDate,
          to_date: toDate,
          sort_order: 'D',
          tran_dtime: new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14),
        }),
        { headers: { Authorization: `Bearer ${access_token}` } }
      )

      if (!tranRes.ok) continue
      const data = await tranRes.json()
      const transactions = data.list ?? []

      for (const tx of transactions) {
        if (tx.inout_type !== 'OUT') continue // 지출만 저장

        const txDate = `${tx.tran_date.slice(0, 4)}-${tx.tran_date.slice(4, 6)}-${tx.tran_date.slice(6, 8)}`
        const currency = tx.currency_code || 'KRW'
        const amount = parseFloat(tx.frgn_currency_tran_amt || tx.tran_amt)
        const krwDeducted = tx.frgn_currency_tran_amt ? parseInt(tx.tran_amt) : null

        let exchange_rate: number | null = null
        let krw_amount: number | null = null
        let is_estimated_rate = false

        if (currency === 'KRW') {
          exchange_rate = 1
          krw_amount = Math.round(amount)
        } else if (krwDeducted !== null) {
          krw_amount = krwDeducted
          exchange_rate = krwDeducted / amount
        } else {
          const rate = await fetchEstimatedRate(currency, txDate)
          if (rate) {
            exchange_rate = rate
            krw_amount = Math.round(amount * rate)
            is_estimated_rate = true
          } else {
            is_estimated_rate = true
          }
        }

        await supabase.from('transactions').upsert({
          user_id,
          transaction_id: `${tx.tran_date}${tx.tran_time}${tx.tran_memo}`,
          amount,
          currency,
          exchange_rate,
          krw_amount,
          is_estimated_rate,
          merchant_name: tx.tran_memo,
          transacted_at: `${txDate}T${tx.tran_time.slice(0, 2)}:${tx.tran_time.slice(2, 4)}:${tx.tran_time.slice(4, 6)}+09:00`,
        }, { onConflict: 'transaction_id', ignoreDuplicates: true })
      }
    } catch (err) {
      console.error(`Error processing user ${tokenRow.user_id}:`, err)
    }
  }

  return new Response(JSON.stringify({ message: 'Polling complete' }), { status: 200 })
})
```

**Step 2: Edge Function 시크릿 설정**

```bash
npx supabase secrets set \
  OPEN_BANKING_BASE_URL=https://testapi.openbanking.or.kr \
  OPEN_BANKING_CLIENT_ID=your-client-id \
  OPEN_BANKING_CLIENT_SECRET=your-client-secret
```

**Step 3: Edge Function 배포**

```bash
npx supabase functions deploy poll-transactions
```

Expected: `Deployed Function poll-transactions`

**Step 4: pg_cron 설정 (Supabase SQL Editor에서 실행)**

Supabase 대시보드 → SQL Editor에서 실행:

```sql
-- pg_net 확장 활성화 (HTTP 요청용)
create extension if not exists pg_net;

-- 5분마다 poll-transactions 호출
select cron.schedule(
  'poll-transactions',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/poll-transactions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  )
  $$
);
```

`your-project-ref`는 Supabase 프로젝트 레퍼런스로 교체.

**Step 5: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add polling Edge Function with pg_cron schedule"
```

---

## Task 10: 대시보드 페이지

**Files:**
- Create: `components/charts/SpendingChart.tsx`
- Create: `app/(protected)/dashboard/page.tsx`

**Step 1: SpendingChart 컴포넌트 생성**

```typescript
// components/charts/SpendingChart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface ChartData {
  date: string
  total: number
}

interface SpendingChartProps {
  data: ChartData[]
  currency: string
}

function formatAmount(value: number, currency: string) {
  if (currency === 'KRW') return `₩${value.toLocaleString()}`
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`
}

export function SpendingChart({ data, currency }: SpendingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => String(Math.round(v))} />
        <Tooltip
          formatter={(value: number) => [formatAmount(value, currency), '지출']}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**Step 2: 대시보드 페이지 생성**

```typescript
// app/(protected)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SpendingChart } from '@/components/charts/SpendingChart'
import { groupByDay, groupByWeek, groupByMonth } from '@/lib/utils/aggregations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Period = 'daily' | 'weekly' | 'monthly'
type Currency = 'KRW' | 'GBP' | 'USD'

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('monthly')
  const [currency, setCurrency] = useState<Currency>('KRW')
  const [currencies, setCurrencies] = useState<string[]>(['KRW'])
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 오픈뱅킹 연동 확인
      const { data: token } = await supabase
        .from('open_banking_tokens')
        .select('id')
        .eq('user_id', user.id)
        .single()
      setIsConnected(!!token)

      // 이번 달 거래내역 조회
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transacted_at', startOfMonth.toISOString())
        .order('transacted_at', { ascending: false })

      if (data) {
        setTransactions(data)
        const uniqueCurrencies = [...new Set(data.map((t: any) => t.currency))]
        setCurrencies(['KRW', ...uniqueCurrencies.filter(c => c !== 'KRW')])
      }
    }
    load()
  }, [])

  const chartData = period === 'daily'
    ? groupByDay(transactions, currency)
    : period === 'weekly'
    ? groupByWeek(transactions, currency)
    : groupByMonth(transactions, currency)

  const totalKrw = transactions.reduce((sum, t) => sum + (t.krw_amount ?? 0), 0)
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Smart Money Tracker</h1>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm">설정</Button>
          </Link>
        </div>
      </div>

      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-700 mb-3">
              거래 내역을 자동으로 가져오려면 계좌를 연동하세요.
            </p>
            <Link href="/settings">
              <Button size="sm">계좌 연동하기</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>이번 달 총 지출</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">₩{totalKrw.toLocaleString()}</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {currencies.map(c => (
              <Button
                key={c}
                variant={currency === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrency(c as Currency)}
              >
                {c}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>지출 현황</CardTitle>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p === 'daily' ? '일별' : p === 'weekly' ? '주별' : '월별'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SpendingChart data={chartData} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>최근 지출내역</CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">전체보기 →</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">거래 내역이 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {recentTransactions.map(tx => (
                <li key={tx.id} className="flex justify-between items-center">
                  <span className="text-sm">{tx.merchant_name ?? '알 수 없음'}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {tx.currency !== 'KRW' && `${tx.currency} ${Number(tx.amount).toFixed(2)}`}
                      {tx.krw_amount && ` ₩${tx.krw_amount.toLocaleString()}`}
                      {tx.is_estimated_rate && <span className="text-xs text-slate-400">*</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.transacted_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: 동작 확인**

```bash
npm run dev
```

로그인 후 `/dashboard` 접근 → 대시보드 페이지 정상 렌더링 확인

**Step 4: Commit**

```bash
git add app/(protected)/dashboard/ components/charts/
git commit -m "feat: add dashboard page with spending chart"
```

---

## Task 11: 지출내역 페이지 + 영수증 업로드

**Files:**
- Create: `components/transactions/ReceiptUpload.tsx`
- Create: `app/(protected)/transactions/page.tsx`

**Step 1: ReceiptUpload 컴포넌트 생성**

```typescript
// components/transactions/ReceiptUpload.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface ReceiptUploadProps {
  transactionId: string
  userId: string
  currentReceiptUrl: string | null
  onUpload: (url: string) => void
}

export function ReceiptUpload({ transactionId, userId, currentReceiptUrl, onUpload }: ReceiptUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const path = `${userId}/${transactionId}.${file.name.split('.').pop()}`

      const { error } = await supabase.storage
        .from('receipts')
        .upload(path, file, { upsert: true })

      if (error) throw error

      // DB 업데이트
      await supabase
        .from('transactions')
        .update({ receipt_url: path })
        .eq('id', transactionId)

      onUpload(path)

      // 미리보기 URL 생성
      const { data } = await supabase.storage
        .from('receipts')
        .createSignedUrl(path, 60)
      if (data) setPreviewUrl(data.signedUrl)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleView() {
    if (!currentReceiptUrl) return
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(currentReceiptUrl, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  if (currentReceiptUrl) {
    return (
      <Button variant="ghost" size="sm" onClick={handleView} className="text-blue-500">
        영수증 보기
      </Button>
    )
  }

  return (
    <label className="cursor-pointer">
      <span className="text-xs text-slate-400 hover:text-slate-600">
        {isUploading ? '업로드 중...' : '영수증 첨부하기'}
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </label>
  )
}
```

**Step 2: 지출내역 페이지 생성**

```typescript
// app/(protected)/transactions/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReceiptUpload } from '@/components/transactions/ReceiptUpload'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transacted_at', { ascending: false })

      if (data) setTransactions(data)
    }
    load()
  }, [])

  // 날짜별 그룹핑
  const grouped = transactions.reduce((acc, tx) => {
    const date = new Date(tx.transacted_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(tx)
    return acc
  }, {} as Record<string, any[]>)

  function handleReceiptUpload(txId: string, url: string) {
    setTransactions(prev =>
      prev.map(tx => tx.id === txId ? { ...tx, receipt_url: url } : tx)
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">← 대시보드</Button>
        </Link>
        <h1 className="text-2xl font-bold">지출내역</h1>
      </div>

      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">{date}</h2>
          <div className="space-y-2">
            {(txs as any[]).map(tx => (
              <Card key={tx.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{tx.merchant_name ?? '알 수 없음'}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.transacted_at).toLocaleTimeString('ko-KR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      {tx.currency !== 'KRW' && (
                        <p className="font-medium">
                          {tx.currency} {Number(tx.amount).toFixed(2)}
                        </p>
                      )}
                      {tx.krw_amount && (
                        <p className="text-sm text-slate-500">
                          ₩{tx.krw_amount.toLocaleString()}
                          {tx.is_estimated_rate && (
                            <span className="text-xs text-slate-400 ml-1">*추정</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <ReceiptUpload
                      transactionId={tx.id}
                      userId={userId}
                      currentReceiptUrl={tx.receipt_url}
                      onUpload={(url) => handleReceiptUpload(tx.id, url)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {transactions.length === 0 && (
        <p className="text-center text-slate-400 py-12">거래 내역이 없습니다.</p>
      )}
    </div>
  )
}
```

**Step 3: 동작 확인**

```bash
npm run dev
```

`/transactions` 접근 → 목록 표시, 영수증 첨부 버튼 확인

**Step 4: Commit**

```bash
git add app/(protected)/transactions/ components/transactions/
git commit -m "feat: add transactions page with receipt upload"
```

---

## Task 12: E2E 테스트 (Playwright)

**Files:**
- Create: `tests/e2e/auth.spec.ts`
- Create: `playwright.config.ts`

**Step 1: Playwright 설정 파일 생성**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Step 2: E2E 테스트 작성**

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('인증 플로우', () => {
  test('미인증 상태에서 /dashboard 접근 시 /login으로 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('로그인 페이지에 로그인/회원가입 탭이 있어야 함', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('로그인')).toBeVisible()
    await expect(page.getByText('회원가입')).toBeVisible()
  })

  test('잘못된 이메일/비밀번호로 로그인 시 에러 메시지 표시', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('p.text-red-500')).toBeVisible()
  })
})

test.describe('대시보드', () => {
  // 실제 로그인이 필요한 테스트는 테스트 계정 환경변수 필요
  // TEST_EMAIL, TEST_PASSWORD를 .env.test에 설정 후 사용
  test.skip('로그인 후 대시보드 접근 가능', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', process.env.TEST_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD!)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Smart Money Tracker')).toBeVisible()
  })
})
```

**Step 3: Playwright 브라우저 설치**

```bash
npx playwright install chromium
```

**Step 4: E2E 테스트 실행**

```bash
npm run test:e2e
```

Expected: 2 tests PASS (skip 1)

**Step 5: Commit**

```bash
git add tests/e2e/ playwright.config.ts
git commit -m "test: add E2E tests for auth flow"
```

---

## Task 13: 전체 검증 및 Vercel 배포

**Step 1: 전체 단위 테스트 통과 확인**

```bash
npm test
```

Expected: All tests PASS

**Step 2: 빌드 성공 확인**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

**Step 3: Vercel 배포**

```bash
npm install -g vercel
vercel --prod
```

프롬프트에서 프로젝트 설정 후 환경변수 입력:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPEN_BANKING_CLIENT_ID
OPEN_BANKING_CLIENT_SECRET
OPEN_BANKING_BASE_URL
NEXT_PUBLIC_APP_URL (배포 후 실제 URL로 업데이트)
```

**Step 4: 오픈뱅킹 Redirect URI 업데이트**

금융결제원 개발자 포털 → 앱 설정 → Redirect URI에 Vercel 배포 URL 추가:
`https://your-app.vercel.app/auth/callback`

**Step 5: 최종 Commit**

```bash
git add -A
git commit -m "feat: complete smart-money-tracker MVP"
```

---

## 구현 완료 체크리스트

- [ ] Task 1: 프로젝트 초기화
- [ ] Task 2: Supabase 스키마 마이그레이션
- [ ] Task 3: Supabase 클라이언트 설정
- [ ] Task 4: 인증 미들웨어
- [ ] Task 5: 로그인/회원가입 페이지
- [ ] Task 6: 환율 계산 유틸리티 (TDD)
- [ ] Task 7: 지출 집계 유틸리티 (TDD)
- [ ] Task 8: 오픈뱅킹 OAuth 연동
- [ ] Task 9: 폴링 Edge Function + pg_cron
- [ ] Task 10: 대시보드 페이지
- [ ] Task 11: 지출내역 페이지 + 영수증 업로드
- [ ] Task 12: E2E 테스트
- [ ] Task 13: 전체 검증 및 Vercel 배포
