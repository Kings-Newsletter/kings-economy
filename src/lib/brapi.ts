/**
 * Cotações da B3 pela brapi (https://brapi.dev), com o token do arquivo .env.local
 * (VITE_BRAPI_TOKEN). Limites do plano gratuito, conferidos na própria API:
 *   - 1 ativo por requisição em /api/quote; a lista /api/quote/list traz vários de uma vez;
 *   - histórico de até 3 meses (ranges 1d, 5d, 1mo e 3mo);
 *   - dados com atraso de até 30 minutos;
 *   - 15 mil requisições por mês, somando todos os visitantes.
 * Por isso as respostas ficam em cache no navegador.
 *
 * Atenção: o site não tem servidor, então o token vai junto no JavaScript publicado.
 */

import { useEffect, useState } from 'react';
import type { Loadable } from './marketData';

const TOKEN: string | undefined = import.meta.env.VITE_BRAPI_TOKEN || undefined;
export const HAS_BRAPI_TOKEN = Boolean(TOKEN);

export const RANGES = [
  { id: '5d', label: '5 dias' },
  { id: '1mo', label: '1 mês' },
  { id: '3mo', label: '3 meses' },
] as const;
export type RangeId = (typeof RANGES)[number]['id'];

export interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  logo?: string;
  isIndex?: boolean;
}

export interface HistoryPoint {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayLow: number;
  dayHigh: number;
  low52: number;
  high52: number;
  volume: number;
  marketCap: number | null;
  priceEarnings: number | null;
  time: number;
  logo?: string;
  history: HistoryPoint[];
  profile: {
    sector?: string;
    industry?: string;
    city?: string;
    state?: string;
    website?: string;
    summary?: string;
  };
}

const withToken = (url: string) => {
  if (!TOKEN) return url;
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(TOKEN)}`;
};

const fetchJson = async <T>(url: string, timeoutMs = 15000): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(withToken(url), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
};

/** Marca um resultado que veio incompleto (uma das consultas falhou): mostra, mas não guarda. */
class Partial<T> {
  constructor(public data: T) {}
}

const cached = async <T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T | Partial<T>>
): Promise<T> => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const { savedAt, data } = JSON.parse(raw) as { savedAt: number; data: T };
      if (Date.now() - savedAt < ttlMs) return data;
    }
  } catch {
    /* segue para a consulta */
  }
  const result = await load();
  if (result instanceof Partial) return result.data;
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data: result }));
  } catch {
    /* sem armazenamento, consulta de novo na próxima vez */
  }
  return result;
};

interface QuoteResult {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayLow: number;
  regularMarketDayHigh: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  regularMarketVolume: number;
  marketCap?: number | null;
  priceEarnings?: number | null;
  regularMarketTime: string;
  logourl?: string;
  historicalDataPrice?: HistoryPoint[];
  summaryProfile?: {
    sectorDisp?: string;
    industryDisp?: string;
    city?: string;
    state?: string;
    website?: string;
    longBusinessSummary?: string;
  };
}

const TICKER_TTL = 15 * 60 * 1000;
const DETAIL_TTL = 15 * 60 * 1000;
const DEMO = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3'];

/** Ibovespa e as 20 ações mais negociadas do dia (ou as 4 de demonstração, sem token). */
const loadTicker = (): Promise<TickerItem[]> =>
  cached('ke-b3-ticker-v1', TICKER_TTL, async () => {
    if (!TOKEN) {
      const data = await fetchJson<{ results: QuoteResult[] }>(`https://brapi.dev/api/quote/${DEMO.join(',')}`);
      return data.results.map((r) => ({
        symbol: r.symbol,
        name: r.longName ?? r.symbol,
        price: r.regularMarketPrice,
        changePercent: r.regularMarketChangePercent,
        logo: r.logourl,
      }));
    }
    const [index, list] = await Promise.allSettled([
      fetchJson<{ results: QuoteResult[] }>('https://brapi.dev/api/quote/%5EBVSP'),
      fetchJson<{
        stocks: Array<{ stock: string; name: string; close: number; change: number; logo?: string }>;
      }>('https://brapi.dev/api/quote/list?type=stock&sortBy=volume&sortOrder=desc&limit=20'),
    ]);
    const items: TickerItem[] = [];
    if (index.status === 'fulfilled' && index.value.results?.[0]) {
      const r = index.value.results[0];
      items.push({
        symbol: r.symbol,
        name: 'Ibovespa',
        price: r.regularMarketPrice,
        changePercent: r.regularMarketChangePercent,
        isIndex: true,
      });
    }
    if (list.status === 'fulfilled') {
      list.value.stocks
        .filter((s) => Number.isFinite(s.close))
        .forEach((s) =>
          items.push({ symbol: s.stock, name: s.name, price: s.close, changePercent: s.change, logo: s.logo })
        );
    }
    if (!items.length) throw new Error('Sem cotações');
    // Se a lista de ações falhou (limite de consultas, por exemplo), mostra o que veio sem
    // guardar: assim a próxima visita tenta de novo em vez de ficar 15 minutos incompleta.
    return index.status === 'fulfilled' && list.status === 'fulfilled' ? items : new Partial(items);
  });

export const loadStockDetail = (symbol: string, range: RangeId): Promise<StockDetail> =>
  cached(`ke-b3-${symbol}-${range}-v1`, DETAIL_TTL, async () => {
    const params = new URLSearchParams({ range, interval: '1d' });
    if (TOKEN) {
      params.set('fundamental', 'true');
      params.set('modules', 'summaryProfile');
    }
    const data = await fetchJson<{ results?: QuoteResult[] }>(
      `https://brapi.dev/api/quote/${encodeURIComponent(symbol)}?${params}`
    );
    const r = data.results?.[0];
    if (!r || !Number.isFinite(r.regularMarketPrice)) throw new Error('Ativo sem cotação');
    const p = r.summaryProfile ?? {};
    return {
      symbol: r.symbol,
      name: r.longName ?? r.shortName ?? r.symbol,
      price: r.regularMarketPrice,
      change: r.regularMarketChange,
      changePercent: r.regularMarketChangePercent,
      previousClose: r.regularMarketPreviousClose,
      open: r.regularMarketOpen,
      dayLow: r.regularMarketDayLow,
      dayHigh: r.regularMarketDayHigh,
      low52: r.fiftyTwoWeekLow,
      high52: r.fiftyTwoWeekHigh,
      volume: r.regularMarketVolume,
      marketCap: r.marketCap ?? null,
      priceEarnings: r.priceEarnings ?? null,
      time: Date.parse(r.regularMarketTime),
      logo: r.logourl,
      history: (r.historicalDataPrice ?? [])
        .filter((h) => Number.isFinite(h.close))
        .map((h) => ({ ...h, date: h.date * 1000 })),
      profile: {
        sector: p.sectorDisp,
        industry: p.industryDisp,
        city: p.city,
        state: p.state,
        website: p.website,
        summary: p.longBusinessSummary,
      },
    };
  });

export const useTicker = (): Loadable<TickerItem[]> => {
  const [state, setState] = useState<Loadable<TickerItem[]>>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    loadTicker()
      .then((data) => alive && setState({ status: 'ok', data }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
};

export const useStockDetail = (symbol: string, range: RangeId): Loadable<StockDetail> => {
  const [state, setState] = useState<Loadable<StockDetail>>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    loadStockDetail(symbol, range)
      .then((data) => alive && setState({ status: 'ok', data }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, [symbol, range]);
  return state;
};

/** Endereço da página da ação dentro do portal. */
export const stockHref = (symbol: string) => `#/acao/${encodeURIComponent(symbol)}`;
