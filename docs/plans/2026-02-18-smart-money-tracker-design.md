# Smart Money Tracker - Design Document

Date: 2026-02-18

## Overview

토스뱅크 체크카드 결제 내역을 오픈뱅킹 API로 자동 수집하고, 일별/주별/월별 지출을 시각화하는 대시보드 앱. 개인 사용으로 시작해 멀티유저 공개 서비스로 확장 가능한 구조로 설계.

---

## Tech Stack

| 영역 | 기술 | 이유 |
|---|---|---|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript | 요청 사항 |
| UI | Tailwind CSS + shadcn/ui | 빠른 개발, 디자인 일관성 |
| 차트 | Recharts | React 친화적, 커스터마이징 쉬움 |
| 백엔드 | Next.js API Routes | 별도 서버 불필요 |
| 데이터베이스 | Supabase (PostgreSQL) | Auth/DB/Cron 통합 |
| 파일 저장 | Supabase Storage | 영수증 이미지 저장 |
| 스케줄러 | Supabase pg_cron + Edge Function | Vercel 서버리스 제약 우회, 안정적 폴링 |
| 인증 | Supabase Auth | 단일 유저 → 멀티유저 확장 용이 |
| 환율 | Frankfurter API | 무료, 과거 날짜별 환율 지원 |
| 배포 | Vercel | Next.js 최적화 |

---

## Architecture

```
[사용자]
  │
  ├── 회원가입/로그인 ──→ [Supabase Auth] ──→ JWT 발급
  │
  ▼
[Next.js - Vercel]
  ├── /login              로그인 + 회원가입
  ├── /dashboard          차트 대시보드
  ├── /transactions       지출내역 목록
  ├── /auth/callback      오픈뱅킹 OAuth 콜백
  └── /settings           계좌 연동 관리, 로그아웃

[Supabase PostgreSQL]
  ├── profiles
  ├── open_banking_tokens
  ├── transactions
  └── pg_cron ──→ 5분마다 Edge Function 호출

[Supabase Edge Function]
  └── 오픈뱅킹 API 폴링 → 거래내역 저장

[금융결제원 오픈뱅킹 API]
[Frankfurter API] ── 환율 추정 시 사용
```

---

## Database Schema

```sql
-- 사용자 정보 (Supabase Auth와 연동)
create table public.profiles (
  id         uuid references auth.users(id) primary key,
  email      text,
  created_at timestamptz default now()
);

-- 오픈뱅킹 연동 토큰
create table public.open_banking_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
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
  user_id           uuid references public.profiles(id) on delete cascade,
  transaction_id    text unique not null,     -- 오픈뱅킹 원본 ID (중복 방지)
  amount            numeric(15, 2) not null,  -- 외화 결제 금액 (예: 3.80)
  currency          char(3) not null,         -- ISO 통화 코드 (GBP, USD, KRW 등)
  exchange_rate     numeric(15, 4),           -- 적용 환율 (실제 역산 또는 추정)
  krw_amount        integer,                  -- 원화 환산 금액
  is_estimated_rate boolean default false,    -- true = Frankfurter API 추정값
  merchant_name     text,                     -- 가맹점명
  category          text,                     -- 카테고리 (식비, 교통 등)
  receipt_url       text,                     -- Supabase Storage 영수증 이미지 경로
  transacted_at     timestamptz not null,     -- 실제 결제 시각
  created_at        timestamptz default now()
);

-- 인덱스
create index on public.transactions(user_id, transacted_at desc);
```

### 환율 처리 원칙

1. 오픈뱅킹 API 응답에 KRW 차감액이 있을 경우 → `krw_amount` 직접 저장, `exchange_rate` 역산, `is_estimated_rate = false`
2. KRW 차감액이 없을 경우 → Frankfurter API로 거래 날짜 기준 환율 조회, `is_estimated_rate = true`
3. KRW 결제 → `currency = KRW`, `exchange_rate = 1`, `is_estimated_rate = false`

---

## Page Structure

| 경로 | 설명 | 인증 필요 |
|---|---|---|
| `/login` | 로그인 + 회원가입 | X |
| `/dashboard` | 메인 대시보드 (차트) | O |
| `/transactions` | 지출내역 목록 + 영수증 첨부 | O |
| `/auth/callback` | 오픈뱅킹 OAuth 콜백 | O |
| `/settings` | 계좌 연동 관리, 로그아웃 | O |

