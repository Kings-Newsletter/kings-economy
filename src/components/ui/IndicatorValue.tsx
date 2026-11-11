import React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { IndicatorId, SeriesPoint } from '../../lib/officialData';
import { IndicatorState, formatChange, formatIndicator } from '../../lib/useIndicators';

/** Mini gráfico de linha das últimas observações. */
export const Sparkline: React.FC<{ points: SeriesPoint[]; label: string }> = ({ points, label }) => {
  if (points.length < 2) return null;
  const w = 112;
  const h = 32;
  const pad = 3;
  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (max === min) {
    max += 1;
    min -= 1;
  }
  const x = (i: number) => (i * w) / (points.length - 1);
  const y = (v: number) => pad + ((max - v) * (h - pad * 2)) / (max - min);
  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={label}>
      {min < 0 && max > 0 && <line x1={0} x2={w} y1={y(0)} y2={y(0)} className="sparkline-zero" />}
      <polygon points={`0,${h} ${line} ${w},${h}`} className="sparkline-area" />
      <polyline points={line} className="sparkline-line" />
      <circle cx={x(points.length - 1)} cy={y(values[values.length - 1])} r={2.5} className="sparkline-dot" />
    </svg>
  );
};

/** Leitura atual: valor, variação em relação à observação anterior e data do dado. */
export const IndicatorValue: React.FC<{
  id: IndicatorId;
  name: string;
  state: IndicatorState;
  showSpark?: boolean;
}> = ({ id, name, state, showSpark = true }) => {
  if (state.status === 'loading') {
    return (
      <span className="reading is-loading" aria-busy="true">
        <span className="reading-skeleton" aria-hidden="true" />
        <span className="sr-only">Carregando {name}…</span>
      </span>
    );
  }
  if (state.status === 'error') {
    return (
      <span className="reading is-error">
        <strong>Indisponível</strong>
        <small>A fonte oficial não respondeu agora. Tente recarregar a página mais tarde.</small>
      </span>
    );
  }

  const { data } = state;
  const diff = data.previous === null ? null : data.latest - data.previous;
  const direction = diff === null || formatChange(id, diff) === 'estável' ? 'flat' : diff > 0 ? 'up' : 'down';
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  return (
    <span className="reading">
      <strong className="reading-value">{formatIndicator(id, data.latest)}</strong>
      {diff !== null && (
        <span className={`reading-trend is-${direction}`} title={`Variação ${data.comparison}`}>
          <TrendIcon aria-hidden="true" size={15} />
          <span className="sr-only">Variação {data.comparison}: </span>
          {formatChange(id, diff)}
        </span>
      )}
      {showSpark && (
        <Sparkline
          points={data.points}
          label={`${name} nas últimas ${data.points.length} observações, de ${formatIndicator(id, Math.min(...data.points.map((p) => p.value)))} a ${formatIndicator(id, Math.max(...data.points.map((p) => p.value)))}`}
        />
      )}
      <small className="reading-period">
        {data.period}, {data.source}
      </small>
    </span>
  );
};
