import { useEffect, useRef, useState } from 'react';
import { BottomTicker } from './components/layout/BottomTicker';
import { TopBar } from './components/layout/TopBar';
import { SectorGrid } from './components/market/SectorGrid';
import { connectMarketSocket, fetchMarketSnapshot } from './lib/api';
import { formatClock } from './lib/format';
import type { MarketSnapshot } from './types';

const initialSnapshot: MarketSnapshot = {
  sectors: [],
  lastUpdatedAt: null,
  connectionStatus: 'connecting',
};

const REORDER_INTERVAL_MS = 3000;

function indexStocksByCode(snapshot: MarketSnapshot) {
  const stockMap = new Map<string, MarketSnapshot['sectors'][number]['stocks'][number]>();

  for (const sector of snapshot.sectors) {
    for (const stock of sector.stocks) {
      stockMap.set(stock.code, stock);
    }
  }

  return stockMap;
}

function mergeLiveValues(
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
      const stocks = currentSector.stocks.map((currentStock) => nextStocksByCode.get(currentStock.code) ?? currentStock);
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

export default function App() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(initialSnapshot);
  const latestSnapshotRef = useRef<MarketSnapshot>(initialSnapshot);

  useEffect(() => {
    let isMounted = true;

    fetchMarketSnapshot()
      .then((nextSnapshot) => {
        if (isMounted) {
          latestSnapshotRef.current = nextSnapshot;
          setSnapshot(nextSnapshot);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSnapshot((current) => ({ ...current, connectionStatus: 'error' }));
        }
      });

    const socket = connectMarketSocket((nextSnapshot) => {
      if (isMounted) {
        setSnapshot((current) => {
          if (current.sectors.length > 0 && nextSnapshot.sectors.length === 0) {
            return current;
          }

          latestSnapshotRef.current = nextSnapshot;
          return mergeLiveValues(current, nextSnapshot);
        });
      }
    });

    const reorderTimer = window.setInterval(() => {
      if (!isMounted) {
        return;
      }

      setSnapshot((current) => {
        const latestSnapshot = latestSnapshotRef.current;

        if (current.sectors.length > 0 && latestSnapshot.sectors.length === 0) {
          return current;
        }

        return latestSnapshot;
      });
    }, REORDER_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(reorderTimer);
      socket.close();
    };
  }, []);

  return (
    <main className="market-page">
      <TopBar
        clockLabel={formatClock(snapshot.lastUpdatedAt)}
        connectionStatus={snapshot.connectionStatus}
      />
      <SectorGrid sectors={snapshot.sectors} />
      <BottomTicker lastUpdatedAt={formatClock(snapshot.lastUpdatedAt)} />
    </main>
  );
}
