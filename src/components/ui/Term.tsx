import React, { useEffect, useId, useRef, useState } from 'react';
import { GLOSSARY_ENTRIES } from '../../data/economicContent';

interface TermProps {
  /** Início do nome do verbete no glossário, como "Selic" ou "IPCA". */
  entry: string;
  children: React.ReactNode;
}

// Termos do glossário reconhecidos automaticamente em textos de notícia.
const AUTO_TERMS: Array<[RegExp, string]> = [
  [/\bSelic\b/, 'Selic'],
  [/\bIPCA\b/, 'IPCA'],
  [/\bIGP-M\b/, 'IGP-M'],
  [/\bPIB\b/, 'PIB'],
  [/\bCDI\b/, 'CDI'],
  [/\bPTAX\b/, 'Câmbio PTAX'],
  [/\bspread\b/i, 'Spread'],
  [/\bjuros? rea(?:l|is)\b/i, 'Juro Real'],
  [/\bresultado primário\b/i, 'Resultado Primário'],
  [/\bcarga tributária\b/i, 'Carga Tributária'],
];

/**
 * Marca a primeira ocorrência de cada termo do glossário num texto corrido, para quem
 * está começando poder tocar e ver a explicação. `seen` evita repetir o mesmo termo
 * em parágrafos seguintes.
 */
export const withTerms = (text: string, seen: Set<string> = new Set()): React.ReactNode[] => {
  let parts: React.ReactNode[] = [text];
  for (const [re, entry] of AUTO_TERMS) {
    if (seen.has(entry)) continue;
    let done = false;
    parts = parts.flatMap<React.ReactNode>((part, i) => {
      if (done || typeof part !== 'string') return [part];
      const m = part.match(re);
      if (!m || m.index === undefined) return [part];
      done = true;
      seen.add(entry);
      return [
        part.slice(0, m.index),
        <Term key={`${entry}-${i}`} entry={entry}>
          {m[0]}
        </Term>,
        part.slice(m.index + m[0].length),
      ];
    });
  }
  return parts;
};

/**
 * Palavra técnica explicada no próprio texto: tocar, clicar ou focar abre a definição
 * simples do glossário. Esc ou um clique fora fecham.
 */
export const Term: React.FC<TermProps> = ({ entry, children }) => {
  const item = GLOSSARY_ENTRIES.find((g) => g.term.toLowerCase().startsWith(entry.toLowerCase()));
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  if (!item) return <>{children}</>;

  return (
    <span className="term" ref={wrapRef}>
      <button
        type="button"
        className="term-trigger"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen((v) => !v)}
      >
        {children}
      </button>
      <span id={popId} className="term-pop" role="note" data-open={open} hidden={!open}>
        <strong>{item.term}</strong>
        <span>{item.plainDefinition}</span>
      </span>
    </span>
  );
};
