import { describe, expect, it } from 'vitest';
import { createLsClients, getNextTokenRefreshTime } from '../create-ls-clients';
import { getTrackedStocks } from '../../config/sectors';

describe('createLsClients', () => {
  it('returns mock clients when USE_MOCK_LS is true', () => {
    const clients = createLsClients({
      BACKEND_HOST: '127.0.0.1',
      BACKEND_PORT: '4000',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      USE_MOCK_LS: 'true',
      LS_APP_KEY: undefined,
      LS_APP_SECRET: undefined,
      LS_BASE_URL: undefined,
      LS_WS_URL: undefined,
    }, getTrackedStocks());

    expect(clients.restClient).toBeDefined();
    expect(clients.realtimeClient).toBeDefined();
    expect(clients.sectorClient).toBeNull();
  });
});

describe('getNextTokenRefreshTime', () => {
  it('returns the next 06:50 KST refresh boundary', () => {
    expect(getNextTokenRefreshTime(Date.parse('2026-06-15T00:10:00.000Z'))).toBe(
      Date.parse('2026-06-15T21:50:00.000Z'),
    );
  });

  it('uses the same-day 06:50 KST boundary before it has passed', () => {
    expect(getNextTokenRefreshTime(Date.parse('2026-06-14T21:00:00.000Z'))).toBe(
      Date.parse('2026-06-14T21:50:00.000Z'),
    );
  });
});
