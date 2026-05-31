import type { MarketState } from './types';

export function createEmptyMarketState(): MarketState {
  return {
    stocksByCode: {},
    lastUpdatedAt: null,
    connectionStatus: 'connecting',
  };
}
