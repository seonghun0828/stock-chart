import type { SectorId } from '../config/sectors';

export type InitialQuote = {
  code: string;
  sectorId: SectorId;
  name: string;
  price: number;
  changeRate: number;
  tradeValue: number;
  open: number | null;
  high: number | null;
  low: number | null;
  headline?: string | null;
};

export type RealtimePatch = {
  code: string;
  price?: number;
  changeRate?: number;
  tradeValue?: number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  headline?: string | null;
};
