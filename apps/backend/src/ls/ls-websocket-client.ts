import type { RealtimePatch } from './types';
import type { SectorId, MarketCategory } from '../config/sectors';
import { readEnv } from '../config/env';
import { WebSocket } from 'ws';

const REALTIME_RECONNECT_DELAY_MS = 3000;
const REALTIME_INACTIVITY_TIMEOUT_MS = 60000;

export interface LsRealtimeClient {
  connect(
    codes: string[],
    onMessage: (patches: RealtimePatch[]) => void,
  ): Promise<void>;
}

type TokenProvider = () => Promise<string>;

type TrackedStockRef = {
  code: string;
  market?: MarketCategory;
  sectorId: SectorId;
  sectorName: string;
};

export class RealLsRealtimeClient implements LsRealtimeClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private currentCodes: string[] = [];
  private currentOnMessage: ((patches: RealtimePatch[]) => void) | null = null;
  private readonly trackedByCode: Map<string, TrackedStockRef>;
  private readonly wsUrl: string;

  constructor(
    trackedStocks: TrackedStockRef[],
    private readonly getAccessToken: TokenProvider,
    wsUrl = readEnv().LS_WS_URL ?? 'wss://openapi.ls-sec.co.kr:29443/websocket',
    private readonly websocketFactory: (url: string) => WebSocket = (url) => new WebSocket(url),
    private readonly scheduleTimeout: typeof setTimeout = setTimeout,
    private readonly clearScheduledTimeout: typeof clearTimeout = clearTimeout,
  ) {
    this.trackedByCode = new Map(trackedStocks.map((stock) => [stock.code, stock]));
    this.wsUrl = wsUrl;
  }

  async connect(codes: string[], onMessage: (patches: RealtimePatch[]) => void) {
    this.currentCodes = [...codes];
    this.currentOnMessage = onMessage;
    await this.openSocket(codes, onMessage);
  }

  private async openSocket(codes: string[], onMessage: (patches: RealtimePatch[]) => void) {
    const token = await this.getAccessToken();

    await new Promise<void>((resolve, reject) => {
      const socket = this.websocketFactory(this.wsUrl);
      this.socket = socket;
      let settled = false;

      socket.once('open', () => {
        for (const code of codes) {
          const tracked = this.trackedByCode.get(code);
          if (!tracked) {
            continue;
          }

          for (const request of buildRealtimeSubscriptionRequests(code, tracked)) {
            socket.send(
              JSON.stringify({
                header: {
                  token,
                  tr_type: '3',
                },
                body: request,
              }),
            );
          }
        }
        settled = true;
        this.resetInactivityTimer();
        resolve();
      });

      socket.on('message', (data) => {
        const patches = parseRealtimeMessage(String(data));
        if (patches.length > 0) {
          this.resetInactivityTimer();
          onMessage(patches);
        }
      });

      socket.once('error', (error) => {
        if (!settled) {
          reject(error);
        }
        this.clearInactivityTimer();
        this.scheduleReconnect();
      });

      socket.once('close', () => {
        if (this.socket === socket) {
          this.socket = null;
        }

        if (!settled) {
          reject(new Error('LS realtime socket closed before it connected'));
        }

        this.clearInactivityTimer();
        this.scheduleReconnect();
      });
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || !this.currentOnMessage || this.currentCodes.length === 0) {
      return;
    }

    this.reconnectTimer = this.scheduleTimeout(() => {
      this.reconnectTimer = null;

      if (!this.currentOnMessage || this.currentCodes.length === 0) {
        return;
      }

      void this.openSocket(this.currentCodes, this.currentOnMessage).catch(() => {
        this.scheduleReconnect();
      });
    }, REALTIME_RECONNECT_DELAY_MS);
  }

  private resetInactivityTimer() {
    this.clearInactivityTimer();

    this.inactivityTimer = this.scheduleTimeout(() => {
      this.inactivityTimer = null;
      this.socket?.terminate();
      this.socket = null;
      this.scheduleReconnect();
    }, REALTIME_INACTIVITY_TIMEOUT_MS);
  }

  private clearInactivityTimer() {
    if (this.inactivityTimer) {
      this.clearScheduledTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}

export function buildRealtimeSubscriptionRequests(
  code: string,
  tracked: TrackedStockRef,
) {
  if (tracked.market === 'kospi') {
    return [{ tr_cd: 'S3_', tr_key: code }];
  }

  if (tracked.market === 'kosdaq') {
    return [{ tr_cd: 'K3_', tr_key: code }];
  }

  return [
    { tr_cd: 'S3_', tr_key: code },
    { tr_cd: 'K3_', tr_key: code },
  ];
}

export function parseRealtimeMessage(rawMessage: string): RealtimePatch[] {
  try {
    const payload = JSON.parse(rawMessage) as {
      body?: Record<string, unknown>;
      header?: Record<string, unknown>;
    };
    const body = payload.body ?? {};
    const code = String(body.shcode ?? body.tr_key ?? '');

    if (!code) {
      return [];
    }

    return [
      {
        code,
        price: pickNumber(body, ['price', 'close', 'last']),
        changeRate: pickNumber(body, ['drate', 'diff', 'changeRate']),
        tradeValue: pickNumber(body, ['value', 'tradeValue']),
        open: pickNullableNumber(body, ['open']),
        high: pickNullableNumber(body, ['high']),
        low: pickNullableNumber(body, ['low']),
      },
    ];
  } catch {
    return [];
  }
}

function pickNumber(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      return Number(value.replace(/,/g, ''));
    }
  }

  return undefined;
}

function pickNullableNumber(source: Record<string, unknown>, keys: string[]) {
  const value = pickNumber(source, keys);
  return value == null || value === 0 ? null : value;
}
