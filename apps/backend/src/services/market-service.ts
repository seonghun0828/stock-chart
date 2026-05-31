import { buildMarketSnapshot } from '../domain/sort-market';
import type { MarketState, StockRealtimeState } from '../domain/types';
import { createEmptyMarketState } from '../domain/market-state';
import type { LsRestClient } from '../ls/ls-rest-client';
import type { LsRealtimeClient } from '../ls/ls-websocket-client';
import type { InitialQuote, RealtimePatch } from '../ls/types';

export class MarketService {
  private readonly state: MarketState;

  constructor(
    private readonly restClient: LsRestClient,
    private readonly realtimeClient: LsRealtimeClient,
    initialState: MarketState = createEmptyMarketState(),
  ) {
    this.state = initialState;
  }

  getSnapshot() {
    return buildMarketSnapshot(this.state);
  }

  getHealth() {
    return {
      status: 'degraded' as const,
      lsAuth: 'missing' as const,
      lsWebSocket: this.state.connectionStatus,
    };
  }

  seed(quotes: InitialQuote[]) {
    for (const quote of quotes) {
      this.state.stocksByCode[quote.code] = {
        ...quote,
        hasSnapshot: true,
      };
    }
  }

  applyRealtimePatch(patches: RealtimePatch[]) {
    for (const patch of patches) {
      const current = this.state.stocksByCode[patch.code];

      if (!current) {
        continue;
      }

      this.state.stocksByCode[patch.code] = applyPatchToStock(current, patch);
    }

    this.state.lastUpdatedAt = new Date().toISOString();
    this.state.connectionStatus = 'open';
  }

  async connect(codes: string[]) {
    const quotes = await this.restClient.fetchInitialQuotes(codes);
    this.seed(quotes);
    await this.realtimeClient.connect(codes, (patches) => {
      this.applyRealtimePatch(patches);
    });
  }

  getState() {
    return this.state;
  }
}

export function applyPatchToStock(
  stock: StockRealtimeState,
  patch: RealtimePatch,
): StockRealtimeState {
  return {
    ...stock,
    price: patch.price ?? stock.price,
    changeRate: patch.changeRate ?? stock.changeRate,
    tradeValue: patch.tradeValue ?? stock.tradeValue,
    open: patch.open ?? stock.open,
    high: patch.high ?? stock.high,
    low: patch.low ?? stock.low,
    headline: patch.headline ?? stock.headline,
  };
}

export class MockLsRestClient implements LsRestClient {
  constructor(private readonly quotes: InitialQuote[] = []) {}

  async fetchInitialQuotes(codes: string[]): Promise<InitialQuote[]> {
    return this.quotes.filter((quote) => codes.includes(quote.code));
  }
}

export class MockLsRealtimeClient implements LsRealtimeClient {
  async connect(): Promise<void> {}
}
