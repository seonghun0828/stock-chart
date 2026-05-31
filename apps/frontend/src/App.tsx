import { useEffect, useState } from 'react';
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

export default function App() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(initialSnapshot);

  useEffect(() => {
    let isMounted = true;

    fetchMarketSnapshot()
      .then((nextSnapshot) => {
        if (isMounted) {
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
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      isMounted = false;
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
