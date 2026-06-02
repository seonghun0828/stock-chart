import { describe, expect, it } from 'vitest';
import { MarketService } from '../market-service';
import type { LsRestClient } from '../../ls/ls-rest-client';
import type { LsRealtimeClient } from '../../ls/ls-websocket-client';
import type { InitialQuote } from '../../ls/types';

class StubRestClient implements LsRestClient {
  async fetchInitialQuotes(): Promise<InitialQuote[]> {
    return [];
  }
}

class StubRealtimeClient implements LsRealtimeClient {
  async connect(): Promise<void> {}
}

function createQuotes(): InitialQuote[] {
  return [
    {
      code: 'A1',
      sectorId: 'semiconductor',
      name: 'Alpha',
      price: 100,
      changeRate: 5,
      tradeValue: 1000,
      previousClose: 95,
      open: 95,
      high: 102,
      low: 94,
    },
    {
      code: 'A2',
      sectorId: 'semiconductor',
      name: 'Beta',
      price: 90,
      changeRate: 4,
      tradeValue: 900,
      previousClose: 88,
      open: 88,
      high: 91,
      low: 85,
    },
    {
      code: 'A3',
      sectorId: 'semiconductor',
      name: 'Gamma',
      price: 80,
      changeRate: 3,
      tradeValue: 800,
      previousClose: 79,
      open: 78,
      high: 81,
      low: 77,
    },
    {
      code: 'A4',
      sectorId: 'semiconductor',
      name: 'Delta',
      price: 70,
      changeRate: 2,
      tradeValue: 700,
      previousClose: 69,
      open: 68,
      high: 71,
      low: 67,
    },
    {
      code: 'B1',
      sectorId: 'shipbuilding',
      name: 'Dock',
      price: 60,
      changeRate: 1,
      tradeValue: 600,
      previousClose: 59,
      open: 59,
      high: 62,
      low: 58,
    },
    {
      code: 'B2',
      sectorId: 'shipbuilding',
      name: 'Yard',
      price: 50,
      changeRate: 0.8,
      tradeValue: 500,
      previousClose: 49,
      open: 49,
      high: 51,
      low: 48,
    },
    {
      code: 'B3',
      sectorId: 'shipbuilding',
      name: 'Hull',
      price: 40,
      changeRate: 0.5,
      tradeValue: 400,
      previousClose: 39,
      open: 39,
      high: 41,
      low: 38,
    },
    {
      code: 'B4',
      sectorId: 'shipbuilding',
      name: 'Port',
      price: 30,
      changeRate: 0.2,
      tradeValue: 300,
      previousClose: 29,
      open: 29,
      high: 31,
      low: 28,
    },
  ];
}

describe('MarketService', () => {
  it('keeps prior stock values when websocket patch omits some symbols', () => {
    const service = new MarketService(
      new StubRestClient(),
      new StubRealtimeClient(),
    );

    service.seed(createQuotes());
    service.applyRealtimePatch([
      { code: 'A1', price: 111, changeRate: 8.1, tradeValue: 1110 },
      { code: 'A2', price: 91, changeRate: 4.4, tradeValue: 910 },
      { code: 'A3', price: 82, changeRate: 3.5, tradeValue: 820 },
      { code: 'A4', price: 71, changeRate: 2.4, tradeValue: 710 },
      { code: 'B1', price: 62, changeRate: 1.2, tradeValue: 620 },
      { code: 'B2', price: 52, changeRate: 1.1, tradeValue: 520 },
    ]);

    const state = service.getState();

    expect(state.stocksByCode.B3.price).toBe(40);
    expect(state.stocksByCode.B4.tradeValue).toBe(300);

    const snapshot = service.getSnapshot();
    expect(snapshot.sectors[0].stocks.length).toBe(4);
    expect(snapshot.sectors[1].stocks.length).toBe(4);
  });
});
