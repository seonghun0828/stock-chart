import type { InitialQuote } from './types';

export interface LsRestClient {
  fetchInitialQuotes(codes: string[]): Promise<InitialQuote[]>;
}
