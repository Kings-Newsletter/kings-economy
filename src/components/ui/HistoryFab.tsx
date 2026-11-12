import React, { useEffect, useId, useRef, useState } from 'react';
import { History, X } from 'lucide-react';
import { longDate, newsHref, type EditionSummary } from '../../lib/news';
import type { Loadable } from '../../lib/marketData';

const STEP = 15;

interface HistoryFabProps {
  history: Loadable<EditionSummary[]>;
  /** Data da edição aberta na página, para marcar na lista. */
  current?: string | null;
}

/**
 * Botão flutuante do histórico de edições, no canto da tela. Abre um painel que sobe de baixo,
 * sem bloquear a página: fecha com Esc, com o X, ao clicar fora ou ao escolher uma edição.
 */
export const HistoryFab: React.FC<HistoryFabProps> = ({ history, current }) => {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(STEP);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  // Avisa o CSS para subir o "voltar ao topo", que fica no mesmo canto.
  useEffect(() => {
    document.documentElement.classList.add('has-history-fab');
    return () => document.documentElement.classList.remove('has-history-fab');
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus({ preventScroll: true });
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(true);
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) close(false);
    };
    const onHash = () => close(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('hashchange', onHash);
    // Leva o foco para dentro do painel, na edição marcada ou no primeiro item.
    const panel = panelRef.current;
    const target =
      panel?.querySelector<HTMLElement>('[aria-current="page"]') ?? panel?.querySelector<HTMLElement>('a, button');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('hashchange', onHash);
    };
  }, [open]);

  const editions = history.status === 'ok' ? history.data : [];
  const latest = editions[0]?.date;
  const label = open ? 'Fechar histórico de edições' : 'Abrir histórico de edições';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`history-fab ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title="Histórico de edições"
        aria-expanded={open}
        aria-controls="historico-edicoes"
      >
        {open ? <X aria-hidden="true" size={22} /> : <History aria-hidden="true" size={22} />}
        {editions.length > 0 && !open && (
          <span className="history-fab-count" aria-hidden="true">
            {editions.length > 99 ? '99+' : editions.length}
          </span>
        )}
      </button>

      <div
        ref={panelRef}
        id="historico-edicoes"
        className={`history-panel ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        inert={!open}
      >
        <div className="history-panel-head">
          <h2 id={titleId}>
            <History aria-hidden="true" size={19} /> Histórico de edições
          </h2>
          <button
            type="button"
            className="appbar-button"
            onClick={() => {
              setOpen(false);
              buttonRef.current?.focus({ preventScroll: true });
            }}
            aria-label="Fechar histórico de edições"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="history-panel-body">
          {history.status === 'loading' && <p className="history-panel-note">Carregando o arquivo…</p>}
          {history.status === 'error' && (
            <p className="history-panel-note">O arquivo de edições não respondeu agora. Tente de novo em alguns minutos.</p>
          )}
          {history.status === 'ok' && editions.length === 0 && (
            <p className="history-panel-note">O arquivo começa com a primeira edição publicada.</p>
          )}
          {editions.length > 0 && (
            <>
              <p className="history-panel-note">
                {editions.length} {editions.length === 1 ? 'edição publicada' : 'edições publicadas'}
              </p>
              <ol className="history-panel-list">
                {editions.slice(0, shown).map((e) => (
                  <li key={e.date}>
                    <a
                      href={newsHref(e.date === latest ? undefined : e.date)}
                      aria-current={e.date === current ? 'page' : undefined}
                    >
                      <strong>{longDate(e.date)}</strong>
                      <span>
                        {e.date === latest ? 'Mais recente · ' : ''}
                        {e.stories} {e.stories === 1 ? 'notícia' : 'notícias'}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
              {shown < editions.length && (
                <button type="button" className="button button-small" onClick={() => setShown((n) => n + STEP)}>
                  Mostrar mais edições
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
