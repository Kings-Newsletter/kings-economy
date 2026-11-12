import React from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { newsHref, storyHref, useEdition } from '../../lib/news';
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
        <div className="headline-header">
          <p className="headline-kicker">
            <Newspaper aria-hidden="true" size={16} />
            <span>Últimas notícias</span>
          </p>
        </div>

        <div className="headline-grid">
          <article className="headline-card">
            {lead.image && (
              <div className="headline-image-link">
                <StoryFigure image={lead.image} className="headline-figure" />
              </div>
            )}
            <div className="headline-body">
              {lead.category && <p className="story-category">{lead.category}</p>}
              <h2 id="headline-title">
                <a href={storyHref(lead.id)}>{lead.title}</a>
              </h2>
              <div className="headline-actions">
                <a className="button button-primary" href={storyHref(lead.id)}>
                  Ler notícia <ArrowRight aria-hidden="true" size={18} />
                </a>
              </div>
            </div>
          </article>

          {more.length > 0 && (
            <aside className="headline-more" aria-labelledby="headline-more-title">
              <h3 id="headline-more-title">Mais notícias</h3>
              <ul>
                {more.map((s) => (
                  <li key={s.id}>
                    <a href={storyHref(s.id)}>
                      <strong>{s.title}</strong>
                    </a>
                  </li>
                ))}
              </ul>
              <a className="headline-more-all" href={newsHref()}>
                Ver todas <ArrowRight aria-hidden="true" size={15} />
              </a>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
};
