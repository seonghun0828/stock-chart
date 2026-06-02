import type { Server } from 'node:http';
import { WebSocketServer } from 'ws';
import type { MarketServiceLike } from './types';

export function createMarketWebSocketServer(
  server: Server,
  marketService: MarketServiceLike,
) {
  const webSocketServer = new WebSocketServer({ server });
  const unsubscribe = marketService.subscribe((snapshot) => {
    const payload = JSON.stringify(snapshot);

    for (const client of webSocketServer.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  });

  webSocketServer.on('connection', (socket) => {
    socket.send(JSON.stringify(marketService.getSnapshot()));
  });

  webSocketServer.on('close', () => {
    unsubscribe();
  });

  return webSocketServer;
}
