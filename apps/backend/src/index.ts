import { createServer } from 'node:http';
import { readEnv } from './config/env';
import { createEmptyMarketState } from './domain/market-state';
import { createLsClients } from './ls/create-ls-clients';
import { createApp } from './server/create-app';
import { createMarketWebSocketServer } from './server/create-websocket';
import { MarketService } from './services/market-service';

const env = readEnv();
const port = Number(env.BACKEND_PORT);
const state = createEmptyMarketState();
const { restClient, realtimeClient } = createLsClients(env);
const marketService = new MarketService(restClient, realtimeClient, state);

const app = createApp(marketService);
const server = createServer(app);

createMarketWebSocketServer(server, marketService);

server.listen(port, async () => {
  await marketService.connect([]);
  console.log(`backend listening on http://localhost:${port}`);
});
