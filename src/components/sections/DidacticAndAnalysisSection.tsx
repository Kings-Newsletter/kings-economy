import React, { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Clock, ExternalLink, Layers, Newspaper, Sprout, Star } from 'lucide-react';
import { DIDACTIC_GUIDES, EDITORIAL_SECTIONS } from '../../data/economicContent';
import { DidacticGuide, EconomicSectionId } from '../../types/economy';
import { SECTION_ICONS } from '../../lib/icons';
import { SectionHead } from '../ui/RangeField';

interface DidacticAndAnalysisSectionProps {
  activeSection: EconomicSectionId | 'todas';
  onClearSection: () => void;
}

const LEVELS: Record<DidacticGuide['level'], { label: string; icon: LucideIcon; tone: string }> = {
  Iniciante: { label: 'Para iniciantes', icon: Sprout, tone: 'is-start' },
  Essencial: { label: 'Essencial', icon: Star, tone: 'is-core' },
  Intermediário: { label: 'Intermediário', icon: Layers, tone: 'is-mid' },
};

const OFFICIAL_SITES = [
  { href: 'https://www.bcb.gov.br/', label: 'Banco Central do Brasil' },
  { href: 'https://www.ibge.gov.br/', label: 'IBGE' },
  { href: 'https://www.tesourotransparente.gov.br/', label: 'Tesouro Transparente' },
];

const GuideStory: React.FC<{ guide: DidacticGuide }> = ({ guide }) => {
  const [open, setOpen] = useState(false);
  const level = LEVELS[guide.level];
  const LevelIcon = level.icon;
  const topic = EDITORIAL_SECTIONS.find((s) => s.id === guide.sectionId);
  const TopicIcon = SECTION_ICONS[guide.sectionId];
  const panelId = `${guide.id}-passos`;

  return (
    <article className="story">
      <p className="story-labels">
        <span className={`level ${level.tone}`}>
          <LevelIcon aria-hidden="true" size={14} strokeWidth={2.2} /> {level.label}
        </span>
        {topic && (
          <span className="story-topic">
            <TopicIcon aria-hidden="true" size={14} /> {topic.shortTitle}
          </span>
        )}
      </p>
      <h3>{guide.title}</h3>
      <p className="story-summary">{guide.summary}</p>
      <p className="story-meta">
        <Clock aria-hidden="true" size={15} /> {guide.readingTime}
      </p>

      <button
        type="button"
        className="story-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Fechar a explicação' : 'Ler a explicação passo a passo'}
        <ChevronDown aria-hidden="true" size={18} />
      </button>

      <div id={panelId} className="story-body" hidden={!open}>
        <ol className="steps">
          {guide.mechanismSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="takeaway">
          <strong>Na prática:</strong> {guide.practicalTakeaway}
        </p>
      </div>
    </article>
  );
};

export const DidacticAndAnalysisSection: React.FC<DidacticAndAnalysisSectionProps> = ({
  activeSection,
  onClearSection,
}) => {
  const topic = EDITORIAL_SECTIONS.find((sec) => sec.id === activeSection);
  const guides = topic
    ? DIDACTIC_GUIDES.filter((g) => g.sectionId === activeSection)
    : DIDACTIC_GUIDES;

  return (
    <section id="guias" className="band" aria-labelledby="guias-title">
      <div className="wrap">
        <SectionHead id="guias-title" title="Explicadores" icon={Newspaper}>
          Reportagens curtas que mostram, passo a passo, o mecanismo por trás das notícias
          econômicas.
        </SectionHead>

        {topic && (
          <p className="filter-note">
            Mostrando os explicadores de <strong>{topic.shortTitle}</strong>.{' '}
            <button type="button" className="link-button" onClick={onClearSection}>
              Mostrar todos
            </button>
          </p>
        )}

        <div className="stories-layout">
          {guides.length > 0 ? (
            <div className="stories">
              {guides.map((guide) => (
                <GuideStory key={guide.id} guide={guide} />
              ))}
            </div>
          ) : (
            <p className="empty-state">
              Ainda não há explicador sobre {topic?.shortTitle}. Comece pela trilha “Economia do
              zero”, que cobre o básico de todos os temas.{' '}
              <button type="button" className="link-button" onClick={onClearSection}>
                Ver todos os explicadores
              </button>
            </p>
          )}

          <aside className="news-box" aria-labelledby="noticias-title">
            <h3 id="noticias-title">
              <Newspaper aria-hidden="true" size={20} /> Notícias do dia
            </h3>
            <p>
              As notícias de economia da edição mais recente, cada uma com página própria,
              resumo, contexto e as fontes originais.
            </p>
            <a className="button button-primary button-small" href="#/noticias">
              Ler edição atual
            </a>
            <p>Comunicados oficiais, direto na fonte:</p>
            <ul>
              {OFFICIAL_SITES.map((site) => (
                <li key={site.href}>
                  <a href={site.href} target="_blank" rel="noopener noreferrer">
                    {site.label}
                    <ExternalLink aria-hidden="true" size={14} />
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
};
