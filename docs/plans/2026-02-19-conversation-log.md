# Smart Money Tracker - 전체 대화 기록

Date: 2026-02-19

---

**User:**
내가 토스뱅크 체크카드로 결제를 하면 그 지출내역을 자동으로 입력해주고 일별,주별, 월별 총 지출금액을 시각화 해주는 대시보드가 있는 앱을 만들고 싶어. 내가 선호하는 프론트엔드 기술스택은 React, Typescript, Next.js야. 나머지 백엔드나 데이터베이스는 앱의 특성에 맞는 기술을 네가 추천해줘. 이 앱을 만들기 위한 계획을 단계별로 작성해줘

---

**Assistant:**
프로젝트는 아직 초기 상태네요. 브레인스토밍을 시작하겠습니다.

**핵심 질문부터 시작합니다.**

토스뱅크 카드 결제 내역을 자동으로 가져오는 방식으로 어떤 걸 생각하고 계신가요?

- **A) 이메일 파싱** - 토스뱅크 결제 알림 이메일을 자동으로 읽어서 파싱
- **B) SMS/푸시 알림 파싱** - 결제 문자 메시지를 파싱 (앱 또는 Webhook)
- **C) Open Banking API** - 금융결제원 오픈뱅킹 API를 통해 거래내역 직접 조회
- **D) 수동 + 자동 혼합** - CSV/엑셀 업로드 + 나중에 API 연동 추가

각 방식마다 구현 난이도와 실시간성이 크게 다릅니다. 어떤 방식을 원하시나요?

---

**User:**
각 방식의 구현 난이도와 실제 구현 방식을 간략하게 설명해줘

---

**Assistant:**
각 방식의 실제 구현 방법과 난이도를 설명해드릴게요.

## A) 이메일 파싱

**구현 방식**
토스뱅크가 결제 시 발송하는 알림 이메일을 Gmail/Outlook API로 읽어서 정규식으로 금액, 가맹점명, 시각을 추출 → DB 저장

**난이도: 중**
- Gmail API OAuth 설정 필요
- 이메일 포맷이 바뀌면 파서가 깨짐
- 토스뱅크가 이메일 알림을 지원하는지 확인 필요 (현재 앱 푸시 중심)
- 실시간성: 수 분 지연 가능

---

## B) SMS 파싱

**구현 방식**
결제 문자를 안드로이드 앱(또는 iOS 단축어)이 수신 → Webhook으로 서버에 전송 → 파싱 후 저장

**난이도: 높**
- 별도의 모바일 앱(Android SMS 리스너) 개발 필요
- iOS는 SMS 접근 자체가 불가능 (단축어로 우회 가능하나 불안정)
- 플랫폼 의존성 높음
- 실시간성: 즉시

---

## C) 오픈뱅킹 API (금융결제원)

**구현 방식**
금융결제원 오픈뱅킹 플랫폼에 서비스 등록 → 사용자가 OAuth로 본인 계좌 연동 → 거래내역 API로 주기적 조회 (Polling 또는 Webhook)

**난이도: 높**
- 금융결제원 **사업자 심사** 필요 (개인 프로젝트는 테스트 계정으로만 가능)
- 체크카드 승인 내역은 계좌 출금과 다를 수 있어 매핑 복잡
- 실시간성: API 호출 주기에 따라 다름 (최소 수 분)

---

## D) CSV/엑셀 업로드 (수동)

**구현 방식**
토스뱅크 앱 → 거래내역 내보내기(CSV) → 앱에 파일 업로드 → 파싱 후 DB 저장

**난이도: 낮**
- 토스뱅크 CSV 포맷만 파싱하면 됨
- 외부 API, 인증, 심사 전혀 없음
- 나중에 자동화 방식을 추가할 수 있는 기반이 됨
- 실시간성: 없음 (수동 업로드 시점 기준)

---

## 현실적인 추천

개인 프로젝트라면 **D(CSV) → C(오픈뱅킹) 순서**로 단계적으로 가는 게 가장 현실적입니다.

- 1단계: CSV 업로드로 빠르게 대시보드 완성
- 2단계: 오픈뱅킹 개인 테스트 계정으로 자동화 추가

어떤 방식으로 진행하고 싶으신가요?

---

**User:**
C로 진행

---

**Assistant:**
오픈뱅킹 API로 진행하겠습니다. 다음 질문입니다.

---

이 앱을 어디에 배포하고 운영할 예정인가요?

- **A) 개인 사용 전용** - 본인만 쓰는 로컬/개인 서버, 로그인 없이 단일 계정
- **B) 소규모 멀티유저** - 가족/지인 몇 명이 각자 계정으로 사용 (회원가입/로그인 필요)
- **C) 서비스로 출시** - 불특정 다수에게 공개하는 실제 서비스

---

