import React from 'react';
import { CandlestickChart, Clock, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import {
  CURRENCIES,
  CURRENCY_NAMES,
  MarketState,
  StockQuote,
  formatCurrencyBid,
  formatQuoteTime,
} from '../../lib/marketData';
import { brl, pct } from '../../lib/format';
import { Sparkline } from '../ui/IndicatorValue';
import { SectionHead } from '../ui/RangeField';
import { Term } from '../ui/Term';
import { Skeleton } from '../ui/Skeleton';
import { stockHref } from '../../lib/brapi';

const direction = (v: number) => (Math.abs(v) < 0.005 ? 'flat' : v > 0 ? 'up' : 'down');

const Trend: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const dir = direction(value);
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  return (
    <span className="reading-trend">
      <Icon aria-hidden="true" size={15} />
      <span className="sr-only">{label}: </span>
      {pct(value, 2)}
    </span>
  );
};

/** Faixa entre a mínima e a máxima do dia, com o preço atual marcado. */
const DayRange: React.FC<{ low: number; high: number; current: number; format: (v: number) => string }> = ({
  low,
  high,
  current,
  format,
}) => {
  const span = high - low;
  const pos = span > 0 ? Math.min(100, Math.max(0, ((current - low) / span) * 100)) : 50;
  return (
    <span className="day-range">
      <span className="day-range-bar" aria-hidden="true">
        <span style={{ left: `${pos}%` }} />
      </span>
      <span className="day-range-labels">
        <span>
          <span className="sr-only">Mínima do dia: </span>
          {format(low)}
        </span>
        <span>
          <span className="sr-only">Máxima do dia: </span>
          {format(high)}
        </span>
      </span>
    </span>
  );
};

const StockRow: React.FC<{ stock: StockQuote }> = ({ stock }) => (
  <tr>
    <th scope="row">
      <a className="register-name stock-link" href={stockHref(stock.symbol)} translate="no">
        {stock.symbol}
        <span className="sr-only">: abrir gráficos</span>
      </a>
      <span className="register-sub">{stock.name}</span>
    </th>
    <td data-label="Preço">
      <strong className="stock-price">{brl(stock.price)}</strong>
    </td>
    <td data-label="No dia">
      <span className="stock-change">
        <Trend value={stock.changePercent} label="Variação no dia" />
        <small>
          {stock.change >= 0 ? '+' : '−'}
          {brl(Math.abs(stock.change))} sobre {brl(stock.previousClose)}
        </small>
      </span>
    </td>
    <td data-label="Mínima e máxima" className="stock-range">
      <DayRange low={stock.dayLow} high={stock.dayHigh} current={stock.price} format={(v) => brl(v)} />
    </td>
    <td data-label="Horário">
      <small>{formatQuoteTime(stock.time)}</small>
    </td>
  </tr>
);

