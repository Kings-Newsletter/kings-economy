import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, CalendarDays, ExternalLink, Link2, Newspaper } from 'lucide-react';
import { Story, editionLabel, longDate, newsHref, storyHref, useStory } from '../../lib/news';
import { StoryFigure } from '../ui/StoryFigure';
import { withTerms } from '../ui/Term';

const MoreCard: React.FC<{ story: Story }> = ({ story }) => (
  <li>
    <a href={storyHref(story.id)} className="more-card">
      {story.image && (
        <img
          src={story.image.url}
          alt=""
          width={story.image.width ?? 320}
          height={story.image.height ?? 200}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />
      )}
      <span>
        {story.category && <span className="story-category">{story.category}</span>}
        <strong>{story.title}</strong>
      </span>
    </a>
  </li>
);

/** Página própria de uma notícia: título, resumo, contexto, fontes e mais da mesma edição. */
export const StoryPage: React.FC<{ id: string }> = ({ id }) => {
  const state = useStory(id);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  const data = state.status === 'ok' ? state.data : null;
  const story = data?.story;

  useEffect(() => {
    if (story) {
      document.title = `${story.title} | King's Economia`;
      headingRef.current?.focus();
    }
  }, [story]);

  // O mesmo termo só é marcado uma vez na página inteira.
  const body = useMemo(() => {
    if (!story) return null;
    const seen = new Set<string>();
    return { summary: withTerms(story.summary, seen), context: withTerms(story.context, seen) };
  }, [story]);

  return (
    <main id="main" tabIndex={-1} className="story-page">
      <div className="wrap">
        <nav className="breadcrumb" aria-label="Você está em">
          <a href={story?.editionDate ? newsHref(story.editionDate) : newsHref()}>
            <ArrowLeft aria-hidden="true" size={16} /> Notícias
          </a>
          {story?.category && (
            <>
              <span aria-hidden="true">/</span>
              <span>{story.category}</span>
            </>
          )}
        </nav>

        {state.status === 'loading' && (
          <div className="headline-skeleton" aria-busy="true">
            <span className="sr-only">Carregando a notícia…</span>
          </div>
        )}

        {state.status === 'error' && (
          <div className="empty-state">
            <p>
              {state.notFound
                ? 'Esta notícia não existe ou foi retirada.'
                : 'Não foi possível carregar a notícia agora. Tente recarregar a página em alguns minutos.'}
            </p>
            <p>
              <a href={newsHref()}>Ver as notícias da edição atual</a>
            </p>
          </div>
        )}

        {story && body && (
          <>
            <article className="story-article" aria-labelledby="story-title">
              <header className="story-article-head">
                <p className="headline-kicker">
                  <Newspaper aria-hidden="true" size={16} />
                  <span>{story.category || 'Economia'}</span>
                </p>
                <h1 id="story-title" ref={headingRef} tabIndex={-1}>
                  {story.title}
                </h1>
                <p className="story-article-meta">
                  <span>
                    <CalendarDays aria-hidden="true" size={15} />
                    {story.publishedAt ? `Publicada em ${story.publishedAt}` : 'Data não informada'}
                    {story.source ? ` por ${story.source}` : ''}
                  </span>
                  {story.editionDate && (
                    <a href={newsHref(story.editionDate)}>{editionLabel(story.editionDate)}</a>
                  )}
                </p>
              </header>

              {story.image && <StoryFigure image={story.image} priority className="story-article-figure" />}

              <div className="story-article-body">
                {story.summary && <p className="story-article-lead">{body.summary}</p>}

                {story.context && (
                  <section aria-labelledby="contexto-title">
                    <h2 id="contexto-title">Entenda o contexto</h2>
                    <p>{body.context}</p>
                  </section>
                )}

                <aside className="story-article-sources" aria-labelledby="fontes-noticia-title">
                  <h2 id="fontes-noticia-title">Fontes</h2>
                  <ul>
                    {story.url && (
                      <li>
                        <a href={story.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink aria-hidden="true" size={16} />
                          <span>
                            Matéria original{story.source ? ` em ${story.source}` : ''}
                            <span className="sr-only"> (abre em nova aba)</span>
                          </span>
                        </a>
                      </li>
                    )}
                    {story.relatedSources.map((r) => (
                      <li key={r.url}>
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          <Link2 aria-hidden="true" size={16} />
                          <span>
                            {r.name}
                            {r.publishedAt ? `, ${r.publishedAt}` : ''}
                            <span className="sr-only"> (abre em nova aba)</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                  <p className="source-note">
                    Resumo e contexto escritos pela equipe da King&apos;s Newsletter a partir das
                    fontes acima. As palavras sublinhadas abrem uma explicação simples.
                  </p>
                </aside>
              </div>
            </article>

            {data && data.more.length > 0 && (
              <section className="more-news" aria-labelledby="mais-title">
                <h2 id="mais-title">
                  Mais notícias {story.editionDate ? `de ${longDate(story.editionDate)}` : 'desta edição'}
                </h2>
                <ul>
                  {data.more.map((s) => (
                    <MoreCard key={s.id} story={s} />
                  ))}
                </ul>
                <a className="button" href={newsHref(story.editionDate || undefined)}>
                  Ver a edição completa
                </a>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
};