**User:**
A로 시작해서 C로 확장하고 싶어. 가능할까?

---

**Assistant:**
충분히 가능합니다. A→C 확장을 처음부터 염두에 두고 설계하면 나중에 대규모 리팩터링 없이 확장할 수 있습니다. 핵심은 처음부터 **멀티유저 구조**로 DB 스키마를 잡는 것입니다.

---

다음 질문입니다.

거래내역 동기화를 얼마나 자주 원하시나요?

- **A) 실시간에 가깝게** - 결제 직후 몇 분 내 대시보드에 반영 (주기적 폴링, 예: 5~10분마다)
- **B) 하루 1~2회** - 아침/저녁에 일괄 동기화, 실시간성 불필요
- **C) 수동 동기화** - 사용자가 "새로고침" 버튼을 눌렀을 때만 가져옴

---

**User:**
구현 난이도가 어렵지 않다면 A, 어렵다면 B

---

**Assistant:**
오픈뱅킹 API 기준으로 **A(주기적 폴링)가 크게 어렵지 않습니다.**

실시간 Webhook은 금융결제원 심사가 필요하지만, 5~10분 주기 폴링은 서버에서 크론잡 하나로 해결됩니다. **A로 진행**하겠습니다.

---

다음 질문입니다.

대시보드에서 지출을 어떻게 분석하고 싶으신가요?

- **A) 기본** - 일별/주별/월별 총 지출 금액 차트만
- **B) 중간** - 총 지출 + 카테고리별 분류 (식비, 교통, 쇼핑 등) + 가맹점별 순위
- **C) 풍부하게** - B + 예산 설정/초과 알림 + 전월 대비 비교 + 소비 패턴 인사이트

---

**User:**
A로 먼저 진행하고 추후 B > C 순서로 고도화

---

**Assistant:**
좋습니다. A→B→C 순서로 고도화하는 방향으로 설계하겠습니다.

---

마지막 질문입니다.

배포 환경은 어떻게 생각하고 계신가요?

- **A) Vercel + 관리형 클라우드DB** - Next.js는 Vercel, DB는 Supabase/PlanetScale 등. 인프라 관리 최소화, 빠른 배포
- **B) VPS 자체 호스팅** - AWS EC2, DigitalOcean 등에 직접 배포. 비용 절감 가능하나 서버 관리 필요
- **C) 아직 미정** - 일단 로컬에서 개발, 배포는 나중에 결정

---

**User:**
A

---

**Assistant:**
충분한 정보가 모였습니다. 이제 아키텍처 접근 방식 3가지를 제안드립니다.

## 아키텍처 접근 방식 3가지

---

### Option A) Next.js Full-Stack + Supabase (추천)

```
Vercel (Next.js App Router)
  ├── 프론트엔드 (React/TS)
  └── API Routes (오픈뱅킹 OAuth 콜백, 데이터 조회)

Supabase
  ├── PostgreSQL (거래내역, 사용자 정보)
  ├── Auth (현재는 단순, 나중에 멀티유저 확장)
  └── pg_cron (5~10분마다 오픈뱅킹 폴링)
```

**장점**: 서비스 2개(Vercel + Supabase)로 전체 스택 완결. Supabase의 pg_cron이 서버리스 제약 없이 안정적 폴링 가능. Auth/DB/Cron이 하나의 플랫폼에 통합. A→C 확장에 유리.

**단점**: Supabase 락인. Edge Function 학습 필요.

---

### Option B) Next.js + Separate Node.js Backend + Neon DB

```
Vercel (Next.js - 프론트엔드만)
Railway/Render (Node.js + Fastify)
  ├── REST API
  └── node-cron (폴링 스케줄러)
Neon (Serverless PostgreSQL)
```

**장점**: 관심사 분리가 명확. 백엔드에서 장시간 실행 작업 자유롭게 가능.

**단점**: 서비스 3개 관리 필요. 배포/운영 복잡도 증가.

---

### Option C) Next.js Full-Stack + Vercel Cron + PlanetScale

```
Vercel
  ├── Next.js (프론트 + API Routes)
  └── Vercel Cron Jobs (폴링)
PlanetScale (MySQL 호환 서버리스 DB)
```

**장점**: 모든 것이 Vercel 하나로 통합.

**단점**: Vercel Cron은 무료 플랜 최소 1분 간격 제한이 있고 실행시간 제약 있음. PlanetScale이 최근 무료 플랜 종료.

---

## 추천: **Option A**

Supabase의 `pg_cron`은 DB 레벨에서 직접 실행되어 Vercel 서버리스 제약을 완전히 우회할 수 있습니다. Auth도 내장되어 있어 A→C 확장 시 추가 서비스 없이 멀티유저를 바로 지원할 수 있습니다.

---

어떤 방식으로 진행할까요?

---

