import {
  DISPLAY_STOCK_COUNT,
  SECTOR_DEFINITIONS,
  SECTOR_SCORE_TOP_N,
} from '../config/sectors';
import type { MarketSnapshot, MarketState, StockRealtimeState } from './types';

function compareStocks(left: StockRealtimeState, right: StockRealtimeState) {
  if (right.changeRate !== left.changeRate) {
    return right.changeRate - left.changeRate;
  }

  if (right.tradeValue !== left.tradeValue) {
    return right.tradeValue - left.tradeValue;
  }

  return left.name.localeCompare(right.name, 'ko');
}

function averageChangeRate(stocks: StockRealtimeState[]) {
  const topStocks = stocks.slice(0, SECTOR_SCORE_TOP_N);

  if (topStocks.length === 0) {
    return 0;
  }

  const total = topStocks.reduce((sum, stock) => sum + stock.changeRate, 0);
  return total / topStocks.length;
}

export function buildMarketSnapshot(state: MarketState): MarketSnapshot {
  const sectors = SECTOR_DEFINITIONS.map((sectorDefinition, definitionIndex) => {
    const sectorStocks = Object.values(state.stocksByCode)
      .filter(
        (stock) => stock.sectorId === sectorDefinition.id && stock.hasSnapshot,
      )
      .sort(compareStocks);

    const displayedStocks = sectorStocks.slice(0, DISPLAY_STOCK_COUNT);
    const totalTradeValue = displayedStocks.reduce(
      (sum, stock) => sum + stock.tradeValue,
      0,
    );

    return {
      id: sectorDefinition.id,
      name: sectorDefinition.name,
      score: averageChangeRate(sectorStocks),
      totalTradeValue,
      headline:
        sectorStocks.find((stock) => stock.headline)?.headline?.trim() || null,
      stocks: displayedStocks.map((stock) => ({
        code: stock.code,
        name: stock.name,
        price: stock.price,
        changeRate: stock.changeRate,
        tradeValue: stock.tradeValue,
        priceRange: {
          previousClose: stock.previousClose,
          open: stock.open,
          high: stock.high,
          low: stock.low,
        },
      })),
      definitionIndex,
    };
  }).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (right.totalTradeValue !== left.totalTradeValue) {
      return right.totalTradeValue - left.totalTradeValue;
    }

    return left.definitionIndex - right.definitionIndex;
  });

  return {
    sectors: sectors.map(({ definitionIndex: _definitionIndex, ...sector }) => sector),
    lastUpdatedAt: state.lastUpdatedAt,
    connectionStatus: state.connectionStatus,
  };
}
