import type { Server } from 'node:http';
import { WebSocketServer } from 'ws';
import type { MarketServiceLike } from './types';

export function createMarketWebSocketServer(
  server: Server,
  marketService: MarketServiceLike,
) {
  const webSocketServer = new WebSocketServer({ server });

  webSocketServer.on('connection', (socket) => {
    socket.send(JSON.stringify(marketService.getSnapshot()));
  });

  return webSocketServer;
}
