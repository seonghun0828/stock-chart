import { describe, expect, it } from 'vitest';
import {
  formatConnectionStatusLabel,
  getMarketStatusLabel,
  getNextMarketBoundary,
  isRealtimeSessionActive,
} from '../format';

describe('formatConnectionStatusLabel', () => {
  it('maps websocket states to Korean labels', () => {
    expect(formatConnectionStatusLabel('open')).toBe('연결됨');
    expect(formatConnectionStatusLabel('connecting')).toBe('연결중');
    expect(formatConnectionStatusLabel('closed')).toBe('연결 종료');
    expect(formatConnectionStatusLabel('error')).toBe('에러 발생');
  });
});

describe('getMarketStatusLabel', () => {
  it('returns 장 열림 during weekday market hours in Seoul', () => {
    expect(getMarketStatusLabel(new Date('2026-06-04T01:00:00.000Z'))).toBe('장 열림');
  });

  it('returns 장 마감 outside weekday market hours in Seoul', () => {
    expect(getMarketStatusLabel(new Date('2026-06-04T07:00:00.000Z'))).toBe('장 마감');
    expect(getMarketStatusLabel(new Date('2026-06-06T01:00:00.000Z'))).toBe('장 마감');
  });
});

describe('isRealtimeSessionActive', () => {
  it('keeps the realtime session alive slightly past the market close label', () => {
    expect(isRealtimeSessionActive(new Date('2026-06-04T06:30:30.000Z'))).toBe(true);
    expect(isRealtimeSessionActive(new Date('2026-06-04T06:31:00.000Z'))).toBe(false);
  });
});

describe('getNextMarketBoundary', () => {
  it('returns the 09:00 opening boundary before the market opens', () => {
    expect(getNextMarketBoundary(new Date('2026-06-03T23:20:00.000Z')).toISOString()).toBe(
      '2026-06-04T00:00:00.000Z',
    );
  });

  it('returns the 15:31 realtime cutoff after the close label boundary passes', () => {
    expect(getNextMarketBoundary(new Date('2026-06-04T06:30:10.000Z')).toISOString()).toBe(
      '2026-06-04T06:31:00.000Z',
    );
  });

  it('rolls to the next business-day opening boundary after the session ends for the day', () => {
    expect(getNextMarketBoundary(new Date('2026-06-04T06:31:10.000Z')).toISOString()).toBe(
      '2026-06-05T00:00:00.000Z',
    );
  });
});