인증이 필요한 페이지는 Next.js middleware에서 일괄 처리. 미인증 접근 시 `/login` 리다이렉트.

---

## Feature Flows

### 사용자 여정

```
첫 방문 → /login
  ├── 신규: 회원가입 → 이메일 인증 → 로그인
  └── 기존: 로그인
      │
      ▼
  /dashboard
  ├── 오픈뱅킹 미연동 → "계좌 연동하기" 배너
  │     └── 클릭 → OAuth → 연동 완료 → 폴링 시작
  └── 오픈뱅킹 연동 완료 → 차트 + 거래내역 표시
```

### 오픈뱅킹 연동 (최초 1회)

```
"계좌 연동하기" 클릭
→ 금융결제원 OAuth 페이지 리다이렉트
→ /auth/callback?code=xxxx 수신
→ code → access_token + refresh_token 교환
→ open_banking_tokens 저장
→ pg_cron 폴링 자동 시작
```

### 거래내역 폴링 (5분마다 자동)

```
pg_cron → Edge Function 호출
→ 유효 토큰 확인 (만료 시 refresh_token으로 갱신)
→ 오픈뱅킹 API: 마지막 조회 이후 거래내역 요청
→ 각 거래건:
    KRW → exchange_rate=1, is_estimated_rate=false
    외화 + KRW 차감액 있음 → 직접 저장, 환율 역산
    외화 + KRW 차감액 없음 → Frankfurter API 추정
→ transactions upsert (중복은 DB unique 제약으로 자동 차단)
```

---

## UI Layout

### /dashboard

```
┌─────────────────────────────────────────┐
│  Smart Money Tracker     [설정] [로그아웃] │
├─────────────────────────────────────────┤
│  이번 달 총 지출                           │
│  £ 1,243.50   ₩ 2,130,450              │
│  [통화 선택: 전체 | GBP | USD | KRW]      │
├─────────────────────────────────────────┤
│  [일별] [주별] [월별]                      │
│  (Recharts 막대 차트)                     │
├─────────────────────────────────────────┤
│  최근 지출내역          [전체보기 →]       │
│  Tesco         £ 12.50   2025.02.18    │
│  TfL           £  3.80   2025.02.17    │
└─────────────────────────────────────────┘
```

### /transactions

```
┌─────────────────────────────────────────┐
│  지출내역                    [← 대시보드]  │
├─────────────────────────────────────────┤
│  2025년 2월 18일                         │
│  ┌─────────────────────────────────┐   │
│  │ Tesco         £ 12.50 / ₩21,400│   │
│  │ 2025.02.18 14:32                │   │
│  │ [영수증 첨부하기]                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ TfL            £ 3.80 / ₩6,506 │   │
│  │ 2025.02.18 09:15                │   │
│  │ [📎 영수증 보기]                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Error Handling

| 상황 | 처리 |
|---|---|
| access_token 만료 | refresh_token 자동 갱신, 실패 시 재연동 유도 |
| 오픈뱅킹 API 장애 | 실패 횟수 기록, 3회 연속 실패 시 사용자 알림 |
| 중복 거래 저장 | transaction_id unique 제약으로 DB 레벨 차단 |
| Frankfurter API 응답 없음 | krw_amount=null, is_estimated_rate=true 저장 후 재시도 |
| KRW 환산 불가 거래 | 대시보드에서 외화 금액만 표시, * 표시로 안내 |
| 미인증 접근 | Next.js middleware에서 /login 리다이렉트 |
| 세션 만료 | Supabase Auth 자동 갱신, 실패 시 재로그인 유도 |

---

## Testing Strategy

- **단위 테스트 (Vitest)**: 환율 계산 로직, 집계 함수, API 응답 파싱
- **통합 테스트**: 오픈뱅킹 OAuth 흐름 (mock), 폴링 → DB 저장 → 조회 전체 흐름
- **E2E 테스트 (Playwright)**: 로그인 → 계좌 연동 → 대시보드 확인, 지출내역 + 영수증 첨부

---

## Upgrade Roadmap

| 단계 | 내용 |
|---|---|
| 1단계 (현재) | 기본 차트 (일별/주별/월별), 지출내역 목록, 영수증 이미지 첨부 |
| 2단계 | 카테고리별 분류, 가맹점 순위, 거래내역 필터/검색 |
| 3단계 | 예산 설정/초과 알림, 전월 대비 비교, 멀티유저 공개 서비스 |
