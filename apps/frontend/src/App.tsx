import { useEffect, useRef, useState } from 'react';
import { BottomTicker } from './components/layout/BottomTicker';
import { TopBar } from './components/layout/TopBar';
import { SectorGrid } from './components/market/SectorGrid';
import { connectMarketSocket, fetchMarketSnapshot } from './lib/api';
import {
  formatClock,
  formatConnectionStatusLabel,
  getMarketStatusLabel,
  getNextMarketBoundary,
  isMarketOpen,
  isRealtimeSessionActive,
} from './lib/format';
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

function hasOrderChanged(
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

export default function App() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(initialSnapshot);
  const [now, setNow] = useState(() => new Date());
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>(
    () => (isRealtimeSessionActive(new Date()) ? 'connecting' : 'closed'),
  );
  const latestSnapshotRef = useRef<MarketSnapshot>(initialSnapshot);
  const displayedSnapshotRef = useRef<MarketSnapshot>(initialSnapshot);
  const reorderTimeoutRef = useRef<number | null>(null);
  const marketBoundaryTimeoutRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    displayedSnapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    let isMounted = true;

    const scheduleReorder = () => {
      if (reorderTimeoutRef.current !== null) {
        return;
      }

      reorderTimeoutRef.current = window.setTimeout(() => {
        reorderTimeoutRef.current = null;

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
    };

    const disconnectSocket = () => {
      if (socketRef.current) {
        const currentSocket = socketRef.current;
        socketRef.current = null;
        currentSocket.close();
      }
    };

    const connectSocket = () => {
      if (!isMounted || socketRef.current || !isRealtimeSessionActive(new Date())) {
        return;
      }

      setSocketStatus('connecting');
      socketRef.current = connectMarketSocket(
        (nextSnapshot) => {
          if (isMounted) {
            const currentSnapshot = displayedSnapshotRef.current;

            if (currentSnapshot.sectors.length > 0 && nextSnapshot.sectors.length === 0) {
              return;
            }

            latestSnapshotRef.current = nextSnapshot;
            const shouldScheduleReorder = hasOrderChanged(currentSnapshot, nextSnapshot);
            setSnapshot((current) => mergeLiveValues(current, nextSnapshot));

            if (shouldScheduleReorder) {
              scheduleReorder();
            }
          }
        },
        {
          onOpen: () => {
            if (isMounted) {
              setSocketStatus('open');
            }
          },
          onClose: () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.CLOSED) {
              socketRef.current = null;
            }

            if (isMounted) {
              setSocketStatus(isMarketOpen(new Date()) ? 'closed' : 'closed');
            }
          },
          onError: () => {
            if (isMounted) {
              setSocketStatus('error');
            }
          },
        },
      );
    };

    const syncMarketPhase = () => {
      const currentNow = new Date();

      setNow(currentNow);

      if (isRealtimeSessionActive(currentNow)) {
        connectSocket();
      } else {
        disconnectSocket();
        setSocketStatus('closed');
      }
    };

    const scheduleNextBoundary = () => {
      if (marketBoundaryTimeoutRef.current !== null) {
        window.clearTimeout(marketBoundaryTimeoutRef.current);
      }

      const nextBoundary = getNextMarketBoundary(new Date());
      const delay = Math.max(0, nextBoundary.getTime() - Date.now());

      marketBoundaryTimeoutRef.current = window.setTimeout(() => {
        if (!isMounted) {
          return;
        }

        syncMarketPhase();
        scheduleNextBoundary();
      }, delay);
    };

    fetchMarketSnapshot()
      .then((nextSnapshot) => {
        if (isMounted) {
          latestSnapshotRef.current = nextSnapshot;
          setSnapshot(nextSnapshot);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSocketStatus('error');
        }
      });
    syncMarketPhase();
    scheduleNextBoundary();

    return () => {
      isMounted = false;
      if (marketBoundaryTimeoutRef.current !== null) {
        window.clearTimeout(marketBoundaryTimeoutRef.current);
      }
      if (reorderTimeoutRef.current !== null) {
        window.clearTimeout(reorderTimeoutRef.current);
      }
      disconnectSocket();
    };
  }, []);

  return (
    <main className="market-page">
      <TopBar
        marketStatusLabel={getMarketStatusLabel(now)}
        connectionStatusLabel={formatConnectionStatusLabel(socketStatus)}
        connectionStatusTone={socketStatus}
      />
      <SectorGrid sectors={snapshot.sectors} />
      <BottomTicker lastUpdatedAt={formatClock(snapshot.lastUpdatedAt)} />
    </main>
  );
}
