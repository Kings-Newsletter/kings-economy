import React from 'react';

type Size = number | string;
const toCss = (v?: Size) => (typeof v === 'number' ? `${v}px` : v);

/** Bloco cinza com brilho que ocupa o lugar de um conteúdo ainda carregando. Decorativo. */
export const Skeleton: React.FC<{
  width?: Size;
  height?: Size;
  radius?: Size;
  className?: string;
  style?: React.CSSProperties;
}> = ({ width, height, radius, className = '', style }) => (
  <span
    className={`skeleton ${className}`}
    aria-hidden="true"
    style={{ width: toCss(width), height: toCss(height), borderRadius: toCss(radius), ...style }}
  />
);

/** Linhas de texto simuladas; a última fica mais curta, como um parágrafo de verdade. */
export const SkeletonText: React.FC<{ lines?: number; lastWidth?: string; className?: string }> = ({
  lines = 3,
  lastWidth = '60%',
  className = '',
}) => (
  <span className={`skeleton-text ${className}`} aria-hidden="true">
    {Array.from({ length: lines }, (_, i) => (
      <span key={i} className="skeleton skeleton-line" style={i === lines - 1 && lines > 1 ? { width: lastWidth } : undefined} />
    ))}
  </span>
);

/** Velas do pregão: abertura até fechamento, com a máxima e a mínima no pavio. */
const CANDLES = [
  { x: 6, top: 24, h: 9, wick: [20, 36], up: true },
  { x: 18, top: 20, h: 8, wick: [16, 31], up: true },
  { x: 30, top: 22, h: 7, wick: [18, 33], up: false },
  { x: 42, top: 13, h: 10, wick: [9, 26], up: true },
  { x: 54, top: 6, h: 9, wick: [3, 19], up: true },
] as const;
// Linha de preço pelos fechamentos: topo da vela de alta, base da vela de baixa.
const TREND = CANDLES.map((c) => `${c.x},${c.up ? c.top : c.top + c.h}`).join(' ');

/**
 * Carregamento com cara de mercado: as velas de um gráfico de candlestick abrem uma a uma
 * e a linha de preço se desenha por cima. Com "reduzir movimento", o gráfico fica parado
 * e só pulsa de leve.
 */
export const MarketLoader: React.FC<{ size?: number; label?: string; caption?: string; className?: string }> = ({
  size = 64,
  label,
  caption,
  className = '',
}) => (
  <span className={`market-loader ${className}`} role={label || caption ? 'status' : undefined}>
    <svg
      className="market-loader-chart"
      viewBox="0 0 60 40"
      width={size}
      height={(size * 40) / 60}
      aria-hidden="true"
      focusable="false"
    >
      <line className="market-loader-base" x1="0" y1="39" x2="60" y2="39" />
      {CANDLES.map((c, i) => (
        <g
          key={c.x}
          className={`market-loader-candle ${c.up ? 'is-up' : 'is-down'}`}
          style={{ '--i': i } as React.CSSProperties}
        >
          <line x1={c.x} y1={c.wick[0]} x2={c.x} y2={c.wick[1]} />
          <rect x={c.x - 3.5} y={c.top} width="7" height={c.h} rx="1" />
        </g>
      ))}
      <polyline className="market-loader-trend" points={TREND} pathLength={100} />
    </svg>
    {caption && <span className="market-loader-caption">{caption}</span>}
    {label && <span className="sr-only">{label}</span>}
  </span>
);
