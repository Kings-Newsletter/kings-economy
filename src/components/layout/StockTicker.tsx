import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { stockHref, TickerItem, useTicker } from '../../lib/brapi';
import { pct } from '../../lib/format';

const SPEED_PX_PER_S = 32;
const RESUME_AFTER_MS = 4000;

const price = (item: TickerItem) =>
  item.isIndex
    ? item.price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    : item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const TickerLink: React.FC<{ item: TickerItem; hidden?: boolean }> = ({ item, hidden }) => {
  const dir = Math.abs(item.changePercent) < 0.005 ? 'flat' : item.changePercent > 0 ? 'up' : 'down';
  return (
    <a
      href={stockHref(item.symbol)}
      className="ticker-item"
      tabIndex={hidden ? -1 : undefined}
      aria-label={hidden ? undefined : `${item.name}, ${price(item)}, ${pct(item.changePercent, 2)} no dia. Abrir gráficos`}
      draggable={false}
    >
      {item.logo ? (
        <img src={item.logo} alt="" width={20} height={20} loading="lazy" decoding="async" />
      ) : (
        <span className="ticker-logo-fallback" aria-hidden="true" />
      )}
      <strong translate="no">{item.isIndex ? 'IBOV' : item.symbol}</strong>
      <span>{price(item)}</span>
      <span className={`ticker-change is-${dir}`}>
        <span aria-hidden="true">{dir === 'up' ? '▲' : dir === 'down' ? '▼' : '='}</span> {pct(item.changePercent, 2)}
      </span>
    </a>
  );
};

/**
 * Faixa de cotações da B3, presa ao topo junto com o menu. Rola sozinha e também
 * aceita rolagem manual (toque, roda do mouse, arrastar ou as setas). A rolagem
 * automática para ao passar o mouse, ao focar com o teclado, ao tocar, pelo botão de
 * pausa e sempre que o sistema pede menos movimento.
 */
