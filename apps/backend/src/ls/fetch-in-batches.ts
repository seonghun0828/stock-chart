export async function fetchWithSingleRetryInBatches<T>(
  items: string[],
  batchSize: number,
  batchDelayMs: number,
  worker: (item: string) => Promise<T | null>,
  sleep: (ms: number) => Promise<void>,
) {
  const results: T[] = [];
  const failedItems = new Set<string>();

  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize);
    const batchResults = await Promise.allSettled(batch.map((item) => worker(item)));

    for (const [index, result] of batchResults.entries()) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
        continue;
      }

      failedItems.add(batch[index] as string);
    }

    if (start + batchSize < items.length) {
      await sleep(batchDelayMs);
    }
  }

  if (failedItems.size === 0) {
    return results;
  }

  const retryResults = await Promise.allSettled(
    Array.from(failedItems).map((item) => worker(item)),
  );

  for (const result of retryResults) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
    }
  }

  return results;
}
