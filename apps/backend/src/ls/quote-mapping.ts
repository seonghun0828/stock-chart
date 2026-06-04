import type { SectorId } from '../config/sectors';
import type { InitialQuote } from './types';

export type TrackedStockRef = {
  code: string;
  sectorId: SectorId;
  sectorName: string;
};

export type T1101Response = {
  t1101OutBlock: {
    hname: string;
    price: number | string;
    diff: number | string;
    volume?: number | string;
    value?: number | string;
    jnilclose?: number | string;
    open?: number | string;
    high?: number | string;
    low?: number | string;
    shcode?: string;
  };
};

export function mapT1101ResponseToQuote(
  payload: T1101Response,
  tracked: TrackedStockRef,
): InitialQuote {
  const outBlock = payload.t1101OutBlock;
  const price = toNumber(outBlock.price);
  const volume = toNumber(outBlock.volume);
  const rawValue = toNumber(outBlock.value);
  const tradeValue =
    rawValue > 0
      ? Math.round(rawValue / 100000000)
      : Math.round((price * volume) / 100000000);

  return {
    code: tracked.code,
    sectorId: tracked.sectorId,
    name: outBlock.hname,
    price,
    changeRate: toNumber(outBlock.diff),
    tradeValue,
    previousClose: nullableNumber(outBlock.jnilclose),
    open: nullableNumber(outBlock.open),
    high: nullableNumber(outBlock.high),
    low: nullableNumber(outBlock.low),
    headline: null,
  };
}

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return Number(value.replace(/,/g, ''));
  }

  return 0;
}

function nullableNumber(value: unknown) {
  const numeric = toNumber(value);
  return numeric === 0 ? null : numeric;
}
