import type { Request, Response } from 'express';
import type { MarketServiceLike } from '../types';

export function getHealthStatus(
  marketService: MarketServiceLike,
  _request: Request,
  response: Response,
) {
  response.json(marketService.getHealth());
}