**User:**
A로 진행해줘. 그전에 Vercel 서버리스 제약을 우회할 수 있다는 부분을 1년차 주니어 개발자 수준에 맞춰서 설명해줘

---

**Assistant:**
## Vercel 서버리스 제약과 pg_cron 우회 설명

### 먼저, 서버리스(Serverless)란?

일반 서버는 컴퓨터가 24시간 켜져서 요청을 기다립니다. 반면 Vercel의 서버리스 함수는 **요청이 올 때만 잠깐 켜졌다가 꺼지는 함수**입니다.

```
일반 서버:  [켜짐 ─────────────────────────────] 24시간 대기
서버리스:   [요청]→[켜짐]→[응답]→[꺼짐]   [요청]→[켜짐]→[응답]→[꺼짐]
```

---

### 문제: 폴링(Polling)에 서버리스가 왜 불편한가?

우리가 원하는 건 이겁니다:

```
"5분마다 오픈뱅킹 API를 호출해서 새 거래내역을 가져와줘"
```

서버리스 함수는 **누군가 호출해줘야만 실행**됩니다. 스스로 "5분마다 일어나서 뭔가 하기"가 어렵습니다. Vercel Cron으로 가능하긴 하지만, 함수 1회 실행 시간이 **무료 플랜 기준 10초**로 제한됩니다. 오픈뱅킹 API 응답이 느리거나 처리할 거래가 많으면 시간 초과로 실패할 수 있습니다.

---

### 해결: Supabase pg_cron은 DB 안에서 직접 실행

`pg_cron`은 PostgreSQL 데이터베이스 안에 내장된 스케줄러입니다. Vercel 함수와 **완전히 별개로** 동작합니다.

```
[Vercel 서버리스]  ← 사용자 요청에만 반응, 시간 제한 있음
       ↕ (서로 독립적)
[Supabase PostgreSQL]
  └── pg_cron: "5분마다 Edge Function 호출해"  ← DB가 직접 스케줄 관리
        └── Edge Function: 오픈뱅킹 API 호출 → DB에 저장
```

쉽게 비유하면:

> Vercel은 **편의점 알바생** (손님 올 때만 일함)
> pg_cron은 **공장 타이머** (아무도 없어도 정해진 시간에 기계가 자동으로 돌아감)

---

### 정리

| | Vercel Cron | Supabase pg_cron |
|---|---|---|
| 실행 주체 | Vercel 서버리스 함수 | DB 내부 스케줄러 |
| 시간 제한 | 10초 (무료) | 없음 |
| 안정성 | 네트워크 상태 영향 받음 | DB와 함께 항상 실행 |
| 설정 | `vercel.json`에 cron 설정 | SQL 한 줄로 설정 |

---

이해가 됐으면 이제 본격적으로 전체 설계를 발표하겠습니다. Option A 기준으로 진행할게요.

---

**User:**
응

---

**Assistant:**
## 전체 설계 - Section 1: 기술 스택 & 아키텍처

### 기술 스택

| 영역 | 기술 | 이유 |
|---|---|---|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript | 요청 사항 |
| UI | Tailwind CSS + shadcn/ui | 빠른 개발, 디자인 일관성 |
| 차트 | Recharts | React 친화적, 커스터마이징 쉬움 |
| 백엔드 | Next.js API Routes | 별도 서버 불필요 |
| 데이터베이스 | Supabase (PostgreSQL) | Auth/DB/Cron 통합 |
| 스케줄러 | Supabase pg_cron + Edge Function | Vercel 서버리스 제약 우회 |
| 인증 | Supabase Auth | 현재 단일 유저, 추후 멀티유저 |
| 배포 | Vercel | Next.js 최적화 |

### 전체 아키텍처 흐름

```
[토스뱅크 사용자]
      │
      │ 1. 오픈뱅킹 OAuth 인증 (최초 1회)
      ▼
[Next.js - Vercel]
  ├── /auth/callback    ← 오픈뱅킹 인증코드 수신
  ├── /api/transactions ← 프론트에서 데이터 조회
  └── /dashboard        ← 차트 대시보드 페이지
      │
      │ access_token 저장
      ▼
[Supabase PostgreSQL]
  ├── users             ← 사용자 + 오픈뱅킹 토큰
  ├── transactions      ← 거래내역
  └── pg_cron           ← 5분마다 Edge Function 호출
      │
      │ 5분마다 자동 실행
      ▼
[Supabase Edge Function]
      │
      │ 거래내역 요청
      ▼
[금융결제원 오픈뱅킹 API]
      │
      │ 거래내역 응답
      ▼
[Supabase PostgreSQL - transactions 테이블에 저장]
```

이 구조 괜찮아 보이시나요? 다음으로 데이터베이스 스키마 설계로 넘어갈까요?

---

**User:**
그렇다면 회원가입/로그인/로그아웃 기능은 없어?

---

