import { describe, expect, it } from 'vitest';
import type { TrackedStock } from '../../config/sectors';
import {
  resolveTrackedStocks,
  type LsSectorClient,
} from '../resolve-tracked-stocks';

class StubSectorClient implements LsSectorClient {
  constructor(
    private readonly themes: Array<{ code: string; name: string }>,
    private readonly stocksByTheme: Record<
      string,
      Array<{ code: string; name: string; marketCap?: number; tradeValue?: number }>
    >,
  ) {}

  async fetchThemes() {
    return this.themes;
  }

  async fetchThemeStocks(themeCode: string) {
    return this.stocksByTheme[themeCode] ?? [];
  }
}

function createFallbackStocks(): TrackedStock[] {
  return [
    { code: '005930', market: 'kospi', sectorId: 'semiconductor', sectorName: '반도체' },
    { code: '000660', market: 'kospi', sectorId: 'semiconductor', sectorName: '반도체' },
    { code: '329180', market: 'kospi', sectorId: 'shipbuilding', sectorName: '조선' },
    { code: '012450', market: 'kospi', sectorId: 'defense', sectorName: '방산' },
    { code: '207940', market: 'kospi', sectorId: 'biotech', sectorName: '바이오' },
    { code: '010120', market: 'kospi', sectorId: 'powerEquipment', sectorName: '전력기기' },
    { code: '105560', market: 'kospi', sectorId: 'finance', sectorName: '금융' },
  ];
}

describe('resolveTrackedStocks', () => {
  it('builds tracked stocks from LS sector themes and falls back per sector when empty', async () => {
    const client = new StubSectorClient(
      [
        { code: '0012', name: '반도체 장비' },
        { code: '0014', name: '반도체 재료/부품' },
        { code: '0030', name: '조선' },
        { code: '0144', name: '방위산업/전쟁 및 테러' },
        { code: '0123', name: '전력설비' },
        { code: '0151', name: '증권' },
      ],
      {
        '0012': [
          { code: '005930', name: '삼성전자', marketCap: 100, tradeValue: 90 },
          { code: '000660', name: 'SK하이닉스', marketCap: 90, tradeValue: 80 },
          { code: '0005G0', name: '반도체 ETF', marketCap: 200, tradeValue: 10 },
        ],
        '0014': [
          { code: '042700', name: '한미반도체', marketCap: 70, tradeValue: 70 },
          { code: '000660', name: 'SK하이닉스', marketCap: 90, tradeValue: 80 },
        ],
        '0030': [{ code: '329180', name: 'HD현대중공업', marketCap: 80, tradeValue: 50 }],
        '0144': [{ code: '012450', name: '한화에어로스페이스', marketCap: 85, tradeValue: 60 }],
        '0123': [{ code: '010120', name: 'LS ELECTRIC', marketCap: 75, tradeValue: 55 }],
        '0151': [{ code: '105560', name: 'KB금융', marketCap: 88, tradeValue: 77 }],
      },
    );

    const trackedStocks = await resolveTrackedStocks(client, createFallbackStocks());

    expect(
      trackedStocks.filter((stock) => stock.sectorId === 'semiconductor').map((stock) => stock.code),
    ).toEqual(['005930', '000660', '042700']);
    expect(
      trackedStocks.find((stock) => stock.code === '005930' && stock.sectorId === 'semiconductor'),
    ).toMatchObject({ market: 'kospi' });
    expect(
      trackedStocks.find((stock) => stock.code === '207940' && stock.sectorId === 'biotech'),
    ).toMatchObject({ code: '207940', market: 'kospi' });
  });

  it('returns hardcoded fallback stocks when the LS sector client fails', async () => {
    const client: LsSectorClient = {
      async fetchThemes() {
        throw new Error('boom');
      },
      async fetchThemeStocks() {
        return [];
      },
    };

    await expect(resolveTrackedStocks(client, createFallbackStocks())).resolves.toEqual(
      createFallbackStocks(),
    );
  });

  it('prioritizes theme stocks with positive trade value over inactive ones', async () => {
    const client = new StubSectorClient(
      [{ code: '0151', name: '증권' }],
      {
        '0151': [
          { code: '001000', name: 'Inactive BigCap', marketCap: 1000, tradeValue: 0 },
          { code: '002000', name: 'Active MidCap', marketCap: 500, tradeValue: 200 },
          { code: '003000', name: 'Active SmallCap', marketCap: 300, tradeValue: 100 },
        ],
      },
    );

    const trackedStocks = await resolveTrackedStocks(client, createFallbackStocks());
    const financeCodes = trackedStocks
      .filter((stock) => stock.sectorId === 'finance')
      .map((stock) => stock.code);

    expect(financeCodes.slice(0, 2)).toEqual(['002000', '003000']);
  });
});
