import React from 'react';
import type { IndicatorId } from '../../lib/officialData';
import { IndicatorStates, formatChange, formatIndicator } from '../../lib/useIndicators';
import {
  CURRENCY_NAMES,
  CurrencyCode,
  MarketState,
  formatCurrencyBid,
} from '../../lib/marketData';
import { pct } from '../../lib/format';

type Item =
  | { kind: 'official'; id: IndicatorId; name: string; href: string }
  | { kind: 'currency'; code: CurrencyCode; href: string };

const ITEMS: Item[] = [
  { kind: 'official', id: 'selic', name: 'Selic', href: '#indicadores' },
  { kind: 'official', id: 'ipca', name: 'IPCA 12 meses', href: '#indicadores' },
  { kind: 'currency', code: 'USD', href: '#mercados' },
  { kind: 'currency', code: 'EUR', href: '#mercados' },
  { kind: 'currency', code: 'GBP', href: '#mercados' },
  { kind: 'currency', code: 'BTC', href: '#mercados' },
  { kind: 'official', id: 'pib', name: 'PIB no trimestre', href: '#indicadores' },
  { kind: 'official', id: 'pnad', name: 'Desemprego', href: '#indicadores' },
  { kind: 'official', id: 'primario', name: 'Resultado primário', href: '#indicadores' },
];

const Arrow: React.FC<{ dir: 'up' | 'down' | 'flat' }> = ({ dir }) => (
  <span aria-hidden="true">{dir === 'up' ? '▲' : dir === 'down' ? '▼' : '='}</span>
);

const Pending: React.FC<{ name: string; failed: boolean; href: string }> = ({ name, failed, href }) => (
  <a href={href} aria-label={`${name}: ${failed ? 'indisponível' : 'carregando'}`}>
    <span className="strip-name">{name}</span>
    <span className={`strip-value ${failed ? '' : 'is-loading'}`}>{failed ? 'indisponível' : ''}</span>
  </a>
);

/** Faixa de cotações sob o menu, como nas seções de economia dos jornais. */
export const IndicatorStrip: React.FC<{ readings: IndicatorStates; market: MarketState }> = ({
  readings,
  market,
}) => (
  <aside className="strip" aria-label="Últimas cotações e indicadores">
    <div className="wrap">
      <ul>
        {ITEMS.map((item) => {
          if (item.kind === 'currency') {
            const state = market.currencies[item.code];
            const name = CURRENCY_NAMES[item.code].short;
            if (state.status !== 'ok') {
              return (
                <li key={item.code}>
                  <Pending name={name} failed={state.status === 'error'} href={item.href} />
                </li>
              );
            }
            const { bid, changePercent } = state.data;
            const dir = Math.abs(changePercent) < 0.005 ? 'flat' : changePercent > 0 ? 'up' : 'down';
            return (
              <li key={item.code}>
                <a href={item.href}>
                  <span className="strip-name">{name}</span>
                  <span className="strip-value">
                    {formatCurrencyBid(item.code, bid).replace(/(,\d{2})\d{2}$/, '$1')}
                  </span>
                  <span className="strip-change">
                    <Arrow dir={dir} /> {pct(changePercent, 2)}
                  </span>
                </a>
              </li>
            );
          }

          const state = readings[item.id];
          if (state.status !== 'ok') {
            return (
              <li key={item.id}>
                <Pending name={item.name} failed={state.status === 'error'} href={item.href} />
              </li>
            );
          }
          const { latest, previous } = state.data;
          const change = previous === null ? null : formatChange(item.id, latest - previous);
          const dir = change === null || change === 'estável' ? 'flat' : latest > (previous ?? 0) ? 'up' : 'down';
          return (
            <li key={item.id}>
              <a href={item.href}>
                <span className="strip-name">{item.name}</span>
                <span className="strip-value">{formatIndicator(item.id, latest)}</span>
                {change && (
                  <span className="strip-change">
                    <Arrow dir={dir} /> {change}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  </aside>
);
