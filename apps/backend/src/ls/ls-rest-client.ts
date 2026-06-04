import { readEnv } from '../config/env';
import { fetchWithSingleRetryInBatches } from './fetch-in-batches';
import {
  mapT1101ResponseToQuote,
  type T1101Response,
  type TrackedStockRef,
} from './quote-mapping';
import type { InitialQuote } from './types';

export interface LsRestClient {
  fetchInitialQuotes(codes: string[]): Promise<InitialQuote[]>;
}

const INITIAL_QUOTE_BATCH_SIZE = 10;
const INITIAL_QUOTE_BATCH_DELAY_MS = 1000;

type TokenProvider = () => Promise<string>;

export class RealLsRestClient implements LsRestClient {
  private readonly baseUrl: string;
  private readonly trackedByCode: Map<string, TrackedStockRef>;

  constructor(
    trackedStocks: TrackedStockRef[],
    private readonly getAccessToken: TokenProvider,
    baseUrl = readEnv().LS_BASE_URL ?? 'https://openapi.ls-sec.co.kr:8080',
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.trackedByCode = new Map(
      trackedStocks.map((stock) => [stock.code, stock] as const),
    );
  }

  async fetchInitialQuotes(codes: string[]) {
    return fetchWithSingleRetryInBatches(
      codes,
      INITIAL_QUOTE_BATCH_SIZE,
      INITIAL_QUOTE_BATCH_DELAY_MS,
      (code) => this.fetchInitialQuote(code),
      this.sleep,
    );
  }

  private async fetchInitialQuote(code: string) {
    const tracked = this.trackedByCode.get(code);
    if (!tracked) {
      return null;
    }

    const token = await this.getAccessToken();
    const response = await this.fetchImpl(`${this.baseUrl}/stock/market-data`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        authorization: `Bearer ${token}`,
        tr_cd: 't1101',
        tr_cont: 'N',
        tr_cont_key: '',
      },
      body: JSON.stringify({
        t1101InBlock: {
          shcode: code,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`t1101 request failed for ${code}: ${response.status}`);
    }

    const payload = (await response.json()) as T1101Response;
    return mapT1101ResponseToQuote(payload, tracked);
  }
}

export { mapT1101ResponseToQuote } from './quote-mapping';
