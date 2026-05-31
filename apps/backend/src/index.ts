import { createServer } from 'node:http';
import { createEmptyMarketState } from './domain/market-state';
import { buildMarketSnapshot } from './domain/sort-market';
import { createApp } from './server/create-app';
import { createMarketWebSocketServer } from './server/create-websocket';
import type { MarketServiceLike } from './server/types';

const port = Number(process.env.BACKEND_PORT ?? 4000);
const state = createEmptyMarketState();

const marketService: MarketServiceLike = {
  getSnapshot() {
    return buildMarketSnapshot(state);
  },
  getHealth() {
    return {
      status: 'degraded',
      lsAuth: process.env.LS_APP_KEY ? 'ready' : 'missing',
      lsWebSocket: state.connectionStatus,
    };
  },
};

const app = createApp(marketService);
const server = createServer(app);

createMarketWebSocketServer(server, marketService);

server.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
