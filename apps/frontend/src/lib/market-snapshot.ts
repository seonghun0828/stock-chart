import type { MarketSnapshot } from '../types';

function indexStocksByCode(snapshot: MarketSnapshot) {
  const stockMap = new Map<string, MarketSnapshot['sectors'][number]['stocks'][number]>();

  for (const sector of snapshot.sectors) {
    for (const stock of sector.stocks) {
      stockMap.set(stock.code, stock);
    }
  }

  return stockMap;
}

export function mergeLiveValues(
  currentSnapshot: MarketSnapshot,
  nextSnapshot: MarketSnapshot,
): MarketSnapshot {
  if (currentSnapshot.sectors.length === 0) {
    return nextSnapshot;
  }

  const nextStocksByCode = indexStocksByCode(nextSnapshot);
  const nextSectorsById = new Map(nextSnapshot.sectors.map((sector) => [sector.id, sector]));

  return {
    connectionStatus: nextSnapshot.connectionStatus,
    lastUpdatedAt: nextSnapshot.lastUpdatedAt,
    sectors: currentSnapshot.sectors.map((currentSector) => {
      const nextSector = nextSectorsById.get(currentSector.id);
      const stocks = currentSector.stocks.map(
        (currentStock) => nextStocksByCode.get(currentStock.code) ?? currentStock,
      );
      const totalTradeValue = stocks.reduce((sum, stock) => sum + stock.tradeValue, 0);

      return {
        ...currentSector,
        score: nextSector?.score ?? currentSector.score,
        headline: nextSector?.headline ?? currentSector.headline,
        totalTradeValue,
        stocks,
      };
    }),
  };
}

export function hasOrderChanged(
  currentSnapshot: MarketSnapshot,
  nextSnapshot: MarketSnapshot,
) {
  if (currentSnapshot.sectors.length !== nextSnapshot.sectors.length) {
    return true;
  }

  for (let index = 0; index < currentSnapshot.sectors.length; index += 1) {
    const currentSector = currentSnapshot.sectors[index];
    const nextSector = nextSnapshot.sectors[index];

    if (currentSector?.id !== nextSector?.id) {
      return true;
    }

    if (currentSector.stocks.length !== nextSector.stocks.length) {
      return true;
    }

    for (let stockIndex = 0; stockIndex < currentSector.stocks.length; stockIndex += 1) {
      if (currentSector.stocks[stockIndex]?.code !== nextSector.stocks[stockIndex]?.code) {
        return true;
      }
    }
  }

  return false;
}
