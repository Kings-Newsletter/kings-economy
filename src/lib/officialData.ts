/**
 * Séries oficiais consultadas direto no navegador, nas APIs públicas:
 *   Banco Central (SGS): https://api.bcb.gov.br/dados/serie/bcdata.sgs.{código}/dados
 *   IBGE (SIDRA):        https://apisidra.ibge.gov.br e, como reserva, servicodados.ibge.gov.br/api/v3
 * Mesma abordagem do projeto daily-newsletter. Nenhum valor é inventado: se a consulta
 * falha, o indicador aparece como indisponível.
 */

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface IndicatorReading {
  /** Observações em ordem cronológica; a última é a mais recente. */
  points: SeriesPoint[];
  latest: number;
  previous: number | null;
  /** Período ou data da última observação, como veio da fonte. */
  period: string;
  source: string;
  /** Como comparar com a observação anterior: "ao mês anterior", "ao trimestre anterior"… */
  comparison: string;
}

export type IndicatorId = 'selic' | 'ipca' | 'primario' | 'ptax' | 'pib' | 'pnad';

const CACHE_KEY = 'ke-indicadores-v2';
const CACHE_TTL_MS = 60 * 60 * 1000;

const toNumber = (value: unknown): number => Number(String(value).replace(',', '.'));

const fetchJson = async <T>(url: string, timeoutMs = 12000): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
};

const queryDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthLabel = (sgsDate: string) => {
  const [, m, y] = sgsDate.split('/');
  return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`;
};

interface SgsRow {
  data: string;
  valor: string;
}

const reading = (
  points: SeriesPoint[],
  period: string,
  source: string,
  comparison: string
): IndicatorReading => {
  if (!points.length) throw new Error('Série sem observação');
  return {
    points,
    latest: points[points.length - 1].value,
    previous: points.length > 1 ? points[points.length - 2].value : null,
    period,
    source,
    comparison,
  };
};

/** Série mensal do SGS: últimas 13 observações. */
const sgsMonthly = async (code: number, comparison = 'ao mês anterior') => {
  const rows = await fetchJson<SgsRow[]>(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/13?formato=json`
  );
  const valid = rows.filter((r) => r?.data && Number.isFinite(toNumber(r.valor)));
  const last = valid[valid.length - 1];
  return reading(
    valid.map((r) => ({ label: monthLabel(r.data), value: toNumber(r.valor) })),
    last ? `dado de ${monthLabel(last.data)}` : '',
    'Banco Central',
    comparison
  );
};

/** Série diária do SGS: guarda a última observação de cada mês do último ano. */
const sgsDaily = async (code: number) => {
  const end = new Date();
  const start = new Date(end.getFullYear() - 1, end.getMonth() - 1, 1);
  const params = new URLSearchParams({
    formato: 'json',
    dataInicial: queryDate(start),
    dataFinal: queryDate(end),
  });
  const rows = await fetchJson<SgsRow[]>(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?${params}`
  );
  const valid = rows.filter((r) => r?.data && Number.isFinite(toNumber(r.valor)));
  const byMonth = new Map<string, SgsRow>();
  valid.forEach((r) => byMonth.set(r.data.split('/').slice(1).reverse().join('-'), r));
  const monthly = [...byMonth.values()];
  const last = valid[valid.length - 1];
  return reading(
    monthly.map((r) => ({ label: monthLabel(r.data), value: toNumber(r.valor) })),
    last ? `dado de ${last.data}` : '',
    'Banco Central',
    'ao fim do mês anterior'
  );
};

interface SidraRow {
  V: string;
  D1N?: string;
  D2N?: string;
  D3N?: string;
}

type SidraV3 = Array<{
  resultados?: Array<{ series?: Array<{ serie?: Record<string, string> }> }>;
}>;

/** Tabela do SIDRA, com a API v3 do IBGE como reserva. */
const sidra = async (
  table: string,
  variable: string,
  comparison: string,
  classification?: { legacy: string; v3: string }
) => {
  try {
    const rows = await fetchJson<SidraRow[]>(
      `https://apisidra.ibge.gov.br/values/t/${table}/n1/1/v/${variable}/p/last%208${classification?.legacy ?? ''}`
    );
    const valid = rows.slice(1).filter((r) => r.V && r.V !== '...' && Number.isFinite(toNumber(r.V)));
    const label = (r: SidraRow) => r.D3N || r.D2N || r.D1N || '';
    return reading(
      valid.map((r) => ({ label: label(r), value: toNumber(r.V) })),
      label(valid[valid.length - 1] ?? ({} as SidraRow)),
      'IBGE',
      comparison
    );
  } catch {
    const data = await fetchJson<SidraV3>(
      `https://servicodados.ibge.gov.br/api/v3/agregados/${table}/periodos/-8/variaveis/${variable}?localidades=N1[all]${classification?.v3 ?? ''}`
    );
    const serie = data?.[0]?.resultados?.[0]?.series?.[0]?.serie ?? {};
    const periods = Object.keys(serie)
      .sort()
      .filter((p) => Number.isFinite(toNumber(serie[p])));
    return reading(
      periods.map((p) => ({ label: p, value: toNumber(serie[p]) })),
      periods[periods.length - 1] ?? '',
      'IBGE',
      comparison
    );
  }
};

/** IPCA em 12 meses: série 13522 do BC; se falhar, acumula os 12 últimos meses do IBGE. */
const ipcaTwelveMonths = async () => {
  try {
    return await sgsMonthly(13522);
  } catch {
    const monthly = await sidra('1737', '63', 'ao mês anterior');
    const last12 = monthly.points.slice(-12);
    if (last12.length < 12) throw new Error('IPCA mensal incompleto');
    const accumulated = (last12.reduce((f, p) => f * (1 + p.value / 100), 1) - 1) * 100;
    return reading([{ label: monthly.period, value: accumulated }], monthly.period, 'IBGE', 'ao mês anterior');
  }
};

const LOADERS: Record<IndicatorId, () => Promise<IndicatorReading>> = {
  selic: () => sgsDaily(432),
  ipca: ipcaTwelveMonths,
  // A série 5793 segue a convenção de necessidade de financiamento (NFSP): positivo é déficit.
  // O sinal é invertido para que positivo signifique superávit, como no noticiário.
  primario: async () => {
    const r = await sgsMonthly(5793);
    const points = r.points.map((p) => ({ ...p, value: -p.value }));
    return { ...r, points, latest: -r.latest, previous: r.previous === null ? null : -r.previous };
  },
  ptax: () => sgsDaily(1),
  pib: () =>
    sidra('5932', '6564', 'ao trimestre anterior', {
      legacy: '/c11255/90707',
      v3: '&classificacao=11255[90707]',
    }),
  pnad: () => sgsMonthly(24369, 'ao trimestre móvel anterior'),
};

export const INDICATOR_IDS = Object.keys(LOADERS) as IndicatorId[];

type Cached = { savedAt: number; data: Partial<Record<IndicatorId, IndicatorReading>> };

export const readCache = (): Partial<Record<IndicatorId, IndicatorReading>> | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    return Date.now() - parsed.savedAt < CACHE_TTL_MS ? parsed.data : null;
  } catch {
    return null;
  }
};

export const writeCache = (data: Partial<Record<IndicatorId, IndicatorReading>>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data } satisfies Cached));
  } catch {
    /* sem armazenamento, a próxima visita consulta de novo */
  }
};

export const loadIndicator = (id: IndicatorId) => LOADERS[id]();
