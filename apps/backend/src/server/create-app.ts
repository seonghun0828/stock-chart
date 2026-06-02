import express from 'express';
import { readEnv } from '../config/env';
import { getHealthStatus } from './routes/health';
import { getMarketSnapshot } from './routes/market';
import type { MarketServiceLike } from './types';

export function createApp(marketService: MarketServiceLike) {
  const app = express();
  const env = readEnv();

  app.use((request, response, next) => {
    response.header('Access-Control-Allow-Origin', env.FRONTEND_ORIGIN);
    response.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
    response.header('Access-Control-Allow-Headers', 'Content-Type');

    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.get('/api/market', (request, response) =>
    getMarketSnapshot(marketService, request, response),
  );
  app.get('/api/health', (request, response) =>
    getHealthStatus(marketService, request, response),
  );

  return app;
}
