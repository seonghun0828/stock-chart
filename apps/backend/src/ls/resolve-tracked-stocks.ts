import {
  LS_THEME_CANDIDATES,
  SECTOR_DEFINITIONS,
  STARTUP_SECTOR_STOCK_LIMIT,
  type TrackedStock,
} from '../config/sectors';
import type { LsSectorClient, LsThemeStock } from './ls-sector-client';

export { type LsSectorClient } from './ls-sector-client';

export async function resolveTrackedStocks(
  client: LsSectorClient,
  fallbackStocks: TrackedStock[],
) {
  try {
    const themes = await client.fetchThemes();
    const themesByName = new Map(themes.map((theme) => [theme.name, theme.code] as const));
    const fallbackBySector = groupFallbackBySector(fallbackStocks);

    const sectors = await Promise.all(
      SECTOR_DEFINITIONS.map(async (sector) => {
        const themeCodes = LS_THEME_CANDIDATES[sector.id]
          .map((themeName) => themesByName.get(themeName))
          .filter((themeCode): themeCode is string => Boolean(themeCode));

        if (themeCodes.length === 0) {
          return fallbackBySector.get(sector.id) ?? [];
        }

        try {
          const stocksByTheme = await Promise.all(
            themeCodes.map((themeCode) => client.fetchThemeStocks(themeCode)),
          );

          const resolved = normalizeThemeStocks(
            stocksByTheme.flat(),
            fallbackBySector.get(sector.id) ?? [],
            sector.id,
            sector.name,
          );

          return resolved.length > 0 ? resolved : fallbackBySector.get(sector.id) ?? [];
        } catch {
          return fallbackBySector.get(sector.id) ?? [];
        }
      }),
    );

    return sectors.flat();
  } catch {
    return fallbackStocks;
  }
}

function normalizeThemeStocks(
  stocks: LsThemeStock[],
  fallbackStocks: TrackedStock[],
  sectorId: TrackedStock['sectorId'],
  sectorName: string,
) {
  const fallbackByCode = new Map(fallbackStocks.map((stock) => [stock.code, stock] as const));
  const ranked = new Map<string, LsThemeStock>();

  for (const stock of stocks) {
    if (!/^\d{6}$/.test(stock.code)) {
      continue;
    }

    const current = ranked.get(stock.code);
    if (!current || compareThemeStocks(stock, current) < 0) {
      ranked.set(stock.code, stock);
    }
  }

  return Array.from(ranked.values())
    .sort(compareThemeStocks)
    .slice(0, STARTUP_SECTOR_STOCK_LIMIT)
    .map((stock) => ({
      code: stock.code,
      market: fallbackByCode.get(stock.code)?.market,
      sectorId,
      sectorName,
    }));
}

function compareThemeStocks(left: LsThemeStock, right: LsThemeStock) {
  const leftHasTrade = (left.tradeValue ?? 0) > 0 ? 1 : 0;
  const rightHasTrade = (right.tradeValue ?? 0) > 0 ? 1 : 0;
  if (rightHasTrade !== leftHasTrade) {
    return rightHasTrade - leftHasTrade;
  }

  const marketCapGap = (right.marketCap ?? 0) - (left.marketCap ?? 0);
  if (marketCapGap !== 0) {
    return marketCapGap;
  }

  const tradeValueGap = (right.tradeValue ?? 0) - (left.tradeValue ?? 0);
  if (tradeValueGap !== 0) {
    return tradeValueGap;
  }

  return left.code.localeCompare(right.code, 'en');
}

function groupFallbackBySector(fallbackStocks: TrackedStock[]) {
  return new Map(
    SECTOR_DEFINITIONS.map((sector) => [
      sector.id,
      fallbackStocks.filter((stock) => stock.sectorId === sector.id),
    ]),
  );
}
