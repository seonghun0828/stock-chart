import { readEnv } from '../config/env';

type TokenProvider = () => Promise<string>;

export type LsTheme = {
  code: string;
  name: string;
};

export type LsThemeStock = {
  code: string;
  name: string;
  marketCap?: number;
  tradeValue?: number;
};

type T8425Response = {
  t8425OutBlock?: Array<{
    tmcode?: string;
    tmname?: string;
  }>;
};

type T1537Response = {
  t1537OutBlock1?: Array<{
    shcode?: string;
    hname?: string;
    marketcap?: number | string;
    value?: number | string;
  }>;
};

export interface LsSectorClient {
  fetchThemes(): Promise<LsTheme[]>;
  fetchThemeStocks(themeCode: string): Promise<LsThemeStock[]>;
}

export class RealLsSectorClient implements LsSectorClient {
  private readonly baseUrl: string;

  constructor(
    private readonly getAccessToken: TokenProvider,
    baseUrl = readEnv().LS_BASE_URL ?? 'https://openapi.ls-sec.co.kr:8080',
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async fetchThemes() {
    const response = await this.request('t8425', {
      t8425InBlock: { dummy: '' },
    });
    const payload = (await response.json()) as T8425Response;

    return (payload.t8425OutBlock ?? [])
      .filter((theme) => theme.tmcode && theme.tmname)
      .map((theme) => ({
        code: String(theme.tmcode),
        name: String(theme.tmname),
      }));
  }

  async fetchThemeStocks(themeCode: string) {
    const response = await this.request('t1537', {
      t1537InBlock: { tmcode: themeCode },
    });
    const payload = (await response.json()) as T1537Response;

    return (payload.t1537OutBlock1 ?? [])
      .filter((stock) => stock.shcode && stock.hname)
      .map((stock) => ({
        code: String(stock.shcode),
        name: String(stock.hname),
        marketCap: toNumber(stock.marketcap),
        tradeValue: toNumber(stock.value),
      }));
  }

  private async request(trCode: string, body: unknown) {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/stock/sector`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        authorization: `Bearer ${token}`,
        tr_cd: trCode,
        tr_cont: 'N',
        tr_cont_key: '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`LS sector request failed for ${trCode}: ${response.status}`);
    }

    return response;
  }
}

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return Number(value.replace(/,/g, ''));
  }

  return undefined;
}
