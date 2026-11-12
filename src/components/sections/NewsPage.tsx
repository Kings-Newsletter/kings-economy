import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Newspaper } from 'lucide-react';
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
import { HistoryFab } from '../ui/HistoryFab';

const StoryItem: React.FC<{ story: Story; lead?: boolean }> = ({ story, lead }) => (
  <article className={`news-story ${lead ? 'is-lead' : ''}`}>
    {story.image && <StoryFigure image={story.image} priority={lead} className="news-story-figure" />}
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
          {story.publishedAt ? ` · ${story.publishedAt}` : ''}
        </span>
        <a href={storyHref(story.id)} className="news-story-more">
          Ler notícia <ArrowRight aria-hidden="true" size={14} />
          <span className="sr-only">: {story.title}</span>
        </a>
      </p>
    </div>
  </article>
);

const ALL = '';

/** Página só de notícias: a edição escolhida (ou a mais recente), com o histórico num botão flutuante. */
export const NewsPage: React.FC<{ date?: string }> = ({ date }) => {
  const edition = useEdition(date);
  const history = useHistory();
  const [category, setCategory] = useState(ALL);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Troca de edição é troca de página: vai ao topo sem a rolagem suave do CSS.
    window.scrollTo({ top: 0, behavior: 'instant' });
    headingRef.current?.focus({ preventScroll: true });
    setCategory(ALL);
  }, [date]);

  const data = edition.status === 'ok' ? edition.data : null;
  const stories = useMemo(
    () => (data ? [...data.stories].sort((a, b) => Number(b.headline) - Number(a.headline)) : []),
    [data]
  );
  const categories = useMemo(() => {
    const count = new Map<string, number>();
    stories.forEach((s) => s.category && count.set(s.category, (count.get(s.category) ?? 0) + 1));
    return [...count].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
  }, [stories]);
  const visible = category ? stories.filter((s) => s.category === category) : stories;
  const [lead, ...rest] = visible;

  // Edição anterior e seguinte, pela ordem do arquivo (do mais recente para o mais antigo).
  const editions = history.status === 'ok' ? history.data : [];
  const latestDate = editions[0]?.date;
  const index = data?.date ? editions.findIndex((e) => e.date === data.date) : -1;
  const older = index >= 0 ? editions[index + 1] : undefined;
  const newer = index > 0 ? editions[index - 1] : undefined;
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
          <div className="news-head-text">
            <p className="headline-kicker">
              <Newspaper aria-hidden="true" size={16} />
              <span>{isLatest ? 'Edição mais recente' : 'Notícias de economia'}</span>
            </p>
            <h1 ref={headingRef} tabIndex={-1}>
              {data?.date ? editionLabel(data.date) : 'Notícias'}
            </h1>
            {data?.date && (
              <p className="news-head-date">
                <CalendarDays aria-hidden="true" size={16} />
                {data.stories.length} {data.stories.length === 1 ? 'notícia' : 'notícias'}
                {categories.length > 1 ? ` em ${categories.length} temas` : ''}
              </p>
            )}
          </div>
          <p className="news-head-lede">
            O que mexeu com a economia, resumido em linguagem direta. Cada notícia tem uma página com o
            contexto e as fontes. As edições anteriores ficam no botão de histórico, no canto da tela.
          </p>
        </header>

        {edition.status === 'loading' && (
          <div className="news-skeleton" aria-busy="true">
            <span className="headline-skeleton" />
            <span className="news-skeleton-row">
              <span className="headline-skeleton" />
              <span className="headline-skeleton" />
              <span className="headline-skeleton" />
            </span>
            <span className="sr-only">Carregando a edição…</span>
          </div>
        )}

        {edition.status === 'error' && (
          <div className="empty-state">
            <p>
              {edition.notFound
                ? 'Não há edição publicada nesta data.'
                : 'Não foi possível carregar as notícias agora. Tente recarregar a página em alguns minutos.'}
            </p>
            {date && <a href={newsHref()}>Ver a edição mais recente</a>}
          </div>
        )}

        {data && !data.date && (
          <div className="empty-state">
            <p>
              <strong>Ainda não há notícias de economia publicadas.</strong> Assim que a primeira edição
              for registrada, ela aparece aqui, e as anteriores ficam no histórico.
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

        {data?.date && stories.length === 0 && <p className="empty-state">Esta edição não tem notícias.</p>}

        {categories.length > 1 && (
          <div className="news-filters" role="group" aria-label="Filtrar notícias por tema">
            <button type="button" className="chip" aria-pressed={category === ALL} onClick={() => setCategory(ALL)}>
              Todas <span className="chip-count">{stories.length}</span>
            </button>
            {categories.map(([name, n]) => (
              <button
                key={name}
                type="button"
                className="chip"
                aria-pressed={category === name}
                onClick={() => setCategory(category === name ? ALL : name)}
              >
                {name} <span className="chip-count">{n}</span>
              </button>
            ))}
          </div>
        )}

        {lead && (
          <div className="news-list" aria-live="polite">
            <StoryItem key={lead.id} story={lead} lead />
            {rest.length > 0 && (
              <div className="news-grid">
                {rest.map((s) => (
                  <StoryItem key={s.id} story={s} />
                ))}
              </div>
            )}
          </div>
        )}

        {(older || newer) && (
          <nav className="edition-pager" aria-label="Outras edições">
            {older ? (
              <a href={newsHref(older.date)} className="edition-pager-link">
                <ChevronLeft aria-hidden="true" size={20} />
                <span>
                  <small>Edição anterior</small>
                  <strong>{longDate(older.date)}</strong>
                </span>
              </a>
            ) : (
              <span />
            )}
            {newer && (
              <a href={newsHref(newer.date === latestDate ? undefined : newer.date)} className="edition-pager-link is-next">
                <span>
                  <small>{newer.date === latestDate ? 'Edição mais recente' : 'Próxima edição'}</small>
                  <strong>{longDate(newer.date)}</strong>
                </span>
                <ChevronRight aria-hidden="true" size={20} />
              </a>
            )}
          </nav>
        )}
      </div>

      <HistoryFab history={history} current={data?.date} />
    </main>
  );
};
