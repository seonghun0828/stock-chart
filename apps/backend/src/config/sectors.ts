export const DISPLAY_STOCK_COUNT = 4;
export const SECTOR_SCORE_TOP_N = 3;

export const SECTOR_DEFINITIONS = [
  { id: 'semiconductor', name: '반도체' },
  { id: 'shipbuilding', name: '조선' },
  { id: 'defense', name: '방산' },
  { id: 'biotech', name: '바이오' },
  { id: 'powerEquipment', name: '전력기기' },
  { id: 'finance', name: '금융' },
] as const;

export type SectorId = (typeof SECTOR_DEFINITIONS)[number]['id'];