export const StockTicker: React.FC = () => {
  const ticker = useTicker();
  const viewportRef = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLUListElement>(null);
  const [userPaused, setUserPaused] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  const tickerRef = useRef<HTMLDivElement>(null);
  // Quantas cópias da lista: o bastante para sempre haver uma lista inteira além da área
  // visível. Com poucas ações e tela larga, duas cópias não bastavam e a rolagem travava.
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    if (ticker.status !== 'ok') return;
    const viewport = viewportRef.current;
    const firstCopy = firstCopyRef.current;
    if (!viewport || !firstCopy || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const loop = firstCopy.offsetWidth;
      if (loop > 0) setCopies(Math.max(2, Math.ceil(viewport.clientWidth / loop) + 1));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(firstCopy);
    measure();
    return () => ro.disconnect();
  }, [ticker.status]);
  const holdUntilRef = useRef(0);
  const draggingRef = useRef(false);

  // Laço de rolagem automática.
  // - A posição fica num número decimal próprio (pos), e não é lida de volta do scrollLeft:
  //   o navegador arredonda scrollLeft para os pixels da tela e, com escala de tela de 125% ou
  //   150%, somar 1px podia arredondar para o mesmo valor e a faixa parava de vez.
  // - As condições de pausa são conferidas a cada quadro, ao vivo (nada fica "preso"):
  //   mouse em cima (só com mouse de verdade), foco de teclado, toque/roda recentes, arraste,
  //   aba escondida ou pausa pelo botão.
  useEffect(() => {
    if (ticker.status !== 'ok') return;
    const viewport = viewportRef.current;
    const firstCopy = firstCopyRef.current;
    const tickerEl = tickerRef.current;
    if (!viewport || !firstCopy || !tickerEl) return;
    const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let last = performance.now();
    let pos = viewport.scrollLeft;

    const step = (now: number) => {
      const dt = Math.min(64, Math.max(0, now - last));
      last = now;
      const loopWidth = firstCopy.offsetWidth;

      // Se alguém rolou à mão (dedo, roda, setas, arraste), segue dali.
      if (Math.abs(viewport.scrollLeft - pos) > 2) pos = viewport.scrollLeft;

      const hovering = Boolean(finePointer?.matches) && tickerEl.matches(':hover');
      const keyboardFocus = viewport.querySelector(':focus-visible') !== null;
      const running =
        !userPaused &&
        !hovering &&
        !keyboardFocus &&
        !draggingRef.current &&
        now > holdUntilRef.current &&
        document.visibilityState === 'visible' &&
        loopWidth > 0 &&
        viewport.scrollWidth - viewport.clientWidth >= loopWidth;

      let changed = false;
      if (running) {
        pos += (SPEED_PX_PER_S * dt) / 1000;
        changed = true;
      }
      if (loopWidth > 0) {
        if (pos >= loopWidth) {
          pos -= loopWidth;
          changed = true;
        } else if (pos < 1 && !running) {
          // Rolando para trás à mão: pula para a cópia, sem fim visível.
          pos += loopWidth;
          changed = true;
        }
      }
      if (changed) viewport.scrollLeft = pos;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [ticker.status, userPaused]);

  // Arrastar com o mouse para rolar (toque e trackpad já rolam nativamente).
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let startX = 0;
    let startScroll = 0;
    let moved = false;
    const hold = () => {
      holdUntilRef.current = performance.now() + RESUME_AFTER_MS;
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        hold();
        return;
      }
      draggingRef.current = true;
      moved = false;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
    };
    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      viewport.scrollLeft = startScroll - dx;
    };
    // Só segura a faixa se o arraste começou nela; cliques no resto da página não a afetam.
    const up = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (moved) hold();
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        moved = false;
      }
    };
    viewport.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    viewport.addEventListener('wheel', hold, { passive: true });
    viewport.addEventListener('touchmove', hold, { passive: true });
    viewport.addEventListener('click', click, true);
    return () => {
      viewport.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      viewport.removeEventListener('wheel', hold);
      viewport.removeEventListener('touchmove', hold);
      viewport.removeEventListener('click', click, true);
    };
  }, [ticker.status]);

  const nudge = (dir: 1 | -1) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    holdUntilRef.current = performance.now() + RESUME_AFTER_MS;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollBy({ left: dir * viewport.clientWidth * 0.6, behavior: reduce ? 'auto' : 'smooth' });
  };

  if (ticker.status === 'error') return null;

  return (
    <div className="ticker" role="region" aria-label="Cotações da bolsa (B3)" ref={tickerRef}>
      <div className="wrap ticker-inner">
        <span className="ticker-label">B3</span>
        <button
          type="button"
          className="ticker-control"
          onClick={() => setUserPaused((v) => !v)}
          aria-pressed={userPaused}
          aria-label={userPaused ? 'Retomar a rolagem automática' : 'Pausar a rolagem automática'}
          title={userPaused ? 'Retomar a rolagem automática' : 'Pausar a rolagem automática'}
        >
          {userPaused ? <Play aria-hidden="true" size={14} /> : <Pause aria-hidden="true" size={14} />}
        </button>

        <div className="ticker-viewport" ref={viewportRef}>
          {ticker.status === 'loading' ? (
            <p className="ticker-loading">Carregando cotações…</p>
          ) : (
            <div className="ticker-track">
              <ul ref={firstCopyRef}>
                {ticker.data.map((item) => (
                  <li key={item.symbol}>
                    <TickerLink item={item} />
                  </li>
                ))}
              </ul>
              {Array.from({ length: copies - 1 }, (_, c) => (
                <ul aria-hidden="true" key={c}>
                  {ticker.data.map((item) => (
                    <li key={item.symbol}>
                      <TickerLink item={item} hidden />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}
        </div>

        <button type="button" className="ticker-control" onClick={() => nudge(-1)} aria-label="Rolar cotações para trás">
          <ChevronLeft aria-hidden="true" size={16} />
        </button>
        <button type="button" className="ticker-control" onClick={() => nudge(1)} aria-label="Rolar cotações para a frente">
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
};
