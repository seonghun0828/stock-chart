import { readEnv } from '../config/env';
import {
  MockLsRealtimeClient,
  MockLsRestClient,
} from '../services/market-service';

export function createLsClients(env = readEnv()) {
  if (env.USE_MOCK_LS === 'true') {
    return {
      restClient: new MockLsRestClient(),
      realtimeClient: new MockLsRealtimeClient(),
    };
  }

  throw new Error('Real LS clients are not implemented yet.');
}
