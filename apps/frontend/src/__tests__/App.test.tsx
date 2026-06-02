import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { MarketSnapshot } from '../types';

const apiMocks = vi.hoisted(() => ({
  connectMarketSocket: vi.fn(),
  fetchMarketSnapshot: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  connectMarketSocket: apiMocks.connectMarketSocket,
  fetchMarketSnapshot: apiMocks.fetchMarketSnapshot,
}));

const snapshot: MarketSnapshot = {
  connectionStatus: 'open',
  lastUpdatedAt: '2026-05-31T12:00:00.000Z',
  sectors: [
    {
      id: 'semiconductor',
      name: '반도체',
      score: 6.4,
      totalTradeValue: 4250,
      headline: '반도체 대표 뉴스',
      stocks: [
        {
          code: '005930',
          name: '삼성전자',
          price: 71200,
          changeRate: 3.1,
          tradeValue: 1200,
          priceRange: {
            previousClose: 70100,
            open: 70100,
            high: 72100,
            low: 69900,
          },
        },
      ],
    },
  ],
};

describe('App', () => {
  beforeEach(() => {
    apiMocks.fetchMarketSnapshot.mockResolvedValue(snapshot);
    apiMocks.connectMarketSocket.mockReturnValue({ close: vi.fn() });
  });

  it('renders sector cards from the market snapshot', async () => {
    render(<App />);

    expect(await screen.findByText('반도체')).toBeInTheDocument();
    expect(await screen.findByText('삼성전자')).toBeInTheDocument();
  });
});
