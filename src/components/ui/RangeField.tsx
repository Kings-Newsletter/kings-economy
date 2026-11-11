import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { toNumber } from '../../lib/format';

interface RangeFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  /** Limites do campo digitado, que podem ir além do controle deslizante. */
  inputMin?: number;
  inputMax?: number;
  unit?: string;
  hint?: string;
}

export const RangeField: React.FC<RangeFieldProps> = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  inputMin,
  inputMax,
  unit,
  hint,
}) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    {hint && (
      <p className="field-hint" id={`${id}-hint`}>
        {hint}
      </p>
    )}
    <div className="field-pair">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(toNumber(e.target.value))}
        aria-label={`${label}, controle deslizante`}
      />
      <span className="field-number">
        <input
          id={id}
          name={id}
          type="number"
          inputMode="decimal"
          autoComplete="off"
          min={inputMin ?? min}
          max={inputMax ?? max}
          step={step}
          value={value}
          onChange={(e) => onChange(toNumber(e.target.value))}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {unit && <span aria-hidden="true">{unit}</span>}
      </span>
    </div>
  </div>
);

interface MoneyFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}

export const MoneyField: React.FC<MoneyFieldProps> = ({
  id,
  label,
  value,
  onChange,
  min = 0,
  step = 10,
}) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <span className="field-number field-money">
      <span aria-hidden="true">R$</span>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="decimal"
        autoComplete="off"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(toNumber(e.target.value))}
      />
    </span>
  </div>
);

interface SectionHeadProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  /** Resumo em linguagem simples, mostrado na caixa "Em uma frase". */
  summary?: React.ReactNode;
  children?: React.ReactNode;
}

/** Cabeçalho de editoria: ícone, título, linha fina e, opcionalmente, o resumo para iniciantes. */
export const SectionHead: React.FC<SectionHeadProps> = ({
  id,
  title,
  icon: Icon,
  summary,
  children,
}) => (
  <header className="section-head">
    <div className="section-title">
      {Icon && (
        <span className="section-icon" aria-hidden="true">
          <Icon size={22} strokeWidth={1.75} />
        </span>
      )}
      <h2 id={id}>{title}</h2>
    </div>
    {children && <p className="lede">{children}</p>}
    {summary && <OneSentence>{summary}</OneSentence>}
  </header>
);

/** Caixa "Em uma frase": a ideia central para quem está começando. */
export const OneSentence: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <aside className="one-sentence">
    <Lightbulb aria-hidden="true" size={20} strokeWidth={1.9} />
    <p>
      <strong>Em uma frase:</strong> {children}
    </p>
  </aside>
);
