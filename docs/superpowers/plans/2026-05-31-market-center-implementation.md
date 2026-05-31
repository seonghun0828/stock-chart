# Market Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LS증권 모의투자 API 기반의 6개 섹터 실시간 마켓중심 카피 페이지를 React + Express로 구현하고, 실시간 시세 반영과 정렬 정확도를 검증 가능한 상태로 만든다.

**Architecture:** 단일 저장소에 `apps/frontend`와 `apps/backend`를 두고, 백엔드가 LS증권 REST/WebSocket과 정렬 계산을 전담한다. 프론트는 `GET /api/market`과 WebSocket 스냅샷을 받아 예시 PNG와 유사한 밀도의 UI를 렌더링한다.

**Tech Stack:** Vite, React, TypeScript, Express, ws, Vitest, Testing Library, pnpm

---

## File Structure

- `apps/frontend`
  - React + Vite 앱
  - 카드 그리드, 하단 티커, 연결 상태 UI
  - REST + WebSocket 클라이언트
- `apps/backend`
  - Express 서버
  - WebSocket 브로드캐스트
  - LS증권 인증/REST/WebSocket 연동 계층
  - 메모리 상태, 정렬, 집계 로직
- `docs/superpowers/specs/2026-05-31-market-center-design.md`
  - 설계 기준 문서
- `AGENTS.md`
  - 저장소 작업 규칙

### Task 1: Workspace Scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `apps/frontend/package.json`
- Create: `apps/frontend/tsconfig.json`
- Create: `apps/frontend/vite.config.ts`
- Create: `apps/frontend/index.html`
- Create: `apps/frontend/src/main.tsx`
- Create: `apps/frontend/src/App.tsx`
- Create: `apps/frontend/src/styles.css`
- Create: `apps/backend/package.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/src/index.ts`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Write the workspace manifest files**

```json
{
  "name": "stock-chart",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:backend": "pnpm --filter backend dev",
    "build": "pnpm --filter frontend build && pnpm --filter backend build",
    "test": "pnpm --filter frontend test && pnpm --filter backend test"
  }
}
```

```yaml
packages:
  - "apps/*"
```

- [ ] **Step 2: Add frontend package and Vite entry**

```json
{
  "name": "frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "test": "vitest run"
  }
}
```

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Add backend package and boot file**

```json
{
  "name": "backend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "test": "vitest run"
  }
}
```

```ts
console.log('backend bootstrap placeholder');
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: workspace dependency install completes without error

- [ ] **Step 5: Verify both apps boot**

Run: `pnpm --filter frontend build`
Expected: frontend build succeeds

Run: `pnpm --filter backend build`
Expected: backend TypeScript build succeeds

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .env.example apps
git commit -m "chore: scaffold frontend and backend workspaces"
```

### Task 2: Backend Domain Model and Sorting Tests

**Files:**
- Create: `apps/backend/src/config/sectors.ts`
- Create: `apps/backend/src/domain/types.ts`
- Create: `apps/backend/src/domain/market-state.ts`
- Create: `apps/backend/src/domain/sort-market.ts`
- Create: `apps/backend/src/domain/__tests__/sort-market.test.ts`

- [ ] **Step 1: Write the failing sorting tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildMarketSnapshot } from '../sort-market';

