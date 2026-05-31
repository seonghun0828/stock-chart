# stock-chart

LS증권 모의투자 API 기반의 6개 섹터 실시간 마켓중심 카피 과제 저장소다.

## Apps

- `apps/frontend`: Vite + React + TypeScript
- `apps/backend`: Express + WebSocket + TypeScript

## Local Setup

1. `COREPACK_HOME=$PWD/.cache-corepack pnpm install`
2. `cp .env.example apps/backend/.env`
3. `cp .env.example apps/frontend/.env`
4. `COREPACK_HOME=$PWD/.cache-corepack pnpm dev:backend`
5. `COREPACK_HOME=$PWD/.cache-corepack pnpm dev:frontend`
6. Open `http://localhost:5173`

기본값은 `USE_MOCK_LS=true`라서 LS API 키가 없어도 UI와 정렬 로직 개발이 가능하다.

## Verification

- `COREPACK_HOME=$PWD/.cache-corepack pnpm test`
- `COREPACK_HOME=$PWD/.cache-corepack pnpm build`

## Environment

백엔드:

- `BACKEND_PORT`
- `LS_APP_KEY`
- `LS_APP_SECRET`
- `LS_BASE_URL`
- `LS_WS_URL`
- `USE_MOCK_LS`

프론트:

- `VITE_API_BASE_URL`
- `VITE_WS_URL`