**Assistant:**
좋은 지적입니다. 있어야 합니다.

**개인 사용 단계에서도 로그인은 필수**입니다. 이유는:

1. 금융 데이터라 인증 없이 누구나 접근하면 안 됨
2. 오픈뱅킹 access_token이 DB에 저장되는데, 본인만 접근해야 함
3. 처음부터 Auth를 붙여두면 멀티유저 확장 시 추가 작업 최소화

---

Supabase Auth를 쓰면 아래 기능이 **거의 무료로** 제공됩니다:

| 기능 | 방식 |
|---|---|
| 회원가입 | 이메일 + 비밀번호 |
| 로그인 | 이메일 + 비밀번호 |
| 로그아웃 | Supabase SDK 한 줄 |
| 소셜 로그인 | Google, Kakao 등 (추후 추가 가능) |
| 세션 관리 | JWT 자동 처리 |

---

아키텍처 흐름도 아래처럼 수정됩니다:

```
[사용자]
  │
  ├── 회원가입/로그인 ──→ [Supabase Auth] ──→ JWT 발급
  │
  └── 대시보드 접근 ──→ JWT 검증 ──→ 본인 거래내역만 조회
```

그리고 DB의 `transactions` 테이블은 `user_id`로 사용자별로 데이터가 분리되어, 나중에 멀티유저가 되어도 다른 사람 데이터가 섞이지 않습니다.

---

이 부분 반영해서 계속 설계 진행할까요?

---

**User:**
응, 반영해서 계속 진행해줘

---

**Assistant:**
## Section 2: 데이터베이스 스키마

```sql
-- 사용자 (Supabase Auth가 auth.users 자동 생성, 추가 정보는 여기에)
create table public.profiles (
  id           uuid references auth.users(id) primary key,
  email        text,
  created_at   timestamptz default now()
);

-- 오픈뱅킹 연동 정보 (토큰 저장)
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
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
  transaction_id  text unique not null,
  amount          integer not null,     -- 지출 금액 (원)
  merchant_name   text,
  transacted_at   timestamptz not null,
  created_at      timestamptz default now()
);

-- 인덱스 (대시보드 조회 성능)
create index on public.transactions(user_id, transacted_at desc);
```

### 설계 포인트

- **`transaction_id` unique 제약** - 5분마다 폴링할 때 같은 거래가 중복 저장되는 것을 DB 레벨에서 차단
- **`amount`를 integer로** - 부동소수점 오류 없이 원 단위로 저장 (1,500원 → `1500`)
- **`user_id` 외래키** - 처음부터 멀티유저 구조, Row Level Security(RLS)로 본인 데이터만 접근 가능

스키마 괜찮아 보이시나요? 다음으로 **주요 기능 흐름 (오픈뱅킹 인증 → 폴링 → 대시보드)** 으로 넘어갈까요?

---

**User:**
거래내역에 카테고리를 추가해줘. amount의 경우, 원화가 아니고 파운드 등 외화를 사용할 거기 때문에 소수점 표시도 필요해. 예를들면, 3.80 같은 값을 입력할 수 있어야해

---

**Assistant:**
반영하겠습니다. 외화 처리 시 고려할 게 두 가지 있어서 먼저 확인할게요.

외화 결제 시 **원화 환산 금액**도 저장하고 싶으신가요?

예를 들어 영국에서 £3.80 결제 시:

- **A) 외화만 저장** - `3.80 GBP`만 기록, 대시보드에서 통화별로 따로 집계
- **B) 외화 + 원화 환산 함께 저장** - `3.80 GBP` + `6,500 KRW` 함께 기록, 원화 기준으로 통합 집계 가능

---

**User:**
B로 진행할 경우, 원화 환산은 해당 시점의 환율을 고려해야하는데 그것까지 적용해서 구현이 가능할까?

---

**Assistant:**
가능합니다. 구현 방법을 설명드릴게요.

### 환율 API 활용

결제 시점의 환율을 제공하는 무료 API가 있습니다.

**Frankfurter API** (무료, 회원가입 불필요)
- 1999년부터의 **날짜별 과거 환율** 제공
- 예: `2024-01-15`에 GBP → KRW 환율 조회 가능
- 사용량 제한 없음

### 흐름

```
오픈뱅킹 API → £3.80 GBP 거래 감지
      │
      ▼
Frankfurter API에 거래 날짜 기준 GBP→KRW 환율 요청
      │ 응답: 1 GBP = 1,712 KRW
      ▼
계산: 3.80 × 1,712 = 6,506 KRW
      │
      ▼
DB 저장: amount=3.80, currency=GBP, exchange_rate=1712, krw_amount=6506
```

이 방식으로 스키마를 업데이트하면 됩니다:

