import { useEffect, useState } from 'react';
import {
  INDICATOR_IDS,
  IndicatorId,
  IndicatorReading,
  loadIndicator,
  readCache,
  writeCache,
} from './officialData';

export type IndicatorState =
  | { status: 'loading' }
  | { status: 'ok'; data: IndicatorReading }
  | { status: 'error' };

export type IndicatorStates = Record<IndicatorId, IndicatorState>;

const initialStates = (): IndicatorStates => {
  const cached = readCache();
  return Object.fromEntries(
    INDICATOR_IDS.map((id) => [
      id,
      cached?.[id] ? { status: 'ok', data: cached[id] } : { status: 'loading' },
    ])
  ) as IndicatorStates;
};

/** Consulta as seis séries oficiais em paralelo; cada uma resolve ou falha sozinha. */
export const useIndicators = (): IndicatorStates => {
  const [states, setStates] = useState<IndicatorStates>(initialStates);

  useEffect(() => {
    if (readCache() && INDICATOR_IDS.every((id) => states[id].status === 'ok')) return;
    let alive = true;
    const collected: Partial<Record<IndicatorId, IndicatorReading>> = {};

    Promise.allSettled(
      INDICATOR_IDS.map(async (id) => {
        try {
          const data = await loadIndicator(id);
          collected[id] = data;
          if (alive) setStates((prev) => ({ ...prev, [id]: { status: 'ok', data } }));
        } catch {
          if (alive) setStates((prev) => ({ ...prev, [id]: { status: 'error' } }));
        }
      })
    ).then(() => {
      if (Object.keys(collected).length === INDICATOR_IDS.length) writeCache(collected);
    });

    return () => {
      alive = false;
    };
    // Consulta uma única vez por carregamento da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return states;
};

const num = (value: number, digits: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Valor do indicador no formato de leitura do noticiário. */
export const formatIndicator = (id: IndicatorId, value: number): string => {
  const sign = value < 0 ? '−' : '';
  const abs = Math.abs(value);
  switch (id) {
    case 'ptax':
      return `R$ ${num(abs, 4)}`;
    case 'primario':
      if (abs < 0.005) return 'Equilíbrio (0% do PIB)';
      return `${value < 0 ? 'Déficit' : 'Superávit'} de ${num(abs, 2)}% do PIB`;
    case 'pib':
    case 'pnad':
      return `${sign}${num(abs, 1)}%`;
    default:
      return `${sign}${num(abs, 2)}%`;
  }
};

/** Diferença para a observação anterior, em pontos percentuais ou reais. */
export const formatChange = (id: IndicatorId, diff: number): string => {
  if (Math.abs(diff) < (id === 'ptax' ? 0.00005 : 0.005)) return 'estável';
  const sign = diff > 0 ? '+' : '−';
  return id === 'ptax' ? `${sign}R$ ${num(Math.abs(diff), 4)}` : `${sign}${num(Math.abs(diff), 2)} p.p.`;
};
