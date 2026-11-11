import React, { useMemo, useState } from 'react';
import { Calculator, Equal, Plus, Receipt, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react';
import { Term } from '../ui/Term';
import { brl, pct, toNumber } from '../../lib/format';
import { MoneyField, RangeField, SectionHead } from '../ui/RangeField';

interface BasketItem {
  id: string;
  name: string;
  before: number;
  now: number;
}

type PresetId = 'feira' | 'casa' | 'transporte';

const PRESETS: Record<PresetId, { label: string; items: BasketItem[] }> = {
  feira: {
    label: 'Feira',
    items: [
      { id: '1', name: 'Arroz (5 kg)', before: 24.9, now: 27.5 },
      { id: '2', name: 'Feijão (1 kg)', before: 7.8, now: 8.6 },
      { id: '3', name: 'Leite (1 L)', before: 4.5, now: 5.2 },
      { id: '4', name: 'Café (500 g)', before: 16.5, now: 19.8 },
    ],
  },
  casa: {
    label: 'Contas da casa',
    items: [
      { id: '1', name: 'Conta de luz', before: 185.0, now: 204.0 },
      { id: '2', name: 'Gás de cozinha (13 kg)', before: 102.0, now: 110.0 },
      { id: '3', name: 'Internet residencial', before: 99.9, now: 109.9 },
    ],
  },
  transporte: {
    label: 'Transporte',
    items: [
      { id: '1', name: 'Gasolina (40 L)', before: 232.0, now: 251.6 },
      { id: '2', name: 'Transporte público (mês)', before: 220.0, now: 240.0 },
      { id: '3', name: 'Manutenção preventiva', before: 150.0, now: 168.0 },
    ],
  },
};

type Scenario = 'up' | 'flat' | 'down';

const SCENARIOS: Record<
  Scenario,
  { label: string; icon: React.ReactNode; summary: string; effects: Array<[string, string]> }
> = {
  up: {
    label: 'Selic sobe',
    icon: <TrendingUp aria-hidden="true" size={16} />,
    summary:
      'O crédito tende a ficar mais caro e famílias e empresas adiam compras a prazo. Com o tempo, isso ajuda a desacelerar a inflação, e a renda fixa pós-fixada passa a render mais.',
    effects: [
      ['Financiamentos e parcelamentos', 'Ficam mais caros'],
      ['Aplicações atreladas ao CDI ou à Selic', 'Rendem mais'],
      ['Consumo e atividade no curto prazo', 'Tendem a desacelerar'],
    ],
  },
  flat: {
    label: 'Fica estável',
    icon: <Equal aria-hidden="true" size={16} />,
    summary:
      'O Banco Central mantém a taxa quando avalia que o nível atual de juros já leva a inflação para a meta, ou quando espera novos dados de atividade e preços.',
    effects: [
      ['Custo do crédito bancário', 'Mais previsível'],
      ['Planejamento de famílias e empresas', 'Referência estável'],
      ['Expectativas de inflação', 'Seguem em observação pelo Copom'],
    ],
  },
  down: {
    label: 'Selic cai',
    icon: <TrendingDown aria-hidden="true" size={16} />,
    summary:
      'O dinheiro fica mais barato para os bancos, o que estimula renegociação de dívidas, novos financiamentos e investimentos produtivos.',
    effects: [
      ['Empréstimos e capital de giro', 'Barateiam aos poucos'],
      ['Investimentos e consumo', 'Ganham estímulo'],
      ['Renda fixa pós-fixada', 'Rende menos'],
    ],
  },
};

export const EconomiaNoBolso: React.FC = () => {
  const [items, setItems] = useState<BasketItem[]>(PRESETS.feira.items);
  const [scenario, setScenario] = useState<Scenario>('up');

  const [expense, setExpense] = useState(800);
  const [expenseInflation, setExpenseInflation] = useState(5.5);

  const [loanValue, setLoanValue] = useState(2500);
  const [loanRate, setLoanRate] = useState(2.0);
  const [loanMonths, setLoanMonths] = useState(12);

  const basket = useMemo(() => {
    const before = items.reduce((acc, it) => acc + (it.before || 0), 0);
    const now = items.reduce((acc, it) => acc + (it.now || 0), 0);
    return { before, now, change: before > 0 ? ((now - before) / before) * 100 : 0 };
  }, [items]);

  const expenseAfter = expense * (1 + expenseInflation / 100);

  const loan = useMemo(() => {
    const principal = Math.max(0, loanValue);
    const n = Math.max(1, Math.round(loanMonths));
    const i = loanRate / 100;
    const installment =
      i > 0 ? (principal * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) : principal / n;
    const total = installment * n;
    const principalShare = total > 0 ? (principal / total) * 100 : 100;
    return { installment, total, interest: total - principal, principalShare };
  }, [loanValue, loanRate, loanMonths]);

  const updateItem = (id: string, patch: Partial<BasketItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: `Item ${prev.length + 1}`, before: 10, now: 11 },
    ]);

  const removeItem = (id: string) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));

  const current = SCENARIOS[scenario];

  return (
    <section id="no-bolso" className="band band-raised" aria-labelledby="no-bolso-title">
      <div className="wrap">
        <SectionHead
          id="no-bolso-title"
          title="Economia no seu bolso"
          icon={Wallet}
          summary="a inflação que pesa para você depende do que você compra, e os juros decidem quanto custa parcelar."
        >
          Use os seus próprios preços. Os valores que aparecem já preenchidos são exemplos e
          podem ser trocados.
        </SectionHead>

        <div className="basket">
          <div className="basket-intro">
            <h3>Quanto subiu a sua cesta?</h3>
            <p>
              Anote quanto você pagava antes e quanto paga agora pelos itens que mais pesam na
              sua casa. Para uma comparação justa, use as mesmas quantidades e marcas.
            </p>
            <p>
              O resultado é a variação dos seus itens, não o <Term entry="IPCA">IPCA</Term>{' '}
              oficial do IBGE. É por isso que a sua inflação pode ser maior ou menor que a do
              noticiário.
            </p>
            <div className="presets" role="group" aria-label="Começar com um exemplo">
              <span>Começar com:</span>
              {(Object.keys(PRESETS) as PresetId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="chip"
                  onClick={() => setItems(PRESETS[id].items)}
                >
                  {PRESETS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="receipt-wrap">
          <div className="receipt">
            <p className="receipt-title">
              <Receipt aria-hidden="true" size={18} /> Sua cesta
            </p>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Antes</th>
                  <th scope="col">Agora</th>
                  <th scope="col">Variação</th>
                  <th scope="col">
                    <span className="sr-only">Remover</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const change = item.before > 0 ? ((item.now - item.before) / item.before) * 100 : 0;
                  return (
                    <tr key={item.id}>
                      <th scope="row">
                        <input
                          type="text"
                          name={`item-${item.id}-nome`}
                          autoComplete="off"
                          maxLength={40}
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          aria-label="Nome do item"
                        />
                      </th>
                      <td>
                        <input
                          type="number"
                          inputMode="decimal"
                          autoComplete="off"
                          min={0}
                          step={0.1}
                          value={item.before}
                          onChange={(e) => updateItem(item.id, { before: toNumber(e.target.value) })}
                          aria-label={`Preço anterior de ${item.name}, em reais`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          inputMode="decimal"
                          autoComplete="off"
                          min={0}
                          step={0.1}
                          value={item.now}
                          onChange={(e) => updateItem(item.id, { now: toNumber(e.target.value) })}
                          aria-label={`Preço atual de ${item.name}, em reais`}
                        />
                      </td>
                      <td className={change > 0 ? 'is-up' : change < 0 ? 'is-down' : ''}>
                        {pct(change)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-button icon-button-small"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length <= 1}
                          aria-label={`Remover ${item.name}`}
                        >
                          <X aria-hidden="true" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <button type="button" className="link-button add-row" onClick={addItem}>
              <Plus aria-hidden="true" size={16} /> Adicionar item
            </button>

            <dl className="receipt-totals" aria-live="polite">
              <div>
                <dt>Total antes</dt>
                <dd>{brl(basket.before)}</dd>
              </div>
              <div>
                <dt>Total agora</dt>
                <dd>{brl(basket.now)}</dd>
              </div>
              <div className="receipt-result">
                <dt>{basket.change >= 0 ? 'Sua cesta subiu' : 'Sua cesta caiu'}</dt>
                <dd className="figure">{pct(basket.change, 2)}</dd>
              </div>
            </dl>
          </div>
          </div>
        </div>

        <div className="selic">
          <div className="selic-text">
            <h3>A Selic não é a taxa do seu empréstimo</h3>
            <p>
              A Selic é a taxa básica definida pelo Copom, no Banco Central. Ela serve de
              referência para toda a economia, mas os bancos somam a ela o{' '}
              <Term entry="Spread">spread bancário</Term>: risco de calote, impostos, custos de operação e
              margem de lucro. Por isso o juro do cartão é muito maior que a Selic.
            </p>
          </div>

          <div className="selic-scenarios">
            <div className="segmented" role="group" aria-label="O que acontece quando a Selic">
              {(Object.keys(SCENARIOS) as Scenario[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={scenario === id}
                  onClick={() => setScenario(id)}
                >
                  {SCENARIOS[id].icon}
                  {SCENARIOS[id].label}
                </button>
              ))}
            </div>
            <div aria-live="polite">
              <p>{current.summary}</p>
              <dl className="effects">
                {current.effects.map(([label, state]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{state}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="calculators">
          <form className="calculator" onSubmit={(e) => e.preventDefault()}>
            <h3>
              <Calculator aria-hidden="true" size={20} /> Quanto vai custar a sua despesa?
            </h3>
            <p>Informe um gasto mensal e um aumento de preços hipotético.</p>
            <MoneyField id="expense" label="Gasto mensal hoje" value={expense} onChange={setExpense} />
            <RangeField
              id="expense-inflation"
              label="Aumento de preços"
              unit="%"
              value={expenseInflation}
              onChange={setExpenseInflation}
              min={-10}
              max={30}
              step={0.5}
              inputMin={-50}
              inputMax={200}
            />
            <output className="result" htmlFor="expense expense-inflation" aria-live="polite">
              <span>Novo gasto mensal</span>
              <strong className="figure">{brl(expenseAfter)}</strong>
              <small>
                {expenseAfter >= expense ? 'A mais' : 'A menos'} por mês:{' '}
                {brl(Math.abs(expenseAfter - expense))}
              </small>
            </output>
          </form>

          <form className="calculator" onSubmit={(e) => e.preventDefault()}>
            <h3>
              <Calculator aria-hidden="true" size={20} /> Quanto os juros pesam na parcela?
            </h3>
            <p>
              Parcela fixa pela Tabela Price. A taxa aqui é a do financiamento, não a Selic.
            </p>
            <MoneyField
              id="loan-value"
              label="Valor financiado"
              value={loanValue}
              onChange={setLoanValue}
              min={100}
              step={100}
            />
            <RangeField
              id="loan-rate"
              label="Juros ao mês"
              unit="%"
              value={loanRate}
              onChange={setLoanRate}
              min={0}
              max={12}
              step={0.1}
              inputMax={50}
            />
            <RangeField
              id="loan-months"
              label="Prazo em meses"
              value={loanMonths}
              onChange={setLoanMonths}
              min={1}
              max={72}
              step={1}
              inputMax={360}
            />
            <output className="result" htmlFor="loan-value loan-rate loan-months" aria-live="polite">
              <span>Parcela mensal</span>
              <strong className="figure">{brl(loan.installment)}</strong>
              <small>
                Você paga {brl(loan.total)} no total, dos quais {brl(loan.interest)} são juros.
              </small>
              <span className="split" aria-hidden="true">
                <span style={{ width: `${loan.principalShare.toFixed(1)}%` }} />
              </span>
              <span className="split-legend" aria-hidden="true">
                <span>Valor emprestado</span>
                <span>Juros</span>
              </span>
            </output>
          </form>
        </div>
      </div>
    </section>
  );
};