```sql
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id) on delete cascade,
  transaction_id  text unique not null,
  amount          numeric(15, 2) not null,   -- 원래 결제 금액 (예: 3.80)
  currency        char(3) not null,           -- ISO 코드 (GBP, USD, KRW 등)
  exchange_rate   numeric(15, 4),             -- 결제 시점 환율 (원화 기준)
  krw_amount      integer,                    -- 원화 환산 금액
  merchant_name   text,
  category        text,                       -- 카테고리 (식비, 교통 등)
  transacted_at   timestamptz not null,
  created_at      timestamptz default now()
);
```

원화가 아닌 경우 `exchange_rate`와 `krw_amount`를 채우고, 원화 결제는 `currency=KRW`, `exchange_rate=1`, `krw_amount=amount`로 저장합니다. 대시보드에서는 `krw_amount` 기준으로 통합 집계하면 됩니다.

이 방향으로 진행할까요?

---

**User:**
대시보드에 외화 기준으로 통합 집계 가능할까?

---

**Assistant:**
가능합니다. `currency` 컬럼이 있기 때문에 통화별로 그룹핑해서 집계할 수 있습니다.

예를 들어 이런 쿼리가 됩니다:

```sql
-- 이번 달 통화별 총 지출
select
  currency,
  sum(amount) as total_amount
from transactions
where user_id = $1
  and transacted_at >= date_trunc('month', now())
group by currency;
```

결과:
```
GBP  |  142.50
USD  |   89.00
KRW  | 45,000
```

대시보드에서는 이렇게 표현할 수 있습니다:

```
[통화 선택] 전체(KRW 환산) | GBP | USD | KRW

이번 달 총 지출
  전체 기준: 382,500 KRW
  GBP 기준:  142.50 £
  USD 기준:   89.00 $
```

즉, `krw_amount`로는 **통합 원화 집계**, `amount + currency`로는 **통화별 외화 집계**, 둘 다 됩니다.

이 방향으로 반영해서 계속 진행할까요?

---

**User:**
토스뱅크가 실제 적용한 환율과 다른경우는 어떻게 해?

---

**Assistant:**
鋭い指摘입니다. 실제로 토스뱅크가 적용하는 환율은 Frankfurter API의 기준환율과 다릅니다 (토스뱅크 수수료 + 카드사 환율 포함).

### 핵심을 짚어보면

오픈뱅킹 API가 반환하는 거래내역에는 **실제로 계좌에서 빠져나간 원화 금액**이 포함되어 있습니다.

```
예시 오픈뱅킹 응답:
{
  "tran_amt": "3.80",        ← 외화 결제 금액 (GBP)
  "tran_balance": "984500"   ← 결제 후 잔액 (KRW)
}
```

즉, **이전 잔액 - 결제 후 잔액 = 실제 차감된 원화**를 계산할 수 있습니다. 이 값이 토스뱅크가 실제 적용한 환율이 반영된 금액입니다.

### 그러면 Frankfurter API는 왜 쓰나?

오픈뱅킹 API 응답 구조에 따라 실제 차감 원화가 명시되지 않는 경우가 있습니다. 두 경우를 모두 대비해서 이렇게 처리하면 됩니다:

```
오픈뱅킹 응답에 KRW 차감액이 있음
  └──→ 그 값을 krw_amount로 저장 (가장 정확)
       실제 환율 = krw_amount / amount 으로 역산

오픈뱅킹 응답에 KRW 차감액이 없음
  └──→ Frankfurter API 환율로 추정값 저장
       is_estimated_rate = true 플래그 표시
```

### 스키마에 반영

```sql
krw_amount        integer,      -- 실제 차감 원화 (가장 정확)
exchange_rate     numeric(15,4), -- 적용 환율 (역산 또는 추정)
is_estimated_rate boolean default false -- 추정 환율 여부
```

이렇게 하면 토스뱅크 실제 환율 기준으로 정확하게 집계되고, 추정치인 경우 대시보드에서 `*` 표시 같은 것으로 사용자에게 알려줄 수도 있습니다.

이 방향으로 반영할까요?

---

**User:**
응, 반영해서 계속 진행해줘

---

**Assistant:**
## Section 3: 주요 기능 흐름

### 3-1. 오픈뱅킹 연동 (최초 1회)

```
사용자 → "계좌 연동하기" 클릭
      │
      ▼
금융결제원 OAuth 페이지로 리다이렉트
  (본인 인증 + 토스뱅크 계좌 선택)
      │
      ▼
/auth/callback?code=xxxx 로 리다이렉트
      │
      ▼
Next.js API Route: code → access_token + refresh_token 교환
      │
      ▼
Supabase: open_banking_tokens 테이블에 저장
      │
      ▼
pg_cron 자동 시작 (5분마다 폴링)
```

### 3-2. 거래내역 폴링 (5분마다 자동)

