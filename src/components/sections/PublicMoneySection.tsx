import React, { useMemo, useState } from 'react';
import { Coins, HandCoins, Landmark, Scale, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { pct } from '../../lib/format';
import { RangeField, SectionHead } from '../ui/RangeField';

type FlowStep = 'revenue' | 'spending' | 'primary' | 'debt';

const FLOW: Array<{ id: FlowStep; title: string; hint: string; text: string; icon: LucideIcon }> = [
  {
    id: 'revenue',
    icon: Coins,
    title: 'Arrecadação',
    hint: 'Tributos e outras receitas',
    text: 'O Estado obtém recursos com tributos sobre a renda (IRPF, IRPJ), tributos sobre o consumo (ICMS, ISS, PIS/Cofins e, com a reforma, o IVA dual), dividendos de estatais e concessões.',
  },
  {
    id: 'spending',
    icon: Users,
    title: 'Despesas',
    hint: 'Serviços e políticas públicas',
    text: 'O dinheiro paga serviços públicos como saúde, educação e segurança, a previdência social, os programas de transferência de renda e os investimentos em infraestrutura.',
  },
  {
    id: 'primary',
    icon: Scale,
    title: 'Resultado primário',
    hint: 'Receitas menos despesas, sem juros',
    text: 'É a diferença entre o que o governo arrecada e o que gasta, sem contar os juros da dívida. Se sobra dinheiro, há superávit primário. Se falta, há déficit primário.',
  },
  {
    id: 'debt',
    icon: HandCoins,
    title: 'Dívida pública',
    hint: 'Estoque e custo de financiamento',
    text: 'Para cobrir déficits e renovar a dívida que vence, o Tesouro Nacional vende títulos públicos que pagam juros ligados à Selic, ao IPCA ou a taxas prefixadas.',
  },
];

const FLOOR = 0.6;
const CEILING = 2.5;

export const PublicMoneySection: React.FC = () => {
  const [step, setStep] = useState<FlowStep>('revenue');
  const [revenueGrowth, setRevenueGrowth] = useState(3.0);
  const [metTarget, setMetTarget] = useState(true);

  const rule = useMemo(() => {
    const share = metTarget ? 0.7 : 0.5;
    const raw = revenueGrowth * share;
    const limit = Math.min(CEILING, Math.max(FLOOR, raw));
    // Posição do marcador numa régua de 0% a 3%
    const position = Math.min(100, Math.max(0, (limit / 3) * 100));
    return { share: share * 100, raw, limit, position, clamped: raw !== limit };
  }, [revenueGrowth, metTarget]);

  const active = FLOW.find((f) => f.id === step) ?? FLOW[0];

  return (
    <section id="dinheiro-publico" className="band band-raised" aria-labelledby="dinheiro-publico-title">
      <div className="wrap">
        <SectionHead
          id="dinheiro-publico-title"
          title="O caminho do dinheiro público"
          icon={Landmark}
          summary="o governo arrecada impostos, paga serviços e, quando falta dinheiro, pega emprestado. Essa dívida influencia os juros de todo o país."
        >
          O orçamento do governo liga o imposto que você paga, os serviços que recebe e a dívida
          que define os juros de longo prazo do país.
        </SectionHead>

        <ol className="flow">
          {FLOW.map((f) => (
            <li key={f.id}>
              <button type="button" aria-pressed={step === f.id} onClick={() => setStep(f.id)}>
                <f.icon aria-hidden="true" size={22} strokeWidth={1.75} className="flow-icon" />
                <strong>{f.title}</strong>
                <span>{f.hint}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="flow-detail" aria-live="polite">
          <h3>{active.title}</h3>
          <p>{active.text}</p>
        </div>
        <p className="source-note">
          Os juros da dívida ficam fora do resultado primário. O resultado nominal inclui esses
          juros e mostra quanto o setor público precisa financiar no total.
        </p>

        <form className="calculator calculator-wide" onSubmit={(e) => e.preventDefault()}>
          <div>
            <h3>Quanto a despesa do governo pode crescer?</h3>
            <p>
              Pelo arcabouço fiscal, a despesa pode crescer, acima da inflação, 70% do quanto a
              receita cresceu, ou 50% se a meta de resultado primário não foi cumprida. O
              resultado fica sempre entre 0,6% e 2,5% ao ano.
            </p>
            <RangeField
              id="revenue-growth"
              label="Crescimento da receita acima da inflação"
              unit="%"
              value={revenueGrowth}
              onChange={setRevenueGrowth}
              min={-5}
              max={8}
              step={0.1}
              inputMin={-20}
              inputMax={20}
            />
            <fieldset className="field">
              <legend>A meta de resultado primário foi cumprida?</legend>
              <div className="segmented">
                <button type="button" aria-pressed={metTarget} onClick={() => setMetTarget(true)}>
                  Sim, vale 70%
                </button>
                <button type="button" aria-pressed={!metTarget} onClick={() => setMetTarget(false)}>
                  Não, vale 50%
                </button>
              </div>
            </fieldset>
          </div>

          <output className="result" aria-live="polite">
            <span>Limite de crescimento da despesa</span>
            <strong className="figure">{pct(rule.limit, 2, false)}</strong>
            <small>
              {rule.share}% de {pct(revenueGrowth, 1, false)} dá {pct(rule.raw, 2, false)}
              {rule.clamped
                ? `, que a regra ajusta para ${rule.raw < FLOOR ? 'o piso de 0,6%' : 'o teto de 2,5%'}.`
                : ', dentro dos limites da regra.'}
            </small>
            <span className="rule" aria-hidden="true">
              <span
                className="rule-band"
                style={{ left: `${(FLOOR / 3) * 100}%`, right: `${100 - (CEILING / 3) * 100}%` }}
              />
              <span className="rule-marker" style={{ left: `${rule.position}%` }} />
            </span>
            <span className="rule-scale" aria-hidden="true">
              <span>0%</span>
              <span style={{ left: `${(FLOOR / 3) * 100}%` }}>0,6%</span>
              <span style={{ left: `${(CEILING / 3) * 100}%` }}>2,5%</span>
              <span>3%</span>
            </span>
          </output>
        </form>
      </div>
    </section>
  );
};
