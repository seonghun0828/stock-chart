import { readEnv } from '../config/env';
import type { TrackedStock } from '../config/sectors';
import { RealLsRestClient } from './ls-rest-client';
import { RealLsSectorClient } from './ls-sector-client';
import { RealLsRealtimeClient } from './ls-websocket-client';
import {
  MockLsRealtimeClient,
  MockLsRestClient,
} from '../services/market-service';

export function createLsClients(
  env = readEnv(),
  trackedStocks: TrackedStock[] = [],
) {
  if (env.USE_MOCK_LS === 'true') {
    return {
      restClient: new MockLsRestClient(),
      realtimeClient: new MockLsRealtimeClient(),
      sectorClient: null,
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
    sectorClient: new RealLsSectorClient(getAccessToken, env.LS_BASE_URL),
  };
}

function createAccessTokenProvider(env: ReturnType<typeof readEnv>) {
  let accessToken: string | null = null;
  let accessTokenExpiresAt = 0;

  return async () => {
    if (accessToken && Date.now() < accessTokenExpiresAt) {
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
    accessTokenExpiresAt = getNextTokenRefreshTime(Date.now());
    return accessToken;
  };
}

export function getNextTokenRefreshTime(now: number) {
  const nowDate = new Date(now);
  const seoulParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(nowDate);
  const values = new Map(seoulParts.map((part) => [part.type, part.value]));
  const year = Number(values.get('year'));
  const month = Number(values.get('month'));
  const day = Number(values.get('day'));
  const hour = Number(values.get('hour'));
  const minute = Number(values.get('minute'));
  const totalMinutes = hour * 60 + minute;
  const refreshDay = totalMinutes < 6 * 60 + 50 ? day : day + 1;

  return Date.UTC(year, month - 1, refreshDay, 6 - 9, 50, 0);
}
