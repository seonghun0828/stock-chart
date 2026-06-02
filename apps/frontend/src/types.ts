export type StockViewModel = {
  code: string;
  name: string;
  price: number;
  changeRate: number;
  tradeValue: number;
  priceRange: {
    previousClose: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
  };
};

export type SectorViewModel = {
  id:
    | 'semiconductor'
    | 'shipbuilding'
    | 'defense'
    | 'biotech'
    | 'powerEquipment'
    | 'finance';
  name: string;
  score: number;
  totalTradeValue: number;
  headline: string | null;
  stocks: StockViewModel[];
};

export type MarketSnapshot = {
  sectors: SectorViewModel[];
  lastUpdatedAt: string | null;
  connectionStatus: 'connecting' | 'open' | 'closed' | 'error';
};
