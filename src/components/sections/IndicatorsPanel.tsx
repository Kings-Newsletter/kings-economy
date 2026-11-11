import React, { useEffect, useRef, useState } from 'react';
import { BarChart3, Info, TrendingDown, TrendingUp, X } from 'lucide-react';
import { EDITORIAL_SECTIONS, INDICATOR_ARCHITECTURE } from '../../data/economicContent';
import { EconomicSectionId, IndicatorArchitectureItem } from '../../types/economy';
import { INDICATOR_ICONS } from '../../lib/icons';
import type { IndicatorId } from '../../lib/officialData';
import type { IndicatorStates } from '../../lib/useIndicators';
import { IndicatorValue } from '../ui/IndicatorValue';
import { SectionHead } from '../ui/RangeField';

interface IndicatorsPanelProps {
  activeSection: EconomicSectionId | 'todas';
  onClearSection: () => void;
  readings: IndicatorStates;
}

export const IndicatorsPanel: React.FC<IndicatorsPanelProps> = ({
  activeSection,
  onClearSection,
  readings,
}) => {
  const [open, setOpen] = useState<IndicatorArchitectureItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const topic = EDITORIAL_SECTIONS.find((sec) => sec.id === activeSection);
  const indicators = topic
    ? INDICATOR_ARCHITECTURE.filter((ind) => ind.sectionId === activeSection)
    : INDICATOR_ARCHITECTURE;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <section id="indicadores" className="band" aria-labelledby="indicadores-title">
      <div className="wrap">
        <SectionHead
          id="indicadores-title"
          title="Os indicadores do noticiário"
          icon={BarChart3}
          summary="indicador é um número oficial que resume como está uma parte da economia, como os preços, os juros ou o emprego."
        >
          Os seis números que mais aparecem nas notícias, com o último dado oficial, a
          variação em relação ao anterior e o que significa quando sobem ou caem.
        </SectionHead>

        {topic && (
          <p className="filter-note">
            Mostrando os indicadores de <strong>{topic.shortTitle}</strong>.{' '}
            <button type="button" className="link-button" onClick={onClearSection}>
              Mostrar todos
            </button>
          </p>
        )}

        {indicators.length > 0 ? (
          <table className="register">
            <thead>
              <tr>
                <th scope="col">Indicador</th>
                <th scope="col">Último dado</th>
                <th scope="col">Quem publica</th>
                <th scope="col">Com que frequência</th>

                <th scope="col">
                  <span className="sr-only">Explicação</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind) => {
                const Icon = INDICATOR_ICONS[ind.id] ?? BarChart3;
                return (
                  <tr key={ind.id}>
                    <th scope="row">
                      <span className="register-head">
                        <span className="register-icon" aria-hidden="true">
                          <Icon size={20} strokeWidth={1.75} />
                        </span>
                        <span>
                          <span className="register-name">{ind.name}</span>
                          <span className="register-sub">{ind.fullName}</span>
                        </span>
                      </span>
                    </th>
                    <td className="register-reading">
                      <IndicatorValue
                        id={ind.id as IndicatorId}
                        name={ind.name}
                        state={readings[ind.id as IndicatorId]}
                      />
                    </td>
                    <td data-label="Quem publica">{ind.institution}</td>
                    <td data-label="Frequência">{ind.frequency}</td>

                    <td className="register-action">
                      <button
                        type="button"
                        className="button button-small"
                        onClick={() => setOpen(ind)}
                        aria-label={`Como ler: ${ind.name}`}
                      >
                        <Info aria-hidden="true" size={16} /> Como ler
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">
            Nenhum dos seis indicadores do painel pertence a {topic?.shortTitle}. Os dados desse
            tema estão listados acima, em “Quem publica os dados”.{' '}
            <button type="button" className="link-button" onClick={onClearSection}>
              Mostrar todos os indicadores
            </button>
          </p>
        )}

        <p className="source-note">
          Dados consultados ao abrir a página, direto nas APIs públicas do Banco Central (SGS:
          séries 432, 13522, 5793, 1 e 24369) e do IBGE (SIDRA: tabela 5932). Cada linha mostra
          a data do dado; a seta compara com a observação anterior e o mini gráfico mostra as
          últimas observações.
        </p>
      </div>

      <dialog
        ref={dialogRef}
        className="sheet"
        aria-labelledby="indicator-dialog-title"
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(null);
        }}
      >
        {open && (
          <div className="sheet-body">
            <div className="sheet-head">
              <div>
                <h3 id="indicator-dialog-title">{open.name}</h3>
                <p className="register-sub">
                  {open.fullName}. Publicado por {open.institution}, código {open.code}.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setOpen(null)}
                aria-label="Fechar explicação"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <div className="sheet-reading">
              <IndicatorValue
                id={open.id as IndicatorId}
                name={open.name}
                state={readings[open.id as IndicatorId]}
              />
            </div>

            <dl className="facts">
              <div>
                <dt>O que mede</dt>
                <dd>{open.whatItMeasures}</dd>
              </div>
              <div>
                <dt>Por que importa</dt>
                <dd>{open.whyItMatters}</dd>
              </div>
              <div className="is-up">
                <dt>
                  <TrendingUp aria-hidden="true" size={18} /> Quando sobe
                </dt>
                <dd>{open.howToReadUp}</dd>
              </div>
              <div className="is-down">
                <dt>
                  <TrendingDown aria-hidden="true" size={18} /> Quando cai
                </dt>
                <dd>{open.howToReadDown}</dd>
              </div>
            </dl>
            <p className="source-note">{open.methodologyNote}</p>
          </div>
        )}
      </dialog>
    </section>
  );
};