export const MarketsSection: React.FC<{ market: MarketState }> = ({ market }) => (
  <section id="mercados" className="band" aria-labelledby="mercados-title">
    <div className="wrap">
      <SectionHead
        id="mercados-title"
        title="Moedas e bolsa"
        icon={CandlestickChart}
        summary="o preço de uma moeda ou de uma ação muda o dia todo, conforme mais gente quer comprar ou vender."
      >
        Quanto custam o dólar, o euro, a libra e o bitcoin em reais, e como ler o preço de uma
        ação na bolsa brasileira.
      </SectionHead>

      <h3 className="sub-head">Quanto custa uma moeda estrangeira</h3>
      <ul className="currency-grid">
        {CURRENCIES.map((code) => {
          const state = market.currencies[code];
          const names = CURRENCY_NAMES[code];
          return (
            <li key={code} className="currency-card">
              <p className="currency-name">
                <span translate="no">{code}</span> {names.long}
              </p>
              {state.status === 'loading' && (
                <span className="reading is-loading" aria-busy="true">
                  <span className="reading-skeleton" aria-hidden="true" />
                  <span className="sr-only">Carregando {names.long}…</span>
                </span>
              )}
              {state.status === 'error' && (
                <span className="reading is-error">
                  <strong>Indisponível</strong>
                  <small>A fonte não respondeu agora. Tente recarregar mais tarde.</small>
                </span>
              )}
              {state.status === 'ok' && (
                <>
                  <p className="currency-value">
                    {formatCurrencyBid(code, state.data.bid)}
                    <Trend value={state.data.changePercent} label="Variação no dia" />
                  </p>
                  <Sparkline
                    points={state.data.history}
                    label={`${names.long} nos últimos ${state.data.history.length} dias`}
                  />
                  <DayRange
                    low={state.data.low}
                    high={state.data.high}
                    current={state.data.bid}
                    format={(v) => formatCurrencyBid(code, v)}
                  />
                  <p className="reading-period">
                    <Clock aria-hidden="true" size={13} /> {formatQuoteTime(state.data.time)}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="source-note">
        O <strong>dólar comercial</strong> é o usado entre bancos e empresas. O dólar de turismo,
        que você compra para viajar, costuma sair mais caro. Já o{' '}
        <Term entry="Câmbio PTAX">PTAX</Term>, mostrado nos indicadores, é a média oficial do Banco
        Central. Cotações da AwesomeAPI; o mini gráfico mostra os últimos 15 dias.
      </p>

      <div className="stocks">
        <div className="stocks-intro">
          <h3 className="sub-head">Como ler o preço de uma ação</h3>
          <p>
            Uma ação é um pedacinho de uma empresa. Quem compra passa a ser sócio e pode ganhar
            com a valorização e com a parte do lucro que a empresa distribui.
          </p>
          <dl className="glossary-mini">
            <div>
              <dt>Código</dt>
              <dd>
                O apelido da ação na bolsa. O número final indica o tipo: 3 é ação ordinária (dá
                direito a voto), 4 é preferencial (tem preferência nos dividendos).
              </dd>
            </div>
            <div>
              <dt>No dia</dt>
              <dd>Quanto o preço mudou em relação ao fechamento do pregão anterior.</dd>
            </div>
            <div>
              <dt>Mínima e máxima</dt>
              <dd>O menor e o maior preço negociado hoje. A marca mostra onde o preço está agora.</dd>
            </div>
          </dl>
        </div>

        <div className="stocks-table">
          {market.stocks.status === 'loading' && (
            <div className="stocks-skeleton" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="stocks-skeleton-row" key={i} aria-hidden="true">
                  <span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Skeleton width={28} height={28} />
                    <Skeleton width="4rem" height="0.9rem" />
                  </span>
                  <Skeleton width="5rem" height="0.9rem" />
                  <Skeleton width="3.5rem" height="0.9rem" />
                  <Skeleton width="100%" height="0.5rem" radius="999px" />
                  <Skeleton width="3rem" height="0.8rem" />
                </div>
              ))}
              <span className="sr-only">Carregando as cotações…</span>
            </div>
          )}
          {market.stocks.status === 'error' && (
            <p className="empty-state">
              As cotações das ações não responderam agora. Tente recarregar a página em alguns
              minutos.
            </p>
          )}
          {market.stocks.status === 'ok' && (
            <table className="register register-stocks">
              <thead>
                <tr>
                  <th scope="col">Ação</th>
                  <th scope="col">Preço</th>
                  <th scope="col">No dia</th>
                  <th scope="col">Mínima e máxima</th>
                  <th scope="col">Horário</th>
                </tr>
              </thead>
              <tbody>
                {market.stocks.data.map((s) => (
                  <StockRow key={s.symbol} stock={s} />
                ))}
              </tbody>
            </table>
          )}
          <p className="source-note">
            Toque no código de uma ação, aqui ou na faixa da B3 no topo, para abrir a página com
            gráficos e explicações. São exemplos para aprender a ler a cotação, não recomendação
            de investimento. Os preços vêm da brapi, com atraso de até 30 minutos em relação ao
            pregão.
          </p>
        </div>
      </div>
    </div>
  </section>
);
