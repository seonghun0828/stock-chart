import type { Request, Response } from 'express';
import type { MarketServiceLike } from '../types';

export function getMarketSnapshot(
  marketService: MarketServiceLike,
  _request: Request,
  response: Response,
) {
  response.json(marketService.getSnapshot());
}
