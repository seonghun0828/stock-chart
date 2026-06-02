import type { MarketSnapshot } from '../domain/types';

export type HealthStatus = {
  status: 'ok' | 'degraded';
  lsAuth: 'ready' | 'missing';
  lsWebSocket: 'connecting' | 'open' | 'closed' | 'error';
};

export interface MarketServiceLike {
  getSnapshot(): MarketSnapshot;
  getHealth(): HealthStatus;
  subscribe(listener: (snapshot: MarketSnapshot) => void): () => void;
}
