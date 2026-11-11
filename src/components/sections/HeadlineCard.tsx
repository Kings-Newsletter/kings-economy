import React from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { longDate, newsHref, storyHref, useEdition } from '../../lib/news';
import { StoryFigure } from '../ui/StoryFigure';

/** Manchete da edição de economia mais recente, com acesso à página de notícias. */
export const HeadlineCard: React.FC = () => {
  const edition = useEdition();

  // Sem banco configurado, com erro ou sem nenhuma edição, a página inicial segue sem o card.
  if (edition.status === 'error') return null;
  if (edition.status === 'ok' && (!edition.data.date || edition.data.stories.length === 0)) return null;

  if (edition.status === 'loading') {
    return (
      <section className="headline band" aria-busy="true" aria-label="Manchete da edição atual">
        <div className="wrap">
          <div className="headline-skeleton" />
        </div>
      </section>
    );
  }

  const { data } = edition;
  const lead = data.stories.find((s) => s.headline) ?? data.stories[0];
  const more = data.stories.filter((s) => s.id !== lead.id).slice(0, 3);

  return (
    <section className="headline band" aria-labelledby="headline-title">
      <div className="wrap">
        <p className="headline-kicker">
          <Newspaper aria-hidden="true" size={16} />
          <span>Manchete de {data.date ? longDate(data.date) : 'hoje'}</span>
        </p>

        <div className="headline-grid">
          <article className="headline-card">
            {lead.image && (
              <a href={storyHref(lead.id)} tabIndex={-1} aria-hidden="true">
                <StoryFigure image={lead.image} className="headline-figure" />
              </a>
            )}
            <div className="headline-body">
              {lead.category && <p className="story-category">{lead.category}</p>}
              <h2 id="headline-title">
                <a href={storyHref(lead.id)}>{lead.title}</a>
              </h2>
              {lead.summary && <p className="headline-summary">{lead.summary}</p>}
              <p className="story-meta">
                {lead.source}
                {lead.publishedAt ? `, publicada em ${lead.publishedAt}` : ''}
              </p>
              <div className="headline-actions">
                <a className="button button-primary" href={newsHref()}>
                  Ler edição atual <ArrowRight aria-hidden="true" size={18} />
                </a>
                <a className="button" href={storyHref(lead.id)}>
                  Ler esta notícia
                </a>
              </div>
            </div>
          </article>

          {more.length > 0 && (
            <aside className="headline-more" aria-labelledby="headline-more-title">
              <h3 id="headline-more-title">Também nesta edição</h3>
              <ul>
                {more.map((s) => (
                  <li key={s.id}>
                    <a href={storyHref(s.id)}>
                      {s.category && <span className="story-category">{s.category}</span>}
                      <strong>{s.title}</strong>
                      <span className="headline-more-source">{s.source}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="headline-more-count">
                {data.stories.length} {data.stories.length === 1 ? 'notícia' : 'notícias'} nesta edição.
              </p>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
};
