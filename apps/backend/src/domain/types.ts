import type { SectorId } from '../config/sectors';

export type StockRealtimeState = {
  code: string;
  sectorId: SectorId;
  name: string;
  price: number;
  changeRate: number;
  tradeValue: number;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  headline?: string | null;
  hasSnapshot: boolean;
};

export type MarketState = {
  stocksByCode: Record<string, StockRealtimeState>;
  lastUpdatedAt: string | null;
  connectionStatus: 'connecting' | 'open' | 'closed' | 'error';
};

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
  id: SectorId;
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
