/**
 * Cotações de mercado de fontes gratuitas, consultadas no navegador e sem chave:
 *   AwesomeAPI (moedas e bitcoin): https://economia.awesomeapi.com.br
 *   brapi (ações de demonstração da B3, sem token): https://brapi.dev
 * São serviços de terceiros, não fontes oficiais. Cada cotação traz o horário informado
 * pela fonte; se a consulta falha, o item aparece como indisponível.
 */

import { useEffect, useState } from 'react';
import type { SeriesPoint } from './officialData';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'BTC';

export interface CurrencyQuote {
  code: CurrencyCode;
  bid: number;
  changePercent: number;
  high: number;
  low: number;
  /** Horário da cotação, em milissegundos. */
  time: number;
  /** Fechamentos diários, do mais antigo ao mais recente. */
  history: SeriesPoint[];
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  dayLow: number;
  dayHigh: number;
  time: number;
}

export type Loadable<T> = { status: 'loading' } | { status: 'ok'; data: T } | { status: 'error' };

export const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'BTC'];
/** As únicas ações que a brapi libera sem token. */
export const DEMO_STOCKS = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3'];

const CACHE_KEY = 'ke-mercado-v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

const fetchJson = async <T>(url: string, timeoutMs = 12000): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
};

const n = (v: unknown) => Number(v);

interface AwesomeRow {
  bid: string;
  high: string;
  low: string;
  pctChange: string;
  timestamp: string;
}

const dayLabel = (ms: number) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(ms));

const loadCurrency = async (code: CurrencyCode): Promise<CurrencyQuote> => {
  const rows = await fetchJson<AwesomeRow[]>(
    `https://economia.awesomeapi.com.br/json/daily/${code}-BRL/15`
  );
  const valid = rows.filter((r) => Number.isFinite(n(r.bid)) && Number.isFinite(n(r.timestamp)));
  if (!valid.length) throw new Error('Moeda sem cotação');
  const latest = valid[0];
  const history = [...valid]
    .reverse()
    .map((r) => ({ label: dayLabel(n(r.timestamp) * 1000), value: n(r.bid) }));
  return {
    code,
    bid: n(latest.bid),
    changePercent: n(latest.pctChange),
    high: n(latest.high),
    low: n(latest.low),
    time: n(latest.timestamp) * 1000,
    history,
  };
};

interface BrapiResult {
  symbol: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketDayLow: number;
  regularMarketDayHigh: number;
  regularMarketTime: string;
}

const loadStocks = async (): Promise<StockQuote[]> => {
  const data = await fetchJson<{ results?: BrapiResult[] }>(
    `https://brapi.dev/api/quote/${DEMO_STOCKS.join(',')}`
  );
  const results = (data.results ?? []).filter((r) => Number.isFinite(r.regularMarketPrice));
  if (!results.length) throw new Error('Sem cotações');
  return results.map((r) => ({
    symbol: r.symbol,
    name: r.longName ?? r.shortName ?? r.symbol,
    price: r.regularMarketPrice,
    change: r.regularMarketChange,
    changePercent: r.regularMarketChangePercent,
    previousClose: r.regularMarketPreviousClose,
    dayLow: r.regularMarketDayLow,
    dayHigh: r.regularMarketDayHigh,
    time: Date.parse(r.regularMarketTime),
  }));
};

export interface MarketState {
  currencies: Record<CurrencyCode, Loadable<CurrencyQuote>>;
  stocks: Loadable<StockQuote[]>;
}

type Cached = {
  savedAt: number;
  currencies: Partial<Record<CurrencyCode, CurrencyQuote>>;
  stocks?: StockQuote[];
};

const readCache = (): Cached | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    return Date.now() - parsed.savedAt < CACHE_TTL_MS ? parsed : null;
  } catch {
    return null;
  }
};

const writeCache = (value: Cached) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    /* sem armazenamento, a próxima visita consulta de novo */
  }
};

const initial = (): MarketState => {
  const cached = readCache();
  return {
    currencies: Object.fromEntries(
      CURRENCIES.map((c) => [
        c,
        cached?.currencies[c] ? { status: 'ok', data: cached.currencies[c] } : { status: 'loading' },
      ])
    ) as MarketState['currencies'],
    stocks: cached?.stocks ? { status: 'ok', data: cached.stocks } : { status: 'loading' },
  };
};

/** Consulta moedas e ações uma vez por carregamento (ou usa o cache de 5 minutos). */
export const useMarket = (): MarketState => {
  const [state, setState] = useState<MarketState>(initial);

  useEffect(() => {
    if (readCache()?.stocks && CURRENCIES.every((c) => state.currencies[c].status === 'ok')) return;
    let alive = true;
    const collected: Cached = { savedAt: 0, currencies: {} };

    const currencyLoads = CURRENCIES.map(async (code) => {
      try {
        const data = await loadCurrency(code);
        collected.currencies[code] = data;
        if (alive)
          setState((prev) => ({ ...prev, currencies: { ...prev.currencies, [code]: { status: 'ok', data } } }));
      } catch {
        if (alive)
          setState((prev) => ({ ...prev, currencies: { ...prev.currencies, [code]: { status: 'error' } } }));
      }
    });

    const stockLoad = (async () => {
      try {
        const data = await loadStocks();
        collected.stocks = data;
        if (alive) setState((prev) => ({ ...prev, stocks: { status: 'ok', data } }));
      } catch {
        if (alive) setState((prev) => ({ ...prev, stocks: { status: 'error' } }));
      }
    })();

    Promise.allSettled([...currencyLoads, stockLoad]).then(() => {
      if (collected.stocks && Object.keys(collected.currencies).length === CURRENCIES.length) {
        writeCache({ ...collected, savedAt: Date.now() });
      }
    });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
};

export const CURRENCY_NAMES: Record<CurrencyCode, { short: string; long: string }> = {
  USD: { short: 'Dólar comercial', long: 'Dólar americano' },
  EUR: { short: 'Euro', long: 'Euro' },
  GBP: { short: 'Libra', long: 'Libra esterlina' },
  BTC: { short: 'Bitcoin', long: 'Bitcoin' },
};

export const formatQuoteTime = (ms: number) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(ms))
    .replace(',', ' às');

export const formatCurrencyBid = (code: CurrencyCode, value: number) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: code === 'BTC' ? 0 : 4,
    maximumFractionDigits: code === 'BTC' ? 0 : 4,
  });