```
pg_cron → Supabase Edge Function 호출
      │
      ▼
open_banking_tokens에서 유효한 토큰 조회
  ├── expires_at 임박? → refresh_token으로 갱신 후 진행
  └── 정상 → 그대로 진행
      │
      ▼
오픈뱅킹 API: 마지막 조회 이후 거래내역 요청
      │
      ▼
각 거래건 처리:
  ├── currency = KRW?
  │     └── krw_amount = amount, exchange_rate = 1, is_estimated_rate = false
  └── 외화?
        ├── KRW 차감액 확인 가능? → krw_amount 직접 저장, 환율 역산
        └── KRW 차감액 없음? → Frankfurter API로 환율 추정, is_estimated_rate = true
      │
      ▼
transactions 테이블에 upsert
  (transaction_id unique 제약으로 중복 자동 방지)
```

### 3-3. 대시보드 조회

```
사용자 → /dashboard 접근
      │
      ▼
Supabase Auth JWT 검증 (미로그인 시 /login 리다이렉트)
      │
      ▼
Next.js Server Component에서 Supabase 직접 쿼리
  ├── 일별 집계: 오늘 날짜 기준 24시간
  ├── 주별 집계: 이번 주 월~일
  └── 월별 집계: 이번 달 1일~말일
      │
      ▼
통화 선택 (전체 KRW 환산 | GBP | USD | ...)에 따라
  ├── 전체: krw_amount 합산
  └── 특정 통화: amount WHERE currency = 'GBP' 합산
      │
      ▼
Recharts로 차트 렌더링
```

흐름이 자연스러워 보이시나요? 다음으로 **대시보드 UI 구성**으로 넘어갈까요?

---

**User:**
회원가입/로그인은 언제 해?

---

**Assistant:**
맞습니다, 빠뜨렸네요. 전체 사용자 여정에 추가하겠습니다.

### 완성된 사용자 여정

```
첫 방문
  │
  ▼
/login 페이지
  ├── 계정 없음 → 회원가입 → 이메일 인증 → 로그인
  └── 계정 있음 → 로그인
  │
  ▼
/dashboard 리다이렉트
  │
  ├── 오픈뱅킹 미연동 상태?
  │     └── "계좌 연동하기" 배너 표시
  │           └── 클릭 → 금융결제원 OAuth → 연동 완료 → 폴링 시작
  │
  └── 오픈뱅킹 연동 완료 상태?
        └── 차트 + 거래내역 바로 표시
```

### 페이지 구조

| 경로 | 설명 | 인증 필요 |
|---|---|---|
| `/login` | 로그인 + 회원가입 | X |
| `/dashboard` | 메인 대시보드 | O |
| `/auth/callback` | 오픈뱅킹 OAuth 콜백 | O |
| `/settings` | 계좌 연동 관리, 로그아웃 | O |

인증이 필요한 페이지에 미로그인 상태로 접근하면 자동으로 `/login`으로 리다이렉트됩니다. Next.js middleware로 한 곳에서 처리합니다.

이렇게 반영해서 다음 **대시보드 UI 구성**으로 넘어갈까요?

---

**User:**
지출내역 조회 페이지도 필요해

---

**Assistant:**
반영하겠습니다. 페이지 구조를 업데이트합니다.

| 경로 | 설명 | 인증 필요 |
|---|---|---|
| `/login` | 로그인 + 회원가입 | X |
| `/dashboard` | 메인 대시보드 (차트) | O |
| `/transactions` | 지출내역 목록 조회 | O |
| `/auth/callback` | 오픈뱅킹 OAuth 콜백 | O |
| `/settings` | 계좌 연동 관리, 로그아웃 | O |

---

`/transactions` 페이지에서 어떤 기능이 필요한가요?

- **A) 기본** - 날짜순 목록, 가맹점명, 금액, 통화 표시
- **B) 중간** - A + 날짜/통화 필터, 검색
- **C) 풍부하게** - B + 카테고리 필터, 페이지네이션, 각 거래건 상세 보기

---

**User:**
A > B > C순으로 고도화. 현재는 A를 먼저 구현. 그리고 지출내역 항목에 영수증 이미지도 첨부할 수 있게 해줘

---

**Assistant:**
반영하겠습니다. 영수증 이미지 저장은 Supabase Storage를 사용하면 됩니다. 이미 Supabase를 쓰고 있으니 별도 서비스 추가 없이 해결됩니다.

스키마에 추가됩니다:

```sql
create table public.transactions (
  ...
  receipt_url  text,  -- Supabase Storage 이미지 경로
  ...
);
```

흐름은 이렇습니다:

```
사용자 → 거래 항목에서 영수증 첨부
      │
      ▼
이미지 → Supabase Storage 업로드
      │ (storage/receipts/{user_id}/{transaction_id}.jpg)
      ▼
transactions.receipt_url 업데이트
```

