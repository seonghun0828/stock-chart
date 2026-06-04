import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RealLsRestClient, mapT1101ResponseToQuote } from '../ls-rest-client';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('mapT1101ResponseToQuote', () => {
  it('maps t1101 response fields to the internal quote shape', () => {
    const quote = mapT1101ResponseToQuote(
      {
        t1101OutBlock: {
          hname: 'LS증권',
          price: 4545,
          diff: '0.22',
          volume: 2702,
          value: 1200000000,
          jnilclose: 4535,
          open: 4555,
          high: 4555,
          low: 4525,
          shcode: '078020',
        },
      },
      {
        code: '078020',
        sectorId: 'finance',
        sectorName: '금융',
      },
    );

    expect(quote).toMatchObject({
      code: '078020',
      name: 'LS증권',
      price: 4545,
      changeRate: 0.22,
      previousClose: 4535,
      open: 4555,
      high: 4555,
      low: 4525,
      sectorId: 'finance',
    });
    expect(quote.tradeValue).toBe(12);
  });
});

describe('RealLsRestClient.fetchInitialQuotes', () => {
  it('limits initial quote requests by batch and retries failed symbols once', async () => {
    const fetchMock = vi.fn();

    for (let index = 0; index < 10; index += 1) {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            t1101OutBlock: {
              hname: `Stock-${index}`,
              price: 1000 + index,
              diff: '1.00',
              value: 100000000,
              jnilclose: 900,
              open: 950,
              high: 1100,
              low: 890,
            },
          }),
          { status: 200 },
        ),
      );
    }

    fetchMock.mockResolvedValueOnce(new Response('rate limit', { status: 429 }));

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          t1101OutBlock: {
            hname: 'Stock-11',
            price: 1011,
            diff: '1.00',
            value: 100000000,
            jnilclose: 900,
            open: 950,
            high: 1100,
            low: 890,
          },
        }),
        { status: 200 },
      ),
    );

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          t1101OutBlock: {
            hname: 'Stock-10',
            price: 1010,
            diff: '1.00',
            value: 100000000,
            jnilclose: 900,
            open: 950,
            high: 1100,
            low: 890,
          },
        }),
        { status: 200 },
      ),
    );

    const client = new RealLsRestClient(
      Array.from({ length: 12 }, (_, index) => ({
        code: `0000${String(index).padStart(2, '0')}`,
        sectorId: 'finance',
        sectorName: '금융',
      })),
      async () => 'token',
      'https://example.test',
      fetchMock,
      () => Promise.resolve(),
    );

    const promise = client.fetchInitialQuotes(
      Array.from({ length: 12 }, (_, index) => `0000${String(index).padStart(2, '0')}`),
    );

    await vi.runAllTimersAsync();
    const quotes = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(13);
    expect(quotes).toHaveLength(12);
    expect(fetchMock.mock.calls[10]?.[1]).toMatchObject({
      method: 'POST',
    });
  });
});
