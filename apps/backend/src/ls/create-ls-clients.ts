import { readEnv } from '../config/env';
import { getTrackedStocks } from '../config/sectors';
import { RealLsRestClient } from './ls-rest-client';
import { RealLsRealtimeClient } from './ls-websocket-client';
import {
  MockLsRealtimeClient,
  MockLsRestClient,
} from '../services/market-service';

export function createLsClients(env = readEnv()) {
  const trackedStocks = getTrackedStocks();

  if (env.USE_MOCK_LS === 'true') {
    return {
      restClient: new MockLsRestClient(),
      realtimeClient: new MockLsRealtimeClient(),
    };
  }

  const getAccessToken = createAccessTokenProvider(env);

  return {
    restClient: new RealLsRestClient(trackedStocks, getAccessToken, env.LS_BASE_URL),
    realtimeClient: new RealLsRealtimeClient(
      trackedStocks,
      getAccessToken,
      env.LS_WS_URL,
    ),
  };
}

function createAccessTokenProvider(env: ReturnType<typeof readEnv>) {
  let accessToken: string | null = null;

  return async () => {
    if (accessToken) {
      return accessToken;
    }

    if (!env.LS_APP_KEY || !env.LS_APP_SECRET) {
      throw new Error('LS_APP_KEY and LS_APP_SECRET are required for real LS mode.');
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      appkey: env.LS_APP_KEY,
      appsecretkey: env.LS_APP_SECRET,
      scope: 'oob',
    });

    const response = await fetch(
      `${(env.LS_BASE_URL ?? 'https://openapi.ls-sec.co.kr:8080').replace(/\/$/, '')}/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to issue LS access token: ${response.status}`);
    }

    const payload = (await response.json()) as { access_token?: string };
    if (!payload.access_token) {
      throw new Error('LS access token response did not include access_token.');
    }

    accessToken = payload.access_token;
    return accessToken;
  };
}
