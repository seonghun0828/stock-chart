import { describe, expect, it } from 'vitest';
import { hasOrderChanged, mergeLiveValues } from '../market-snapshot';
import type { MarketSnapshot } from '../../types';

const currentSnapshot: MarketSnapshot = {
  connectionStatus: 'open',
  lastUpdatedAt: '2026-06-04T00:00:00.000Z',
  sectors: [
    {
      id: 'semiconductor',
      name: '반도체',
      score: 4,
      totalTradeValue: 300,
      headline: '반도체 뉴스',
      stocks: [
        {
          code: 'A',
          name: 'Alpha',
          price: 100,
          changeRate: 4,
          tradeValue: 100,
          priceRange: { previousClose: 96, open: 97, high: 101, low: 95 },
        },
        {
          code: 'B',
          name: 'Beta',
          price: 90,
          changeRate: 3,
          tradeValue: 200,
          priceRange: { previousClose: 87, open: 88, high: 91, low: 86 },
        },
      ],
    },
  ],
};

describe('mergeLiveValues', () => {
  it('keeps display order while merging the latest stock values', () => {
    const nextSnapshot: MarketSnapshot = {
      ...currentSnapshot,
      lastUpdatedAt: '2026-06-04T00:00:01.000Z',
      sectors: [
        {
          ...currentSnapshot.sectors[0],
          score: 7,
          totalTradeValue: 450,
          stocks: [
            {
              code: 'B',
              name: 'Beta',
              price: 120,
              changeRate: 7,
              tradeValue: 250,
              priceRange: { previousClose: 87, open: 100, high: 121, low: 86 },
            },
            {
              code: 'A',
              name: 'Alpha',
              price: 110,
              changeRate: 5,
              tradeValue: 200,
              priceRange: { previousClose: 96, open: 99, high: 112, low: 95 },
            },
          ],
        },
      ],
    };

    const merged = mergeLiveValues(currentSnapshot, nextSnapshot);

    expect(merged.sectors[0].stocks.map((stock) => stock.code)).toEqual(['A', 'B']);
    expect(merged.sectors[0].stocks[0].price).toBe(110);
    expect(merged.sectors[0].stocks[1].price).toBe(120);
    expect(merged.sectors[0].totalTradeValue).toBe(450);
  });
});

describe('hasOrderChanged', () => {
  it('detects sector or stock order changes', () => {
    expect(hasOrderChanged(currentSnapshot, currentSnapshot)).toBe(false);

    const reordered: MarketSnapshot = {
      ...currentSnapshot,
      sectors: [
        {
          ...currentSnapshot.sectors[0],
          stocks: [...currentSnapshot.sectors[0].stocks].reverse(),
        },
      ],
    };

    expect(hasOrderChanged(currentSnapshot, reordered)).toBe(true);
  });
});
