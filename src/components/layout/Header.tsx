import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUp,
  BarChart3,
  BookOpen,
  CandlestickChart,
  Crown,
  FileText,
  GraduationCap,
  Landmark,
  LayoutGrid,
  Menu,
  Moon,
  Newspaper,
  Percent,
  Sun,
  Wallet,
  X,
} from 'lucide-react';

import { StockTicker } from './StockTicker';

export type ThemeMode = 'dark' | 'light';

interface HeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const NAV_LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: '#/noticias', label: 'Notícias', icon: Newspaper },
  { href: '#do-zero', label: 'Do zero', icon: GraduationCap },
  { href: '#temas', label: 'Temas', icon: LayoutGrid },
  { href: '#indicadores', label: 'Indicadores', icon: BarChart3 },
  { href: '#mercados', label: 'Moedas e bolsa', icon: CandlestickChart },
  { href: '#guias', label: 'Explicadores', icon: FileText },
  { href: '#no-bolso', label: 'No seu bolso', icon: Wallet },
  { href: '#juro-real', label: 'Juro real', icon: Percent },
  { href: '#dinheiro-publico', label: 'Dinheiro público', icon: Landmark },
  { href: '#glossario', label: 'Glossário', icon: BookOpen },
];

const today = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date());

/** Barra fina de progresso de leitura, presa ao menu. Atualiza via transform, sem reflow. */
const ReadingProgress: React.FC = () => {
  const barRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <span className="reading-progress" aria-hidden="true">
      <span ref={barRef} />
    </span>
  );
};

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  const nextThemeLabel = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';
  const drawerRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 400);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  // Gaveta do menu em telas menores. O <dialog> nativo já prende o foco dentro dela,
  // deixa o resto da página inerte e fecha com Esc.
  const openDrawer = () => {
    const d = drawerRef.current;
    if (d && !d.open) {
      d.showModal();
      document.documentElement.classList.add('drawer-open');
    }
  };
  // Libera a rolagem já no clique: o link do menu precisa rolar a página até a seção.
  const closeDrawer = () => {
    document.documentElement.classList.remove('drawer-open');
    drawerRef.current?.close();
  };

  // Links da gaveta: fecha primeiro e só depois navega. Se o navegador seguisse o link de
  // dentro do <dialog> que está fechando, ele atualizaria o endereço sem rolar até a seção.
  const goFromDrawer = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    closeDrawer();
    setTimeout(() => {
      if (window.location.hash === href) {
        document.getElementById(href.slice(1))?.scrollIntoView();
      } else {
        window.location.hash = href;
      }
    }, 0);
  };

  useEffect(() => {
    const d = drawerRef.current;
    if (!d) return;
    const onClose = () => {
      document.documentElement.classList.remove('drawer-open');
      toggleRef.current?.focus({ preventScroll: true });
    };
    // Clique no fundo escurecido (fora do painel) fecha a gaveta.
    const onClick = (e: MouseEvent) => {
      if (e.target === d) d.close();
    };
    // Se a tela crescer com a gaveta aberta, ela fecha sozinha.
    const wide = window.matchMedia('(min-width: 1081px)');
    const onWide = () => wide.matches && d.open && d.close();
    d.addEventListener('close', onClose);
    d.addEventListener('click', onClick);
    wide.addEventListener('change', onWide);
    window.addEventListener('hashchange', closeDrawer);
    return () => {
      d.removeEventListener('close', onClose);
      d.removeEventListener('click', onClick);
      wide.removeEventListener('change', onWide);
      window.removeEventListener('hashchange', closeDrawer);
    };
  }, []);

  const themeIcon = theme === 'dark' ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />;

  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          // Sem mudar o hash, para não sair da página da ação.
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Pular para o conteúdo
      </a>

      {/* Âncora do topo, sempre visível (o cabeçalho grande some em telas menores). */}
      <span id="topo" className="top-anchor" aria-hidden="true" />

      <div className="masthead-topbar">
        <div className="wrap masthead-top">
          <p className="masthead-date">{today}</p>
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={nextThemeLabel}
            title={nextThemeLabel}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
            <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
          </button>
        </div>
      </div>

      <header className="masthead">
        <div className="wrap masthead-brand">
          <a className="brand" href="#topo" translate="no">
            <Crown className="brand-mark" aria-hidden="true" strokeWidth={1.6} />
            <span>King&apos;s Economy</span>
          </a>
          <p className="masthead-tagline">A economia explicada do jeito que você entende.</p>
        </div>
      </header>

      <div className="sticky-bar">
        {/* Barra compacta de telas menores: menu, marca e tema. */}
        <div className="wrap appbar">
          <button
            ref={toggleRef}
            type="button"
            className="appbar-button"
            onClick={openDrawer}
            aria-label="Abrir menu"
            aria-haspopup="dialog"
            aria-controls="menu-gaveta"
          >
            <Menu aria-hidden="true" size={22} />
          </button>
          <a className="appbar-brand" href="#topo" translate="no">
            <Crown className="brand-mark" aria-hidden="true" strokeWidth={1.7} />
            <span>King&apos;s Economy</span>
          </a>
          <button
            type="button"
            className="appbar-button"
            onClick={onToggleTheme}
            aria-label={nextThemeLabel}
            title={nextThemeLabel}
          >
            {themeIcon}
          </button>
        </div>

        {/* Menu em linha de telas grandes. */}
        <nav className="section-nav" aria-label="Seções do portal">
          <div className="wrap">
            <ul>
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <a href={href}>
                    <Icon aria-hidden="true" size={16} strokeWidth={1.9} />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <StockTicker />
        <ReadingProgress />
      </div>

      <dialog ref={drawerRef} id="menu-gaveta" className="drawer" aria-labelledby="drawer-title">
        <div className="drawer-panel">
          <div className="drawer-head">
            <p id="drawer-title" className="drawer-brand" translate="no">
              <Crown className="brand-mark" aria-hidden="true" strokeWidth={1.7} />
              King&apos;s Economy
            </p>
            <button type="button" className="appbar-button" onClick={closeDrawer} aria-label="Fechar menu">
              <X aria-hidden="true" size={22} />
            </button>
          </div>
          <p className="drawer-date">{today}</p>

          <nav aria-label="Seções do portal, menu">
            <ul className="drawer-links">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <a href={href} onClick={(e) => goFromDrawer(e, href)}>
                    <span className="drawer-icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>

      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            })
          }
          aria-label="Voltar ao topo"
          title="Voltar ao topo"
        >
          <ArrowUp aria-hidden="true" size={20} />
        </button>
      )}
    </>
  );
};
