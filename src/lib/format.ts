const MINUS = '−';

/** Valor em reais no padrão brasileiro (R$ 1.234,56). */
export const brl = (value: number, digits = 2): string =>
  (Number.isFinite(value) ? value : 0)
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    .replace('-', MINUS);

/** Percentual com vírgula decimal; `signed` acrescenta "+" aos positivos. */
export const pct = (value: number, digits = 1, signed = true): string => {
  const safe = Number.isFinite(value) ? value : 0;
  const body = Math.abs(safe).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const sign = safe < 0 ? MINUS : signed && safe > 0 ? '+' : '';
  return `${sign}${body}%`;
};

/** Converte o texto de um campo numérico, tratando vazio como zero. */
export const toNumber = (raw: string): number => {
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};
