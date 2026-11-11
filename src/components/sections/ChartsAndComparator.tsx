import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Percent, RefreshCw } from 'lucide-react';
import type { IndicatorStates } from '../../lib/useIndicators';
import { brl, pct } from '../../lib/format';
import { MoneyField, RangeField, SectionHead } from '../ui/RangeField';

const HORIZONS = [5, 10, 15, 20];

/** Acompanha a largura real do contêiner para o texto do gráfico não encolher no celular. */
const useWidth = (fallback: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
};

const niceTicks = (min: number, max: number, count = 4): number[] => {
  const span = Math.max(max - min, 1);
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
};

export const ChartsAndComparator: React.FC<{ readings: IndicatorStates }> = ({ readings }) => {
  const selic = readings.selic.status === 'ok' ? readings.selic.data : null;
  const ipca = readings.ipca.status === 'ok' ? readings.ipca.data : null;
  const [initial, setInitial] = useState(1000);
  const [nominal, setNominal] = useState(10.5);
  const [inflation, setInflation] = useState(4.5);
  const [years, setYears] = useState(10);

  const realRate = ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100;

  const series = useMemo(
    () =>
      Array.from({ length: years + 1 }, (_, y) => ({
        year: y,
        nominal: initial * Math.pow(1 + nominal / 100, y),
        cost: initial * Math.pow(1 + inflation / 100, y),
        real: initial * Math.pow(1 + realRate / 100, y),
      })),
    [initial, nominal, inflation, realRate, years]
  );

  const last = series[series.length - 1];
  const { ref, width } = useWidth(760);
  const compact = width < 560;
  const height = compact ? 240 : 320;
  const pad = { l: 76, r: 16, t: 16, b: 34 };
  const plotW = width - pad.l - pad.r;
  const plotH = height - pad.t - pad.b;

  const all = series.flatMap((p) => [p.nominal, p.cost]);
  const yMin = Math.min(...all) * 0.96;
  const yMax = Math.max(...all) * 1.02;
  const x = (i: number) => pad.l + (i / Math.max(series.length - 1, 1)) * plotW;
  const y = (v: number) => pad.t + plotH - ((v - yMin) / Math.max(yMax - yMin, 1)) * plotH;
  const line = (key: 'nominal' | 'cost') =>
    series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ');
  // Faixa entre o saldo e o custo de vida: o ganho (ou a perda) real, em reais do futuro.
  const gap = `${line('nominal')} ${series
    .map((p, i) => `L${x(i).toFixed(1)} ${y(p.cost).toFixed(1)}`)
    .reverse()
    .join(' ')} Z`;

  const xEvery = years <= 10 && !compact ? 1 : 5;
  const yTicks = niceTicks(yMin, yMax, compact ? 3 : 4);

  const verdict =
    realRate > 0.005
      ? 'Seu dinheiro cresce acima da inflação.'
      : realRate < -0.005
        ? 'A inflação corrói o rendimento.'
        : 'O rendimento apenas empata com a inflação.';

  return (
    <section id="juro-real" className="band" aria-labelledby="juro-real-title">
      <div className="wrap">
        <SectionHead
          id="juro-real-title"
          title="Juro real: o que sobra depois da inflação"
          icon={Percent}
          summary="juro real é quanto o seu dinheiro rende além da alta dos preços. Se for negativo, você ficou mais pobre, mesmo com o saldo maior."
        >
          Um investimento que rende 10% ao ano não deixa você 10% mais rico se os preços
          também sobem. Compare o saldo do extrato com o que ele compra de verdade.
        </SectionHead>

        <div className="comparator">
          <form className="comparator-controls" onSubmit={(e) => e.preventDefault()}>
            {selic && ipca && (
              <button
                type="button"
                className="button button-small use-official"
                onClick={() => {
                  setNominal(Math.round(selic.latest * 100) / 100);
                  setInflation(Math.round(ipca.latest * 100) / 100);
                }}
              >
                <RefreshCw aria-hidden="true" size={16} /> Usar a Selic ({pct(selic.latest, 2, false)}) e
                o IPCA ({pct(ipca.latest, 2, false)}) atuais
              </button>
            )}
            <MoneyField
              id="real-initial"
              label="Valor aplicado"
              value={initial}
              onChange={(v) => setInitial(Math.max(0, v))}
              step={100}
            />
            <RangeField
              id="real-nominal"
              label="Rendimento ao ano"
              unit="%"
              value={nominal}
              onChange={setNominal}
              min={0}
              max={25}
              step={0.25}
              inputMin={-20}
              inputMax={100}
            />
            <RangeField
              id="real-inflation"
              label="Inflação ao ano"
              unit="%"
              value={inflation}
              onChange={setInflation}
              min={0}
              max={20}
              step={0.25}
              inputMin={-10}
              inputMax={100}
            />
            <fieldset className="field">
              <legend>Prazo em anos</legend>
              <div className="segmented">
                {HORIZONS.map((h) => (
                  <button key={h} type="button" aria-pressed={years === h} onClick={() => setYears(h)}>
                    {h}
                  </button>
                ))}
              </div>
            </fieldset>

            <output className="result" aria-live="polite">
              <span>Juro real ao ano</span>
              <strong className="figure">{pct(realRate, 2)}</strong>
              <small>{verdict}</small>
            </output>
          </form>

          <figure className="chart">
            <ul className="chart-legend" aria-label="Valores no fim do prazo">
              <li className="is-nominal">
                <span>Saldo no extrato</span>
                <strong>{brl(last.nominal, 0)}</strong>
              </li>
              <li className="is-cost">
                <span>Necessário só para acompanhar a inflação</span>
                <strong>{brl(last.cost, 0)}</strong>
              </li>
              <li className="is-real">
                <span>Poder de compra ganho, em dinheiro de hoje</span>
                <strong>{brl(last.real - initial, 0)}</strong>
              </li>
            </ul>

            <div ref={ref} className="chart-canvas">
              <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`Em ${years} anos, ${brl(initial, 0)} viram ${brl(last.nominal, 0)} no extrato, enquanto acompanhar a inflação exigiria ${brl(last.cost, 0)}.`}
              >
                {yTicks.map((v) => (
                  <g key={v}>
                    <line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} className="chart-grid" />
                    <text x={pad.l - 8} y={y(v)} className="chart-tick" textAnchor="end" dominantBaseline="middle">
                      {brl(v, 0)}
                    </text>
                  </g>
                ))}
                {series.map((p, i) =>
                  p.year % xEvery === 0 || i === series.length - 1 ? (
                    <text
                      key={p.year}
                      x={x(i)}
                      y={height - 10}
                      className="chart-tick"
                      textAnchor={i === 0 ? 'start' : 'middle'}
                    >
                      {p.year === 0 ? 'Hoje' : p.year}
                    </text>
                  ) : null
                )}
                <line
                  x1={pad.l}
                  x2={width - pad.r}
                  y1={pad.t + plotH}
                  y2={pad.t + plotH}
                  className="chart-axis"
                />
                <path
                  d={gap}
                  className={`chart-gap ${last.nominal >= last.cost ? 'is-gain' : 'is-loss'}`}
                />
                <path d={line('cost')} className="chart-line is-cost" />
                <path d={line('nominal')} className="chart-line is-nominal" />
                <circle cx={x(series.length - 1)} cy={y(last.nominal)} r={4} className="chart-dot is-nominal" />
              </svg>
            </div>
            <figcaption>
              Juro real calculado pela equação de Fisher: (1 + rendimento) ÷ (1 + inflação) − 1.
              Simulação educativa com taxas constantes, sem impostos nem taxas de administração.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};