이제 대시보드 UI 구성으로 넘어가겠습니다.

## Section 4: UI 구성

### `/dashboard` - 메인 대시보드

```
┌─────────────────────────────────────────┐
│  Smart Money Tracker        [설정] [로그아웃] │
├─────────────────────────────────────────┤
│  이번 달 총 지출                           │
│  £ 1,243.50   ₩ 2,130,450              │
│  [통화 선택: 전체 | GBP | USD | KRW]      │
├─────────────────────────────────────────┤
│  [일별] [주별] [월별]                      │
│                                         │
│  ▲                                      │
│  │   ██                                 │
│  │   ██  ██                             │
│  │██  ██  ██  ██                        │
│  └─────────────────→                   │
│   월  화  수  목  금  토  일              │
├─────────────────────────────────────────┤
│  최근 지출내역          [전체보기 →]       │
│  Tesco         £ 12.50   2025.02.18    │
│  TfL           £  3.80   2025.02.17    │
│  Amazon        £ 24.99   2025.02.17    │
└─────────────────────────────────────────┘
```

### `/transactions` - 지출내역 목록 (1단계: A)

```
┌─────────────────────────────────────────┐
│  지출내역                    [← 대시보드]  │
├─────────────────────────────────────────┤
│  2025년 2월 18일                         │
│  ┌─────────────────────────────────┐   │
│  │ Tesco              £ 12.50     │   │
│  │ 2025.02.18 14:32   ₩ 21,400   │   │
│  │ [영수증 없음 - 첨부하기]          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ TfL                 £  3.80    │   │
│  │ 2025.02.18 09:15   ₩  6,506   │   │
│  │ [📎 영수증 보기]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  2025년 2월 17일                         │
│  ...                                    │
└─────────────────────────────────────────┘
```

UI 구성이 괜찮아 보이시나요? 다음은 마지막 섹션인 **에러 처리 & 테스트 전략**으로 넘어갈까요?

---

**User:**
응

---

**Assistant:**
## Section 5: 에러 처리 & 테스트 전략

### 에러 처리

**오픈뱅킹 API 관련**

| 상황 | 처리 방법 |
|---|---|
| access_token 만료 | refresh_token으로 자동 갱신, 갱신 실패 시 재연동 유도 |
| 오픈뱅킹 API 일시 장애 | 폴링 실패 횟수 기록, 3회 연속 실패 시 사용자에게 알림 |
| 중복 거래 저장 시도 | `transaction_id` unique 제약으로 DB 레벨에서 자동 차단 |

**환율 API 관련**

| 상황 | 처리 방법 |
|---|---|
| Frankfurter API 응답 없음 | `is_estimated_rate = true` + `krw_amount = null` 로 저장, 나중에 재시도 |
| KRW 환산 불가 거래 | 대시보드에서 해당 건은 외화 금액만 표시, `*` 표시로 사용자 안내 |

**인증 관련**

| 상황 | 처리 방법 |
|---|---|
| 미로그인 접근 | Next.js middleware에서 `/login` 리다이렉트 |
| 세션 만료 | Supabase Auth 자동 갱신, 갱신 불가 시 재로그인 유도 |

### 테스트 전략

금융 데이터를 다루기 때문에 계산 로직 위주로 테스트합니다.

**단위 테스트 (Vitest)**
- 환율 계산 로직 (실제 환율 역산, 추정 환율 적용)
- 일별/주별/월별 집계 함수
- 오픈뱅킹 API 응답 파싱 함수

**통합 테스트**
- 오픈뱅킹 OAuth 흐름 (mock 서버 사용)
- 폴링 → DB 저장 → 대시보드 조회 전체 흐름

**E2E 테스트 (Playwright)**
- 로그인 → 계좌 연동 → 대시보드 확인
- 지출내역 조회 + 영수증 첨부

전체 설계 섹션이 완료됐습니다. 전체 내용을 한 번 정리해드릴까요?

---

**User:**
응

---

**Assistant:**
## 전체 설계 요약

### 기술 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 차트 | Recharts |
| 백엔드 | Next.js API Routes |
| 데이터베이스 | Supabase (PostgreSQL) |
| 파일 저장 | Supabase Storage (영수증 이미지) |
| 스케줄러 | Supabase pg_cron + Edge Function |
| 인증 | Supabase Auth |
| 환율 | Frankfurter API (무료, 과거 환율 지원) |
| 배포 | Vercel |

### 데이터베이스 스키마

```sql
profiles               -- 사용자 정보
open_banking_tokens    -- 오픈뱅킹 access/refresh 토큰
transactions           -- 거래내역
  ├── amount           numeric(15,2)   외화 금액
  ├── currency         char(3)         ISO 통화 코드
  ├── exchange_rate    numeric(15,4)   적용 환율
  ├── krw_amount       integer         원화 환산 금액
  ├── is_estimated_rate boolean        추정 환율 여부
  ├── category         text            카테고리
  └── receipt_url      text            영수증 이미지 경로
```

