import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, History, Newspaper } from 'lucide-react';
import {
  Story,
  editionLabel,
  longDate,
  newsHref,
  NEWSLETTER_URL,
  storyHref,
  useEdition,
  useHistory,
} from '../../lib/news';
import { StoryFigure } from '../ui/StoryFigure';

const StoryItem: React.FC<{ story: Story; lead?: boolean }> = ({ story, lead }) => (
  <article className={`news-story ${lead ? 'is-lead' : ''}`}>
    {story.image && (
      <div className="news-story-image-link">
        <StoryFigure image={story.image} priority={lead} className="news-story-figure" />
      </div>
    )}
    <div className="news-story-body">
      {story.category && <p className="story-category">{story.category}</p>}
      {lead ? (
        <h2>
          <a href={storyHref(story.id)}>{story.title}</a>
        </h2>
      ) : (
        <h3>
          <a href={storyHref(story.id)}>{story.title}</a>
        </h3>
      )}
      {story.summary && <p className="news-story-summary">{story.summary}</p>}
      <p className="news-story-meta">
        <span>
          {story.source}
          {story.publishedAt ? `, publicada em ${story.publishedAt}` : ''}
        </span>
        <a href={storyHref(story.id)} className="news-story-more">
          Ler notícia <ArrowRight aria-hidden="true" size={14} />
          <span className="sr-only">: {story.title}</span>
        </a>
      </p>
    </div>
  </article>
);

const HISTORY_STEP = 12;

/** Página só de notícias: a edição escolhida (ou a mais recente) e o arquivo de edições. */
export const NewsPage: React.FC<{ date?: string }> = ({ date }) => {
  const edition = useEdition(date);
  const history = useHistory();
  const [historyShown, setHistoryShown] = useState(HISTORY_STEP);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [date]);

  const data = edition.status === 'ok' ? edition.data : null;
  const stories = data ? [...data.stories].sort((a, b) => Number(b.headline) - Number(a.headline)) : [];
  const latestDate = history.status === 'ok' ? history.data[0]?.date : undefined;
  const isLatest = Boolean(data?.date) && (!date || date === latestDate);

  return (
    <main id="main" tabIndex={-1} className="news-page">
      <div className="wrap">
        <nav className="breadcrumb" aria-label="Você está em">
          <a href="#topo">
            <ArrowLeft aria-hidden="true" size={16} /> Início
          </a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Notícias</span>
        </nav>

        <header className="news-head">
          <p className="headline-kicker">
            <Newspaper aria-hidden="true" size={16} />
            <span>Notícias de economia</span>
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {data?.date ? editionLabel(data.date) : 'Notícias'}
          </h1>
          {data?.date && (
            <p className="news-head-date">
              <CalendarDays aria-hidden="true" size={16} /> {data.stories.length}{' '}
              {data.stories.length === 1 ? 'notícia' : 'notícias'}
              {isLatest ? ', edição mais recente' : ''}
            </p>
          )}
        </header>

        <div className="news-layout">
          <div className="news-main">
            {edition.status === 'loading' && (
              <div className="headline-skeleton" aria-busy="true">
                <span className="sr-only">Carregando a edição…</span>
              </div>
            )}

            {edition.status === 'error' && (
              <p className="empty-state">
                {edition.notFound
                  ? 'Não há edição publicada nesta data.'
                  : 'Não foi possível carregar as notícias agora. Tente recarregar a página em alguns minutos.'}{' '}
                {date && <a href={newsHref()}>Ver a edição mais recente</a>}
              </p>
            )}

            {data && !data.date && (
              <div className="empty-state">
                <p>
                  <strong>Ainda não há notícias de economia publicadas.</strong> Assim que a primeira
                  edição for registrada, ela aparece aqui, com o arquivo das anteriores ao lado.
                </p>
                <p>
                  Enquanto isso, a edição diária completa está na{' '}
                  <a href={NEWSLETTER_URL} target="_blank" rel="noopener noreferrer">
                    King&apos;s Newsletter
                  </a>
                  .
                </p>
              </div>
            )}

            {data?.date && stories.length === 0 && (
              <p className="empty-state">Esta edição não tem notícias.</p>
            )}

            {stories.length > 0 && (
              <div className="news-list">
                {stories.map((s, i) => (
                  <StoryItem key={s.id} story={s} lead={i === 0} />
                ))}
              </div>
            )}
          </div>

          <aside className="news-archive" aria-labelledby="archive-title">
            <h2 id="archive-title">
              <History aria-hidden="true" size={20} /> Edições anteriores
            </h2>
            {history.status === 'loading' && <p className="news-archive-note">Carregando o arquivo…</p>}
            {history.status === 'error' && (
              <p className="news-archive-note">O arquivo de edições não respondeu agora.</p>
            )}
            {history.status === 'ok' && history.data.length === 0 && (
              <p className="news-archive-note">O arquivo começa com a primeira edição publicada.</p>
            )}
            {history.status === 'ok' && history.data.length > 0 && (
              <>
                <ol>
                  {history.data.slice(0, historyShown).map((e) => (
                    <li key={e.date}>
                      <a
                        href={newsHref(e.date === latestDate ? undefined : e.date)}
                        aria-current={e.date === data?.date ? 'page' : undefined}
                      >
                        <strong>{longDate(e.date)}</strong>
                        <span>
                          {e.stories} {e.stories === 1 ? 'notícia' : 'notícias'}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
                {historyShown < history.data.length && (
                  <button
                    type="button"
                    className="button button-small"
                    onClick={() => setHistoryShown((n) => n + HISTORY_STEP)}
                  >
                    Mostrar mais edições
                  </button>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
};
