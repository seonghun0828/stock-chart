import express from 'express';
import { getHealthStatus } from './routes/health';
import { getMarketSnapshot } from './routes/market';
import type { MarketServiceLike } from './types';

export function createApp(marketService: MarketServiceLike) {
  const app = express();

  app.get('/api/market', (request, response) =>
    getMarketSnapshot(marketService, request, response),
  );
  app.get('/api/health', (request, response) =>
    getHealthStatus(marketService, request, response),
  );

  return app;
}