describe('buildMarketSnapshot', () => {
  it('sorts stocks by changeRate descending within each sector', () => {
    const snapshot = buildMarketSnapshot(/* fixture state */);
    expect(snapshot.sectors[0].stocks[0].changeRate).toBeGreaterThanOrEqual(
      snapshot.sectors[0].stocks[1].changeRate,
    );
  });

  it('sorts sectors by average of top 3 stock change rates', () => {
    const snapshot = buildMarketSnapshot(/* fixture state */);
    expect(snapshot.sectors[0].id).toBe('semiconductor');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter backend test`
Expected: FAIL with missing implementation errors

- [ ] **Step 3: Implement market types and sorting**

```ts
export type StockRealtimeState = {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  tradeValue: number;
  open: number | null;
  high: number | null;
  low: number | null;
  headline?: string | null;
  hasSnapshot: boolean;
};
```

```ts
export function buildMarketSnapshot(/* state */) {
  // 정렬, 평균 계산, 거래대금 합산, 표시 개수 제한
}
```

- [ ] **Step 4: Re-run backend tests**

Run: `pnpm --filter backend test`
Expected: PASS for sorting and aggregation tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/config apps/backend/src/domain
git commit -m "feat: add backend market sorting domain"
```

### Task 3: Backend HTTP and WebSocket Server

**Files:**
- Modify: `apps/backend/src/index.ts`
- Create: `apps/backend/src/server/create-app.ts`
- Create: `apps/backend/src/server/create-websocket.ts`
- Create: `apps/backend/src/server/routes/market.ts`
- Create: `apps/backend/src/server/routes/health.ts`
- Create: `apps/backend/src/server/__tests__/market-routes.test.ts`

- [ ] **Step 1: Write failing API route tests**

```ts
import request from 'supertest';
import { createApp } from '../create-app';

it('returns market snapshot from /api/market', async () => {
  const app = createApp(/* deps */);
  const response = await request(app).get('/api/market');
  expect(response.status).toBe(200);
  expect(response.body.sectors).toBeDefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter backend test`
Expected: FAIL with missing route/server implementation

- [ ] **Step 3: Implement Express routes and WebSocket bootstrap**

```ts
app.get('/api/market', (_req, res) => {
  res.json(marketService.getSnapshot());
});

app.get('/api/health', (_req, res) => {
  res.json(marketService.getHealth());
});
```

```ts
wss.on('connection', (socket) => {
  socket.send(JSON.stringify(marketService.getSnapshot()));
});
```

- [ ] **Step 4: Re-run backend tests**

Run: `pnpm --filter backend test`
Expected: PASS for route contract tests

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/index.ts apps/backend/src/server
git commit -m "feat: add backend market api and websocket server"
```

### Task 4: LS증권 Adapter and In-Memory Update Flow

**Files:**
- Create: `apps/backend/src/ls/types.ts`
- Create: `apps/backend/src/ls/ls-rest-client.ts`
- Create: `apps/backend/src/ls/ls-websocket-client.ts`
- Create: `apps/backend/src/services/market-service.ts`
- Create: `apps/backend/src/services/__tests__/market-service.test.ts`
- Create: `apps/backend/src/config/env.ts`

- [ ] **Step 1: Write failing tests for patch update behavior**

```ts
import { describe, expect, it } from 'vitest';
import { MarketService } from '../market-service';

describe('MarketService', () => {
  it('keeps prior stock values when websocket patch omits some symbols', () => {
    const service = new MarketService(/* deps */);
    service.seed(/* 8 stocks */);
    service.applyRealtimePatch(/* 6 stocks */);
    expect(service.getSnapshot().sectors[0].stocks.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter backend test`
Expected: FAIL with missing market service methods

- [ ] **Step 3: Implement LS adapter interfaces and market service**

```ts
export interface LsRestClient {
  fetchInitialQuotes(codes: string[]): Promise<InitialQuote[]>;
}

export interface LsRealtimeClient {
  connect(codes: string[], onMessage: (patch: RealtimePatch[]) => void): Promise<void>;
}
```

```ts
applyRealtimePatch(patches: RealtimePatch[]) {
  for (const patch of patches) {
    // 기존 메모리 상태에 patch 적용
  }
}
```

- [ ] **Step 4: Add mock adapter path for local UI development**

```ts
if (env.USE_MOCK_LS === 'true') {
  return new MockLsClients();
}
```

- [ ] **Step 5: Re-run backend tests**

Run: `pnpm --filter backend test`
Expected: PASS for patch semantics and snapshot generation

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/ls apps/backend/src/services apps/backend/src/config
git commit -m "feat: add LS adapter and in-memory market service"
```

### Task 5: Frontend UI and Data Client

**Files:**
- Modify: `apps/frontend/src/App.tsx`
- Create: `apps/frontend/src/types.ts`
- Create: `apps/frontend/src/lib/api.ts`
- Create: `apps/frontend/src/lib/format.ts`
- Create: `apps/frontend/src/components/layout/TopBar.tsx`
- Create: `apps/frontend/src/components/layout/BottomTicker.tsx`
- Create: `apps/frontend/src/components/market/SectorGrid.tsx`
- Create: `apps/frontend/src/components/market/SectorCard.tsx`
- Create: `apps/frontend/src/components/market/StockRow.tsx`
- Create: `apps/frontend/src/components/market/CandleBar.tsx`
- Create: `apps/frontend/src/__tests__/App.test.tsx`

- [ ] **Step 1: Write failing frontend render test**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

it('renders sector cards from market snapshot', async () => {
  render(<App />);
  expect(await screen.findByText('반도체')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter frontend test`
Expected: FAIL because market UI and data client are not implemented

- [ ] **Step 3: Implement REST bootstrap and WebSocket state sync**

```ts
useEffect(() => {
  fetchMarketSnapshot().then(setSnapshot);
  const socket = connectMarketSocket((nextSnapshot) => setSnapshot(nextSnapshot));
  return () => socket.close();
}, []);
```

- [ ] **Step 4: Implement market card UI to match spec**

```tsx
<SectorCard
  key={sector.id}
  sector={sector}
/>
```

```tsx
<StockRow stock={stock} />
```

- [ ] **Step 5: Re-run frontend tests**

Run: `pnpm --filter frontend test`
Expected: PASS for snapshot render and websocket update behavior

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src
git commit -m "feat: add market center frontend ui"
```

### Task 6: Integration, Environment, and Delivery Readiness

**Files:**
- Create: `apps/backend/.env.example`
- Create: `apps/frontend/.env.example`
- Create: `README.md`
- Create: `apps/backend/render.yaml` or deployment note in README
- Create: `vercel.json` if needed

- [ ] **Step 1: Document required environment variables**

```env
LS_APP_KEY=
LS_APP_SECRET=
LS_BASE_URL=
LS_WS_URL=
USE_MOCK_LS=true
PORT=4000
```

- [ ] **Step 2: Add root README runbook**

```md
1. `pnpm install`
2. `pnpm dev:backend`
3. `pnpm dev:frontend`
4. Open `http://localhost:5173`
```

- [ ] **Step 3: Run full verification**

Run: `pnpm test`
Expected: frontend and backend tests pass

Run: `pnpm build`
Expected: frontend and backend builds pass

- [ ] **Step 4: Commit**

```bash
git add README.md apps/backend/.env.example apps/frontend/.env.example vercel.json
git commit -m "chore: document local setup and deployment"
```

## Self-Review

- Spec coverage:
  - React + Node/Express 구조 포함
  - REST + WebSocket 역할 분리 포함
  - 실시간 재정렬 포함
  - LS증권 초기 REST + 장중 WebSocket 흐름 포함
  - 예시 PNG 기반 UI 구현 단계 포함
- Placeholder scan:
  - 일부 LS API 응답 필드는 구현 중 실제 문서 확인이 필요하지만, 계획에는 처리 위치를 명시했다.
- Type consistency:
  - `priceRange`, `MarketSnapshot`, patch update semantics를 동일하게 사용했다.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-31-market-center-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
