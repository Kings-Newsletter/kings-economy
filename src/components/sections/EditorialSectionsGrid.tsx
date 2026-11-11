import React from 'react';
import { LayoutGrid, X } from 'lucide-react';
import { EDITORIAL_SECTIONS } from '../../data/economicContent';
import { EconomicSectionId } from '../../types/economy';
import { SECTION_ICONS } from '../../lib/icons';
import { SectionHead } from '../ui/RangeField';

interface EditorialSectionsGridProps {
  activeSection: EconomicSectionId | 'todas';
  onSelectSection: (section: EconomicSectionId | 'todas') => void;
}

export const EditorialSectionsGrid: React.FC<EditorialSectionsGridProps> = ({
  activeSection,
  onSelectSection,
}) => {
  const selected = EDITORIAL_SECTIONS.find((sec) => sec.id === activeSection);
  const SelectedIcon = selected ? SECTION_ICONS[selected.id] : null;

  return (
    <section id="temas" className="band" aria-labelledby="temas-title">
      <div className="wrap">
        <SectionHead id="temas-title" title="Temas da economia" icon={LayoutGrid}>
          Escolha o assunto que mais interessa a você. Os indicadores e os explicadores logo
          abaixo passam a mostrar só o que tem a ver com ele.
        </SectionHead>

        <ul className="topic-grid" aria-label="Temas">
          {EDITORIAL_SECTIONS.map((sec) => {
            const Icon = SECTION_ICONS[sec.id];
            return (
              <li key={sec.id}>
                <button
                  type="button"
                  className="topic-tile"
                  aria-pressed={activeSection === sec.id}
                  onClick={() => onSelectSection(activeSection === sec.id ? 'todas' : sec.id)}
                >
                  <span className="topic-tile-icon" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.75} />
                  </span>
                  <strong>{sec.shortTitle}</strong>
                  <span>{sec.keyQuestion}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div aria-live="polite">
          {selected && SelectedIcon && (
            <article className="topic-focus" key={selected.id}>
              <div className="topic-focus-head">
                <SelectedIcon aria-hidden="true" size={28} strokeWidth={1.6} />
                <div>
                  <h3>{selected.title}</h3>
                  <p>{selected.subtitle}</p>
                </div>
                <button
                  type="button"
                  className="button button-small"
                  onClick={() => onSelectSection('todas')}
                >
                  <X aria-hidden="true" size={16} /> Ver todos os temas
                </button>
              </div>
              <dl className="facts facts-3">
                <div>
                  <dt>O que se acompanha</dt>
                  <dd>{selected.whatIsMeasured}</dd>
                </div>
                <div>
                  <dt>O efeito no seu bolso</dt>
                  <dd>{selected.dailyImpact}</dd>
                </div>
                <div>
                  <dt>Quem publica os dados</dt>
                  <dd>{selected.officialSource}</dd>
                  <dd className="tag-row">
                    {selected.relatedIndicators.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </article>
          )}
        </div>
      </div>
    </section>
  );
};
