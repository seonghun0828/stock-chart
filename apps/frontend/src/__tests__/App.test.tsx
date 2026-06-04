import { act, render, screen } from '@testing-library/react';
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
        {
          code: '000660',
          name: 'SK하이닉스',
          price: 198000,
          changeRate: 2.8,
          tradeValue: 1800,
          priceRange: {
            previousClose: 194000,
            open: 195000,
            high: 199000,
            low: 193000,
          },
        },
      ],
    },
    {
      id: 'shipbuilding',
      name: '조선',
      score: 4.1,
      totalTradeValue: 700,
      headline: null,
      stocks: [
        {
          code: '010140',
          name: '삼성중공업',
          price: 18100,
          changeRate: 4.1,
          tradeValue: 700,
          priceRange: {
            previousClose: 17500,
            open: 17600,
            high: 18200,
            low: 17400,
          },
        },
      ],
    },
  ],
};

const reorderedSnapshot: MarketSnapshot = {
  connectionStatus: 'open',
  lastUpdatedAt: '2026-05-31T12:00:01.000Z',
  sectors: [
    {
      id: 'shipbuilding',
      name: '조선',
      score: 9.1,
      totalTradeValue: 1000,
      headline: null,
      stocks: [
        {
          code: '010140',
          name: '삼성중공업',
          price: 20100,
          changeRate: 9.1,
          tradeValue: 1000,
          priceRange: {
            previousClose: 18000,
            open: 18100,
            high: 20200,
            low: 17900,
          },
        },
      ],
    },
    {
      id: 'semiconductor',
      name: '반도체',
      score: 7.5,
      totalTradeValue: 4800,
      headline: '반도체 대표 뉴스',
      stocks: [
        {
          code: '000660',
          name: 'SK하이닉스',
          price: 210000,
          changeRate: 7.5,
          tradeValue: 2500,
          priceRange: {
            previousClose: 195000,
            open: 197000,
            high: 212000,
            low: 194000,
          },
        },
        {
          code: '005930',
          name: '삼성전자',
          price: 73000,
          changeRate: 2.2,
          tradeValue: 2300,
          priceRange: {
            previousClose: 70100,
            open: 70200,
            high: 73200,
            low: 70000,
          },
        },
      ],
    },
  ],
};

const valueOnlySnapshot: MarketSnapshot = {
  connectionStatus: 'open',
  lastUpdatedAt: '2026-05-31T12:00:01.000Z',
  sectors: [
    {
      id: 'semiconductor',
      name: '반도체',
      score: 7.5,
      totalTradeValue: 4800,
      headline: '반도체 대표 뉴스',
      stocks: [
        {
          code: '005930',
          name: '삼성전자',
          price: 73000,
          changeRate: 2.2,
          tradeValue: 2300,
          priceRange: {
            previousClose: 70100,
            open: 70200,
            high: 73200,
            low: 70000,
          },
        },
        {
          code: '000660',
          name: 'SK하이닉스',
          price: 210000,
          changeRate: 7.5,
          tradeValue: 2500,
          priceRange: {
            previousClose: 195000,
            open: 197000,
            high: 212000,
            low: 194000,
          },
        },
      ],
    },
    {
      id: 'shipbuilding',
      name: '조선',
      score: 9.1,
      totalTradeValue: 1000,
      headline: null,
      stocks: [
        {
          code: '010140',
          name: '삼성중공업',
          price: 20100,
          changeRate: 9.1,
          tradeValue: 1000,
          priceRange: {
            previousClose: 18000,
            open: 18100,
            high: 20200,
            low: 17900,
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

  it('does not replace a populated snapshot with an empty websocket snapshot', async () => {
    let onSnapshot: ((snapshot: MarketSnapshot) => void) | undefined;
    apiMocks.connectMarketSocket.mockImplementation((listener: (snapshot: MarketSnapshot) => void) => {
      onSnapshot = listener;
      return { close: vi.fn() };
    });

    render(<App />);

    expect(await screen.findByText('반도체')).toBeInTheDocument();
    expect(screen.getByText('삼성전자')).toBeInTheDocument();

    act(() => {
      onSnapshot?.({
        connectionStatus: 'connecting',
        lastUpdatedAt: null,
        sectors: [],
      });
    });

    expect(screen.getByText('반도체')).toBeInTheDocument();
    expect(screen.getByText('삼성전자')).toBeInTheDocument();
  });

  it('updates stock values immediately but delays sector and stock order changes', async () => {
    let onSnapshot: ((snapshot: MarketSnapshot) => void) | undefined;
    apiMocks.connectMarketSocket.mockImplementation((listener: (snapshot: MarketSnapshot) => void) => {
      onSnapshot = listener;
      return { close: vi.fn() };
    });

    const { container } = render(<App />);

    expect(await screen.findByText('반도체')).toBeInTheDocument();
    expect(screen.getByText('삼성전자')).toBeInTheDocument();

    act(() => {
      onSnapshot?.(reorderedSnapshot);
    });

    expect(screen.getByText('73,000')).toBeInTheDocument();
    expect(screen.getByText('2,300억')).toBeInTheDocument();
    expect(Array.from(container.querySelectorAll('.sector-name')).map((node) => node.textContent)).toEqual([
      '반도체',
      '조선',
    ]);
    expect(Array.from(container.querySelectorAll('.stock-name')).map((node) => node.textContent)).toEqual([
      '삼성전자',
      'SK하이닉스',
      '삼성중공업',
    ]);

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 3100);
      });
    });

    expect(Array.from(container.querySelectorAll('.sector-name')).map((node) => node.textContent)).toEqual([
      '조선',
      '반도체',
    ]);
    expect(Array.from(container.querySelectorAll('.stock-name')).map((node) => node.textContent)).toEqual([
      '삼성중공업',
      'SK하이닉스',
      '삼성전자',
    ]);
  });

  it('does not schedule a delayed reorder when only live values change', async () => {
    let onSnapshot: ((snapshot: MarketSnapshot) => void) | undefined;
    apiMocks.connectMarketSocket.mockImplementation((listener: (snapshot: MarketSnapshot) => void) => {
      onSnapshot = listener;
      return { close: vi.fn() };
    });

    render(<App />);

    expect(await screen.findByText('반도체')).toBeInTheDocument();
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');

    act(() => {
      onSnapshot?.(valueOnlySnapshot);
    });

    expect(screen.getByText('73,000')).toBeInTheDocument();
    expect(screen.getByText('2,300억')).toBeInTheDocument();
    expect(setTimeoutSpy).not.toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
  });
});
