import { describe, expect, it } from 'vitest';
import { createLsClients } from '../create-ls-clients';

describe('createLsClients', () => {
  it('returns mock clients when USE_MOCK_LS is true', () => {
    const clients = createLsClients({
      BACKEND_PORT: '4000',
      USE_MOCK_LS: 'true',
      LS_APP_KEY: undefined,
      LS_APP_SECRET: undefined,
      LS_BASE_URL: undefined,
      LS_WS_URL: undefined,
    });

    expect(clients.restClient).toBeDefined();
    expect(clients.realtimeClient).toBeDefined();
  });
});
