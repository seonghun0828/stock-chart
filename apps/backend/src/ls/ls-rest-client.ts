import type { SectorId } from '../config/sectors';
import { readEnv } from '../config/env';
import type { InitialQuote } from './types';

export interface LsRestClient {
  fetchInitialQuotes(codes: string[]): Promise<InitialQuote[]>;
}

const INITIAL_QUOTE_BATCH_SIZE = 10;
const INITIAL_QUOTE_BATCH_DELAY_MS = 1000;

type TrackedStockRef = {
  code: string;
  sectorId: SectorId;
  sectorName: string;
};

type TokenProvider = () => Promise<string>;

type T1101Response = {
  t1101OutBlock: {
    hname: string;
    price: number | string;
    diff: number | string;
    volume?: number | string;
    value?: number | string;
    jnilclose?: number | string;
    open?: number | string;
    high?: number | string;
    low?: number | string;
    shcode?: string;
  };
};

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
    const quotes: InitialQuote[] = [];
    const failedCodes = new Set<string>();

    for (let start = 0; start < codes.length; start += INITIAL_QUOTE_BATCH_SIZE) {
      const batch = codes.slice(start, start + INITIAL_QUOTE_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((code) => this.fetchInitialQuote(code)),
      );

      for (const [index, result] of results.entries()) {
        if (result.status === 'fulfilled' && result.value) {
          quotes.push(result.value);
          continue;
        }

        failedCodes.add(batch[index] as string);
      }

      if (start + INITIAL_QUOTE_BATCH_SIZE < codes.length) {
        await this.sleep(INITIAL_QUOTE_BATCH_DELAY_MS);
      }
    }

    if (failedCodes.size > 0) {
      const retryResults = await Promise.allSettled(
        Array.from(failedCodes).map((code) => this.fetchInitialQuote(code)),
      );

      failedCodes.clear();

      for (const result of retryResults) {
        if (result.status === 'fulfilled' && result.value) {
          quotes.push(result.value);
          continue;
        }
      }
    }

    return quotes;
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

export function mapT1101ResponseToQuote(
  payload: T1101Response,
  tracked: TrackedStockRef,
): InitialQuote {
  const outBlock = payload.t1101OutBlock;
  const price = toNumber(outBlock.price);
  const volume = toNumber(outBlock.volume);
  const rawValue = toNumber(outBlock.value);
  const tradeValue = rawValue > 0 ? Math.round(rawValue / 100000000) : Math.round((price * volume) / 100000000);

  return {
    code: tracked.code,
    sectorId: tracked.sectorId,
    name: outBlock.hname,
    price,
    changeRate: toNumber(outBlock.diff),
    tradeValue,
    previousClose: nullableNumber(outBlock.jnilclose),
    open: nullableNumber(outBlock.open),
    high: nullableNumber(outBlock.high),
    low: nullableNumber(outBlock.low),
    headline: null,
  };
}

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return Number(value.replace(/,/g, ''));
  }

  return 0;
}

function nullableNumber(value: unknown) {
  const numeric = toNumber(value);
  return numeric === 0 ? null : numeric;
}
