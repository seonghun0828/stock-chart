import type { MarketSnapshot } from '../types';

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
  const response = await fetch(`${baseUrl}/api/market`);

  if (!response.ok) {
    throw new Error(`Failed to fetch market snapshot: ${response.status}`);
  }

  return response.json();
}

type SocketLifecycleHandlers = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

export function connectMarketSocket(
  onSnapshot: (snapshot: MarketSnapshot) => void,
  handlers: SocketLifecycleHandlers = {},
) {
  const socketUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:4000';
  const socket = new WebSocket(socketUrl);

  socket.addEventListener('open', () => {
    handlers.onOpen?.();
  });

  socket.addEventListener('message', (event) => {
    onSnapshot(JSON.parse(event.data) as MarketSnapshot);
  });

  socket.addEventListener('close', () => {
    handlers.onClose?.();
  });

  socket.addEventListener('error', () => {
    handlers.onError?.();
  });

  return socket;
}
