import { createServer } from 'node:http';
import { readEnv } from './config/env';
import { getTrackedStocks } from './config/sectors';
import { createEmptyMarketState } from './domain/market-state';
import { createLsClients } from './ls/create-ls-clients';
import { resolveTrackedStocks } from './ls/resolve-tracked-stocks';
import { createApp } from './server/create-app';
import { createMarketWebSocketServer } from './server/create-websocket';
import { MarketService } from './services/market-service';

const env = readEnv();
const host = env.BACKEND_HOST;
const port = Number(env.BACKEND_PORT);
const fallbackTrackedStocks = getTrackedStocks();
const state = createEmptyMarketState();
const bootstrapClients = createLsClients(env);
const trackedStocks =
  env.USE_MOCK_LS === 'true' || !bootstrapClients.sectorClient
    ? fallbackTrackedStocks
    : await resolveTrackedStocks(bootstrapClients.sectorClient, fallbackTrackedStocks);
const { restClient, realtimeClient } = createLsClients(env, trackedStocks);
const marketService = new MarketService(restClient, realtimeClient, state);

const app = createApp(marketService);
const server = createServer(app);

createMarketWebSocketServer(server, marketService);

await marketService.connect(trackedStocks.map((stock) => stock.code));

server.listen(port, host, () => {
  console.log(`backend listening on http://${host}:${port}`);
});
