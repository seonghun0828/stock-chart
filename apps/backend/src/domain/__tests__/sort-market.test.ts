import { describe, expect, it } from 'vitest';
import { buildMarketSnapshot } from '../sort-market';
import type { MarketState } from '../types';

function createFixtureState(): MarketState {
  return {
    connectionStatus: 'open',
    lastUpdatedAt: '2026-05-31T12:00:00.000Z',
    stocksByCode: {
      A1: {
        code: 'A1',
        sectorId: 'semiconductor',
        name: 'Alpha Chip',
        price: 1000,
        changeRate: 9.1,
        tradeValue: 1200,
        previousClose: 960,
        open: 980,
        high: 1020,
        low: 970,
        headline: '반도체 대표 뉴스',
        hasSnapshot: true,
      },
      A2: {
        code: 'A2',
        sectorId: 'semiconductor',
        name: 'Bravo Memory',
        price: 2000,
        changeRate: 6.4,
        tradeValue: 1100,
        previousClose: 1880,
        open: 1930,
        high: 2050,
        low: 1910,
        hasSnapshot: true,
      },
      A3: {
        code: 'A3',
        sectorId: 'semiconductor',
        name: 'Charlie Fab',
        price: 3000,
        changeRate: 5.5,
        tradeValue: 1000,
        previousClose: 2850,
        open: 2950,
        high: 3020,
        low: 2890,
        hasSnapshot: true,
      },
      A4: {
        code: 'A4',
        sectorId: 'semiconductor',
        name: 'Delta Etch',
        price: 4000,
        changeRate: 2.1,
        tradeValue: 950,
        previousClose: 3950,
        open: 3980,
        high: 4050,
        low: 3920,
        hasSnapshot: true,
      },
      B1: {
        code: 'B1',
        sectorId: 'shipbuilding',
        name: 'Echo Marine',
        price: 5000,
        changeRate: 3.2,
        tradeValue: 900,
        previousClose: 4840,
        open: 4900,
        high: 5050,
        low: 4890,
        headline: '조선 대표 뉴스',
        hasSnapshot: true,
      },
      B2: {
        code: 'B2',
        sectorId: 'shipbuilding',
        name: 'Foxtrot Dock',
        price: 6000,
        changeRate: 2.7,
        tradeValue: 850,
        previousClose: 5840,
        open: 5920,
        high: 6030,
        low: 5900,
        hasSnapshot: true,
      },
      B3: {
        code: 'B3',
        sectorId: 'shipbuilding',
        name: 'Golf Yard',
        price: 7000,
        changeRate: 1.9,
        tradeValue: 800,
        previousClose: 6870,
        open: 6970,
        high: 7050,
        low: 6900,
        hasSnapshot: true,
      },
      B4: {
        code: 'B4',
        sectorId: 'shipbuilding',
        name: 'Hotel Hull',
        price: 8000,
        changeRate: 0.4,
        tradeValue: 780,
        previousClose: 7960,
        open: 7980,
        high: 8030,
        low: 7900,
        hasSnapshot: true,
      },
    },
  };
}

describe('buildMarketSnapshot', () => {
  it('sorts stocks by changeRate descending within each sector', () => {
    const snapshot = buildMarketSnapshot(createFixtureState());

    expect(snapshot.sectors[0].id).toBe('semiconductor');
    expect(snapshot.sectors[0].stocks.map((stock) => stock.code)).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
    ]);
  });

  it('sorts sectors by average of the top 3 stock change rates', () => {
    const snapshot = buildMarketSnapshot(createFixtureState());

    expect(snapshot.sectors.map((sector) => sector.id)).toEqual([
      'semiconductor',
      'shipbuilding',
      'defense',
      'biotech',
      'powerEquipment',
      'finance',
    ]);
  });

  it('sums displayed stock trade values for the sector header', () => {
    const snapshot = buildMarketSnapshot(createFixtureState());

    expect(snapshot.sectors[0].totalTradeValue).toBe(4250);
  });

  it('filters out inactive stocks with zero trade value from the displayed sector list', () => {
    const state = createFixtureState();
    state.stocksByCode.A2.tradeValue = 0;

    const snapshot = buildMarketSnapshot(state);

    expect(snapshot.sectors[0].stocks.map((stock) => stock.code)).toEqual([
      'A1',
      'A3',
      'A4',
    ]);
  });
});
