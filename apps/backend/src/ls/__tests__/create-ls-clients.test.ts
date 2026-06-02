import { describe, expect, it } from 'vitest';
import { createLsClients } from '../create-ls-clients';
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
