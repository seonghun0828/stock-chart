import type { RealtimePatch } from './types';

export interface LsRealtimeClient {
  connect(
    codes: string[],
    onMessage: (patches: RealtimePatch[]) => void,
  ): Promise<void>;
}
