import { describe, expect, it } from 'vitest';
import { getHealthStatus } from '../routes/health';
import { getMarketSnapshot } from '../routes/market';
import type { MarketServiceLike } from '../types';

const marketService: MarketServiceLike = {
  getSnapshot() {
    return {
      sectors: [],
      lastUpdatedAt: '2026-05-31T12:00:00.000Z',
      connectionStatus: 'open',
    };
  },
  getHealth() {
    return {
      status: 'ok',
      lsAuth: 'ready',
      lsWebSocket: 'open',
    };
  },
};

describe('market routes', () => {
  it('returns a market snapshot from /api/market', () => {
    const response = createResponse();

    getMarketSnapshot(marketService, {} as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      sectors: [],
      connectionStatus: 'open',
    });
  });

  it('returns health status from /api/health', () => {
    const response = createResponse();

    getHealthStatus(marketService, {} as never, response as never);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      lsAuth: 'ready',
      lsWebSocket: 'open',
    });
  });
});

function createResponse() {
  return {
    body: null as unknown,
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}