### 페이지 구조

| 경로 | 설명 | 인증 |
|---|---|---|
| `/login` | 로그인 + 회원가입 | X |
| `/dashboard` | 차트 대시보드 | O |
| `/transactions` | 지출내역 목록 + 영수증 첨부 | O |
| `/auth/callback` | 오픈뱅킹 OAuth 콜백 | O |
| `/settings` | 계좌 연동 관리, 로그아웃 | O |

### 핵심 기능 흐름

1. **인증** - 회원가입 → 로그인 → 미인증 접근 시 자동 리다이렉트
2. **계좌 연동** - 오픈뱅킹 OAuth → 토큰 저장 → 폴링 자동 시작
3. **자동 동기화** - pg_cron 5분마다 → Edge Function → 오픈뱅킹 API → DB 저장
4. **환율 처리** - 실제 차감 원화 우선 → 없으면 Frankfurter API 추정값
5. **대시보드** - 일별/주별/월별 차트, 통화별 집계 전환
6. **지출내역** - 날짜순 목록, 영수증 이미지 첨부

### 고도화 로드맵

| 단계 | 내용 |
|---|---|
| 1단계 (현재) | 기본 차트, 지출내역 목록, 영수증 첨부 |
| 2단계 | 카테고리별 분류, 가맹점 순위, 거래내역 필터/검색 |
| 3단계 | 예산 설정/초과 알림, 전월 대비 비교, 멀티유저 공개 서비스 |

이 설계 내용에 수정하거나 추가할 사항이 있으신가요? 없으면 설계 문서로 저장하고 구현 계획 작성으로 넘어가겠습니다.

---

**User:**
응 그렇게 해줘

---

**Assistant:**
설계 문서가 `docs/plans/2026-02-18-smart-money-tracker-design.md`에 저장되고 커밋됐습니다. 이제 구현 계획 작성으로 넘어가겠습니다.

*(구현 계획은 `docs/plans/2026-02-18-smart-money-tracker.md` 참조)*

---

**Assistant:**
구현 계획이 `docs/plans/2026-02-18-smart-money-tracker.md`에 저장됐습니다.

## 계획 요약 (13개 Task)

| Task | 내용 |
|---|---|
| 1 | Next.js 프로젝트 초기화 + 의존성 설치 |
| 2 | Supabase 스키마 마이그레이션 + RLS |
| 3 | Supabase 클라이언트 설정 (브라우저/서버/미들웨어) |
| 4 | 인증 미들웨어 (미로그인 → /login 리다이렉트) |
| 5 | 로그인/회원가입 페이지 |
| 6 | 환율 계산 유틸리티 (TDD) |
| 7 | 지출 집계 유틸리티 (TDD) |
| 8 | 오픈뱅킹 OAuth 연동 + Settings 페이지 |
| 9 | 폴링 Edge Function + pg_cron |
| 10 | 대시보드 페이지 (차트) |
| 11 | 지출내역 페이지 + 영수증 업로드 |
| 12 | E2E 테스트 (Playwright) |
| 13 | 전체 검증 + Vercel 배포 |

구현을 어떻게 진행할까요?

**1. 서브에이전트 방식 (이 세션)** - 각 Task마다 새로운 서브에이전트가 구현하고, 중간에 검토하면서 진행. 빠른 반복 가능.

**2. 별도 세션 방식** - 새 Claude Code 세션을 열고 `executing-plans` 스킬로 계획을 단계적으로 실행. 체크포인트마다 확인.

어떤 방식으로 진행하시겠어요?

---

**User:**
2

---

**Assistant:**
별도 세션 방식으로 진행하겠습니다. 아래 순서대로 따라하세요.

## 새 세션 시작 방법

**Step 1: 새 Claude Code 세션 열기**

현재 프로젝트 디렉토리에서 새 터미널을 열고:

```bash
cd /Users/highmoon/Documents/projects/smart-money-tracker
claude
```

**Step 2: 새 세션에서 아래 메시지를 그대로 붙여넣기**

```
/executing-plans docs/plans/2026-02-18-smart-money-tracker.md
```

그러면 `executing-plans` 스킬이 로드되어 Task 1부터 순서대로 체크포인트마다 확인하면서 구현을 진행합니다.

## 시작 전 체크리스트

구현 시작 전 아래 두 가지를 먼저 준비해두세요:

- [ ] **Supabase 프로젝트 생성** - https://supabase.com → Project URL, anon key, service_role key 메모
- [ ] **금융결제원 오픈뱅킹 테스트 앱 신청** - https://developers.openbanking.or.kr → client_id, client_secret 발급

이 두 가지가 없으면 Task 2, 8, 9에서 막힙니다.
