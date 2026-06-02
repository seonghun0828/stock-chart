export const DISPLAY_STOCK_COUNT = 4;
export const SECTOR_SCORE_TOP_N = 3;

export type MarketCategory = 'kospi' | 'kosdaq';
export type TrackedStock = {
  code: string;
  market?: MarketCategory;
  sectorId: SectorId;
  sectorName: string;
};

export const SECTOR_DEFINITIONS = [
  { id: 'semiconductor', name: '반도체' },
  { id: 'shipbuilding', name: '조선' },
  { id: 'defense', name: '방산' },
  { id: 'biotech', name: '바이오' },
  { id: 'powerEquipment', name: '전력기기' },
  { id: 'finance', name: '금융' },
] as const;

export type SectorId = (typeof SECTOR_DEFINITIONS)[number]['id'];

export const SECTOR_STOCKS = {
  semiconductor: [
    { code: '005930', market: 'kospi' },
    { code: '000660', market: 'kospi' },
    { code: '042700', market: 'kosdaq' },
    { code: '058470', market: 'kosdaq' },
    { code: '000990', market: 'kospi' },
    { code: '013890', market: 'kospi' },
  ],
  shipbuilding: [
    { code: '329180', market: 'kospi' },
    { code: '009540', market: 'kospi' },
    { code: '010140', market: 'kospi' },
    { code: '042660', market: 'kospi' },
    { code: '267250', market: 'kospi' },
    { code: '340930', market: 'kospi' },
  ],
  defense: [
    { code: '012450', market: 'kospi' },
    { code: '047810', market: 'kosdaq' },
    { code: '272210', market: 'kospi' },
    { code: '079550', market: 'kosdaq' },
    { code: '099320', market: 'kosdaq' },
    { code: '064350', market: 'kosdaq' },
  ],
  biotech: [
    { code: '207940', market: 'kospi' },
    { code: '068270', market: 'kospi' },
    { code: '196170', market: 'kosdaq' },
    { code: '302440', market: 'kosdaq' },
    { code: '145020', market: 'kosdaq' },
    { code: '214450', market: 'kosdaq' },
  ],
  powerEquipment: [
    { code: '010120', market: 'kospi' },
    { code: '272290', market: 'kosdaq' },
    { code: '267260', market: 'kosdaq' },
    { code: '307950', market: 'kosdaq' },
    { code: '017800', market: 'kosdaq' },
    { code: '037370', market: 'kospi' },
  ],
  finance: [
    { code: '105560', market: 'kospi' },
    { code: '055550', market: 'kospi' },
    { code: '316140', market: 'kospi' },
    { code: '086790', market: 'kospi' },
    { code: '024110', market: 'kospi' },
    { code: '006800', market: 'kospi' },
  ],
} as const satisfies Record<SectorId, readonly { code: string; market: MarketCategory }[]>;

export function getTrackedStocks() {
  return SECTOR_DEFINITIONS.flatMap((sector) =>
    SECTOR_STOCKS[sector.id].map((stock) => ({
      ...stock,
      sectorId: sector.id,
      sectorName: sector.name,
    })),
  );
}

export const LS_THEME_CANDIDATES = {
  semiconductor: [
    '반도체 장비',
    '반도체 재료/부품',
    '반도체 대표주(생산)',
    '시스템반도체',
    '전력반도체',
  ],
  shipbuilding: ['조선', '조선기자재'],
  defense: ['방위산업/전쟁 및 테러', '우주항공산업(누리호/인공위성 등)'],
  biotech: ['바이오시밀러(복제 바이오의약품)', '제약업체'],
  powerEquipment: ['전력설비', '전선', '스마트그리드(지능형전력망)'],
  finance: ['증권', '은행', '손해보험', '생명보험', '인터넷은행'],
} as const satisfies Record<SectorId, readonly string[]>;

export const STARTUP_SECTOR_STOCK_LIMIT = 12;
