import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  ExternalLink,
  FileText,
  GraduationCap,
  Info,
  Landmark,
  Minus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { HistoryPoint, RANGES, RangeId, StockDetail, useStockDetail } from '../../lib/brapi';
import { brl, pct } from '../../lib/format';
import { formatQuoteTime } from '../../lib/marketData';
import { OneSentence } from '../ui/RangeField';
import { MarketLoader, Skeleton, SkeletonText } from '../ui/Skeleton';

const dateShort = (ms: number) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(ms));
const dateLong = (ms: number) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(ms));
const compact = (v: number) =>
  v.toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** Acompanha a largura do contêiner para o texto do gráfico manter o tamanho real. */
const useWidth = (fallback: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(1, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
};

const niceTicks = (min: number, max: number, count: number) => {
  const span = Math.max(max - min, 1e-9);
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) ticks.push(v);
  return ticks;
};

const PriceChart: React.FC<{ history: HistoryPoint[]; isIndex: boolean; symbol: string }> = ({
  history,
  isIndex,
  symbol,
}) => {
  const { ref, width } = useWidth(760);
  const [active, setActive] = useState<number | null>(null);
  const compactLayout = width < 560;
  const priceH = compactLayout ? 220 : 300;
  const volH = 70;
  const gap = 18;
  const pad = { l: compactLayout ? 64 : 76, r: 12, t: 12, b: 28 };
  const plotW = width - pad.l - pad.r;
  const height = pad.t + priceH + gap + volH + pad.b;

  const fmt = (v: number) =>
    isIndex ? v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : brl(v);

  const closes = history.map((h) => h.close);
  const lows = history.map((h) => h.low);
  const highs = history.map((h) => h.high);
  const yMin = Math.min(...lows, ...closes);
  const yMax = Math.max(...highs, ...closes);
  const pad5 = (yMax - yMin) * 0.06 || yMax * 0.01;
  const lo = yMin - pad5;
  const hi = yMax + pad5;
  const maxVol = Math.max(...history.map((h) => h.volume), 1);

  const x = (i: number) => pad.l + (history.length > 1 ? (i / (history.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => pad.t + priceH - ((v - lo) / (hi - lo)) * priceH;
  const volTop = pad.t + priceH + gap;
  const barW = Math.max(1.5, Math.min(14, (plotW / history.length) * 0.65));

  const line = history.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(h.close).toFixed(1)}`).join(' ');
  const area = `${line} L${x(history.length - 1).toFixed(1)} ${pad.t + priceH} L${x(0).toFixed(1)} ${pad.t + priceH} Z`;
  const first = history[0];
  const last = history[history.length - 1];
  const up = last.close >= first.close;
  const xEvery = Math.max(1, Math.ceil(history.length / (compactLayout ? 4 : 7)));

  const pick = (clientX: number, rect: DOMRect) => {
    const rel = ((clientX - rect.left) / rect.width) * width;
    const i = Math.round(((rel - pad.l) / plotW) * (history.length - 1));
    setActive(Math.min(history.length - 1, Math.max(0, i)));
  };

  const shown = active ?? history.length - 1;
  const point = history[shown];
  const prev = shown > 0 ? history[shown - 1] : null;

  return (
    <figure className="stock-chart">
      <div className="stock-chart-readout" aria-live="polite">
        <strong>{fmt(point.close)}</strong>
        <span>
          Fechamento de {dateLong(point.date)}
          {prev && (
            <>
              {' '}
              ({pct(((point.close - prev.close) / prev.close) * 100, 2)} sobre o dia anterior)
            </>
          )}
        </span>
        <span className="stock-chart-ohlc">
          Abertura {fmt(point.open)}, mínima {fmt(point.low)}, máxima {fmt(point.high)}, volume{' '}
          {compact(point.volume)}
        </span>
      </div>

      <div ref={ref} className="chart-canvas">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          tabIndex={0}
          aria-label={`Gráfico de ${symbol}: de ${fmt(first.close)} em ${dateLong(first.date)} para ${fmt(last.close)} em ${dateLong(last.date)}. Use as setas para percorrer os dias.`}
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              const base = active ?? history.length - 1;
              setActive(Math.min(history.length - 1, Math.max(0, base + (e.key === 'ArrowRight' ? 1 : -1))));
            } else if (e.key === 'Escape') setActive(null);
          }}
          onBlur={() => setActive(null)}
        >
          {niceTicks(lo, hi, compactLayout ? 3 : 5).map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} className="chart-grid" />
              <text x={pad.l - 8} y={y(v)} className="chart-tick" textAnchor="end" dominantBaseline="middle">
                {fmt(v)}
              </text>
            </g>
          ))}
          <path d={area} className={`stock-area ${up ? 'is-up' : 'is-down'}`} />
          <path d={line} className="stock-line" />

          {history.map((h, i) => {
            const vh = (h.volume / maxVol) * volH;
            return (
              <rect
                key={h.date}
                x={x(i) - barW / 2}
                y={volTop + volH - vh}
                width={barW}
                height={Math.max(1, vh)}
                rx={1}
                className={`stock-vol ${i === shown ? 'is-active' : ''}`}
              />
            );
          })}
          <text x={pad.l - 8} y={volTop + 10} className="chart-tick" textAnchor="end">
            Volume
          </text>

          {history.map((h, i) =>
            i % xEvery === 0 || i === history.length - 1 ? (
              <text
                key={h.date}
                x={x(i)}
                y={height - 8}
                className="chart-tick"
                textAnchor={i === history.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}
              >
                {dateShort(h.date)}
              </text>
            ) : null
          )}

          <line
            x1={x(shown)}
            x2={x(shown)}
            y1={pad.t}
            y2={volTop + volH}
            className={`stock-cursor ${active === null ? 'is-idle' : ''}`}
          />
          <circle cx={x(shown)} cy={y(point.close)} r={4.5} className="stock-dot" />
        </svg>
      </div>

      <figcaption>
        Linha: preço de fechamento de cada pregão. Barras: volume, a quantidade de ações negociadas
        no dia. Passe o dedo ou o mouse sobre o gráfico, ou use as setas do teclado, para ver cada
        dia.
      </figcaption>

      <details className="data-table">
        <summary>Ver os dados em tabela</summary>
        <div className="data-table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Abertura</th>
                <th scope="col">Mínima</th>
                <th scope="col">Máxima</th>
                <th scope="col">Fechamento</th>
                <th scope="col">Volume</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h) => (
                <tr key={h.date}>
                  <th scope="row">{dateShort(h.date)}</th>
                  <td>{fmt(h.open)}</td>
                  <td>{fmt(h.low)}</td>
                  <td>{fmt(h.high)}</td>
                  <td>{fmt(h.close)}</td>
                  <td>{compact(h.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
};

const Stat: React.FC<{ label: string; value: string; help: string }> = ({ label, value, help }) => (
  <div className="stat">
    <dt>{label}</dt>
    <dd className="stat-value">{value}</dd>
    <dd className="stat-help">{help}</dd>
  </div>
);

const sourcesFor = (d: StockDetail, isIndex: boolean) => {
  const list: Array<{ href: string; title: string; text: string; icon: typeof Landmark }> = [];
  if (d.profile.website && /^https:\/\//.test(d.profile.website)) {
    list.push({
      href: d.profile.website,
      title: 'Site oficial da empresa',
      text: 'Procure a área de Relações com Investidores (RI): ali ficam os resultados de cada trimestre, explicados pela própria empresa.',
      icon: Building2,
    });
  }
  if (isIndex) {
    list.push({
      href: 'https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa.htm',
      title: 'Ibovespa na B3',
      text: 'Metodologia oficial do índice e a carteira de ações que o compõem.',
      icon: Landmark,
    });
  } else {
    list.push(
      {
        href: 'https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm',
        title: 'Empresas listadas na B3',
        text: 'Busque pelo código para ver dados cadastrais, eventos e proventos oficiais da empresa.',
        icon: Landmark,
      },
      {
        href: 'https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx',
        title: 'Documentos na CVM',
        text: 'Balanços, fatos relevantes e comunicados entregues ao regulador. É a fonte primária das notícias sobre a empresa.',
        icon: FileText,
      }
    );
  }
  list.push(
    {
      href: 'https://www.gov.br/investidor/pt-br',
      title: 'Portal do Investidor (CVM)',
      text: 'Guias gratuitos do governo para entender riscos, taxas e como não cair em golpes.',
      icon: BookOpen,
    },
    {
      href: 'https://edu.b3.com.br/',
      title: 'B3 Educação',
      text: 'Cursos gratuitos da própria bolsa, do básico sobre ações até análise de empresas.',
      icon: GraduationCap,
    }
  );
  return list;
};

export const StockPage: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [range, setRange] = useState<RangeId>('1mo');
  const detail = useStockDetail(symbol, range);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isIndex = symbol.startsWith('^');

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [symbol]);

  // Ao trocar o período, mantém os dados anteriores na tela até chegarem os novos.
  const lastRef = useRef<{ symbol: string; data: StockDetail } | null>(null);
  if (detail.status === 'ok') lastRef.current = { symbol, data: detail.data };
  const stale = detail.status === 'loading' && lastRef.current?.symbol === symbol ? lastRef.current.data : null;
  const d = detail.status === 'ok' ? detail.data : stale;
  const firstLoad = detail.status === 'loading' && !d;
  const reloading = detail.status === 'loading' && Boolean(d);
  const fmt = (v: number) => (isIndex ? v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : brl(v));
  const periodChange = useMemo(() => {
    if (!d || d.history.length < 2) return null;
    const a = d.history[0].close;
    const b = d.history[d.history.length - 1].close;
    return ((b - a) / a) * 100;
  }, [d]);
  const dir = d ? (Math.abs(d.changePercent) < 0.005 ? 'flat' : d.changePercent > 0 ? 'up' : 'down') : 'flat';
  const TrendIcon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;

  return (
    <main id="main" tabIndex={-1} className="stock-page">
      <div className="wrap">
        <nav className="breadcrumb" aria-label="Você está em">
          <a href="#mercados">
            <ArrowLeft aria-hidden="true" size={16} /> Moedas e bolsa
          </a>
          <span aria-hidden="true">/</span>
          <span aria-current="page" translate="no">
            {isIndex ? 'Ibovespa' : symbol}
          </span>
        </nav>

        <header className="stock-head">
          <div className="stock-title">
            {d?.logo && <img src={d.logo} alt="" width={56} height={56} />}
            <div>
              <h1 ref={headingRef} tabIndex={-1} translate="no">
                {isIndex ? 'Ibovespa' : symbol}
              </h1>
              {isIndex || d ? (
                <p>{isIndex ? 'Principal índice de ações da bolsa brasileira' : d?.name}</p>
              ) : firstLoad ? (
                <Skeleton width="14rem" height="1rem" style={{ marginTop: '0.55rem' }} />
              ) : null}
              {d?.profile.sector && (
                <p className="stock-sector">
                  {d.profile.sector}
                  {d.profile.industry && d.profile.industry !== d.profile.sector ? `, ${d.profile.industry}` : ''}
                </p>
              )}
            </div>
          </div>
          {firstLoad && (
            <div className="stock-quote" aria-hidden="true">
              <Skeleton width="10rem" height="2.75rem" radius="var(--raio)" />
              <Skeleton width="13rem" height="0.95rem" />
              <Skeleton width="16rem" height="0.75rem" />
            </div>
          )}
          {d && (
            <div className="stock-quote">
              <strong>{fmt(d.price)}</strong>
              <span className="reading-trend">
                <TrendIcon aria-hidden="true" size={16} />
                {d.change >= 0 ? '+' : '−'}
                {isIndex ? Math.abs(d.change).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' pontos' : brl(Math.abs(d.change))}{' '}
                ({pct(d.changePercent, 2)}) no dia
              </span>
              <small>
                Cotação de {formatQuoteTime(d.time)}, com atraso de até 30 minutos. Fonte: brapi.
              </small>
            </div>
          )}
        </header>

        <OneSentence>
          {isIndex
            ? 'o Ibovespa é uma média das ações mais negociadas da B3. Se ele sobe, a maioria dessas ações subiu.'
            : 'o preço de uma ação sobe quando mais gente quer comprar do que vender, e cai no caso contrário. Um dia de queda não diz, sozinho, se a empresa vai bem ou mal.'}
        </OneSentence>

        <section className="stock-section" aria-labelledby="grafico-title">
          <div className="stock-section-head">
            <h2 id="grafico-title">Histórico de preços</h2>
            <div className="segmented" role="group" aria-label="Período do gráfico">
              {RANGES.map((r) => (
                <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => setRange(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {periodChange !== null && d && !reloading && (
            <p className="stock-period-note">
              No período, de {fmt(d.history[0].close)} para {fmt(d.history[d.history.length - 1].close)}:{' '}
              <strong>{pct(periodChange, 2)}</strong>.
            </p>
          )}

          {firstLoad && (
            <div className="stock-chart-skeleton" aria-busy="true">
              <span className="sr-only">Carregando o gráfico…</span>
            </div>
          )}
          {detail.status === 'error' && (
            <p className="empty-state">
              Não foi possível carregar os dados de {symbol} agora. O limite gratuito de consultas
              pode ter sido atingido; tente de novo em alguns minutos.{' '}
              <a href="#mercados">Voltar para Moedas e bolsa</a>
            </p>
          )}
          {d && d.history.length > 1 && (
            <div className={reloading ? 'stock-chart-reloading' : undefined} aria-busy={reloading || undefined}>
              {reloading && <MarketLoader size={56} caption="Buscando o período…" />}
              <PriceChart history={d.history} isIndex={isIndex} symbol={symbol} />
            </div>
          )}
          {d && d.history.length <= 1 && (
            <p className="empty-state">A fonte não enviou histórico para este período. Tente outro período.</p>
          )}
        </section>

        {firstLoad && (
          <section className="stock-section" aria-busy="true" aria-label="Carregando os números do dia">
            <Skeleton width="18rem" height="1.6rem" style={{ marginBottom: '1.25rem' }} />
            <div className="stats-skeleton">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i}>
                  <Skeleton width="45%" height="0.8rem" />
                  <Skeleton width="65%" height="1.5rem" />
                  <SkeletonText lines={2} />
                </span>
              ))}
            </div>
          </section>
        )}

        {d && (
          <section className="stock-section" aria-labelledby="numeros-title">
            <h2 id="numeros-title">Os números do dia, explicados</h2>
            <dl className="stats">
              <Stat label="Abertura" value={fmt(d.open)} help="Preço do primeiro negócio do dia." />
              <Stat
                label="Fechamento anterior"
                value={fmt(d.previousClose)}
                help="Último preço do pregão anterior. É a base da variação do dia."
              />
              <Stat
                label="Mínima e máxima do dia"
                value={`${fmt(d.dayLow)} a ${fmt(d.dayHigh)}`}
                help="Faixa de preços negociados hoje."
              />
              {Number.isFinite(d.low52) && Number.isFinite(d.high52) && (
                <Stat
                  label="Mínima e máxima em 52 semanas"
                  value={`${fmt(d.low52)} a ${fmt(d.high52)}`}
                  help="Faixa de preço do último ano. Ajuda a ver se o preço atual está alto ou baixo para o padrão recente."
                />
              )}
              <Stat
                label="Volume"
                value={compact(d.volume)}
                help={isIndex ? 'Quantidade negociada nas ações do índice.' : 'Quantidade de ações negociadas hoje. Volume alto indica muito interesse no dia.'}
              />
              {d.marketCap !== null && !isIndex && (
                <Stat
                  label="Valor de mercado"
                  value={`R$ ${compact(d.marketCap)}`}
                  help="Preço da ação vezes o total de ações: quanto a bolsa diz que a empresa inteira vale hoje."
                />
              )}
              {d.priceEarnings !== null && Number.isFinite(d.priceEarnings) && !isIndex && (
                <Stat
                  label="Preço sobre lucro (P/L)"
                  value={d.priceEarnings.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                  help="Quantos anos de lucro atual seriam precisos para pagar o preço da ação. Compare só com empresas do mesmo setor."
                />
              )}
            </dl>
          </section>
        )}

        {d?.profile.summary && (
          <section className="stock-section" aria-labelledby="empresa-title">
            <h2 id="empresa-title">Sobre a empresa</h2>
            <p className="stock-about">{d.profile.summary}</p>
            {d.profile.city && (
              <p className="source-note">
                Sede: {d.profile.city}
                {d.profile.state ? ` (${d.profile.state})` : ''}.
              </p>
            )}
          </section>
        )}

        {d && (
          <section className="stock-section" aria-labelledby="fontes-title">
            <h2 id="fontes-title">Onde ler mais sobre {isIndex ? 'o índice' : 'esta empresa'}</h2>
            <p className="lede">
              Para entender os números além do preço do dia, consulte direto as fontes oficiais.
            </p>
            <ul className="sources">
              {sourcesFor(d, isIndex).map(({ href, title, text, icon: Icon }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <Icon aria-hidden="true" size={22} strokeWidth={1.75} />
                    <span>
                      <strong>
                        {title}
                        <ExternalLink aria-hidden="true" size={14} />
                        <span className="sr-only"> (abre em nova aba)</span>
                      </strong>
                      <span>{text}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="stock-disclaimer">
          <Info aria-hidden="true" size={18} /> Conteúdo educativo. Nada nesta página é recomendação
          de compra ou venda. Antes de investir, entenda os riscos e, se precisar, procure um
          profissional certificado.
        </p>
      </div>
    </main>
  );
};
