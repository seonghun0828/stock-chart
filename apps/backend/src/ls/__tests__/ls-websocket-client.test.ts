import { describe, expect, it } from 'vitest';
import { buildRealtimeSubscriptionRequests } from '../ls-websocket-client';

describe('buildRealtimeSubscriptionRequests', () => {
  it('uses the known market when available', () => {
    expect(
      buildRealtimeSubscriptionRequests('005930', {
        code: '005930',
        market: 'kospi',
        sectorId: 'semiconductor',
        sectorName: '반도체',
      }),
    ).toEqual([{ tr_cd: 'S3_', tr_key: '005930' }]);
  });

  it('registers both kospi and kosdaq channels when market is unknown', () => {
    expect(
      buildRealtimeSubscriptionRequests('123456', {
        code: '123456',
        sectorId: 'finance',
        sectorName: '금융',
      }),
    ).toEqual([
      { tr_cd: 'S3_', tr_key: '123456' },
      { tr_cd: 'K3_', tr_key: '123456' },
    ]);
  });
});
