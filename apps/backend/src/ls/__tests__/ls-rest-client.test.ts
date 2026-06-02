import { describe, expect, it } from 'vitest';
import { mapT1101ResponseToQuote } from '../ls-rest-client';

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
        market: 'kospi',
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
