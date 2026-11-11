import React, { useEffect, useRef, useState } from 'react';
import { StockPage } from './components/sections/StockPage';
import { NewsPage } from './components/sections/NewsPage';
import { StoryPage } from './components/sections/StoryPage';
import { HeadlineCard } from './components/sections/HeadlineCard';
import { slugToDate } from './lib/news';
import { Header, ThemeMode } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/sections/HeroSection';
import { BasicsTrail } from './components/sections/BasicsTrail';
import { EditorialSectionsGrid } from './components/sections/EditorialSectionsGrid';
import { IndicatorsPanel } from './components/sections/IndicatorsPanel';
import { DidacticAndAnalysisSection } from './components/sections/DidacticAndAnalysisSection';
import { EconomiaNoBolso } from './components/sections/EconomiaNoBolso';
import { ChartsAndComparator } from './components/sections/ChartsAndComparator';
import { PublicMoneySection } from './components/sections/PublicMoneySection';
import { GlossarySection } from './components/sections/GlossarySection';
import { IndicatorStrip } from './components/sections/IndicatorStrip';
import { BASIC_LESSONS } from './data/basics';
import { useIndicators } from './lib/useIndicators';
import { useMarket } from './lib/marketData';
import { MarketsSection } from './components/sections/MarketsSection';
import { EconomicSectionId } from './types/economy';

const THEME_KEY = 'ke-theme';

const readInitialTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* armazenamento indisponível: segue a preferência do sistema */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<EconomicSectionId | 'todas'>('todas');
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [lessonIndex, setLessonIndex] = useState(0);
  const readings = useIndicators();
  const market = useMarket();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* sem persistência, o tema vale só para esta visita */
    }
  }, [theme]);

  const openLesson = (index: number) =>
    setLessonIndex(Math.min(BASIC_LESSONS.length - 1, Math.max(0, index)));
  const clearSection = () => setActiveSection('todas');

  // Rotas por hash: "#/acao/PETR4" abre a página da ação; qualquer outro hash é uma seção.
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const stockSymbol = hash.startsWith('#/acao/') ? decodeURIComponent(hash.slice(7)).toUpperCase() : null;
  // "#/noticias" é a edição atual; "#/noticias/10-11-2026" é uma edição anterior.
  const newsMatch = hash.match(/^#\/noticias(?:\/(\d{2}-\d{2}-\d{4}))?\/?$/);
  const newsDate = newsMatch?.[1] ? slugToDate(newsMatch[1]) ?? undefined : undefined;
  // "#/noticia/<id>" é a página própria de uma notícia.
  const storyId = hash.match(/^#\/noticia\/([a-f0-9]{24})\/?$/i)?.[1] ?? null;
  const subPage = stockSymbol ? 'acao' : storyId ? 'noticia' : newsMatch ? 'noticias' : null;

  // Ao voltar da página da ação para uma seção, rola até ela depois de a página inicial montar.
  const wasStockRef = useRef(Boolean(subPage));
  useEffect(() => {
    if (subPage) {
      wasStockRef.current = true;
      // A página da notícia define o próprio título quando carrega.
      if (subPage === 'noticia') return;
      document.title =
        subPage === 'noticias'
          ? `Notícias${newsDate ? ` de ${newsDate}` : ''} | King's Economia`
          : `${stockSymbol?.startsWith('^') ? 'Ibovespa' : stockSymbol}: gráficos e números | King's Economia`;
      return;
    }
    document.title = "King's Economia";
    if (wasStockRef.current) {
      wasStockRef.current = false;
      requestAnimationFrame(() => {
        const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
        if (target) target.scrollIntoView();
        else window.scrollTo({ top: 0 });
      });
    }
  }, [subPage, stockSymbol, newsDate, hash]);

  const header = (
    <Header
      theme={theme}
      onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
    />
  );

  if (subPage === 'noticia' && storyId) {
    return (
      <>
        {header}
        <StoryPage id={storyId} />
        <Footer />
      </>
    );
  }

  if (subPage === 'noticias') {
    return (
      <>
        {header}
        <NewsPage date={newsDate} />
        <Footer />
      </>
    );
  }

  if (stockSymbol) {
    return (
      <>
        {header}
        <StockPage symbol={stockSymbol} />
        <Footer />
      </>
    );
  }

  return (
    <>
      {header}

      <IndicatorStrip readings={readings} market={market} />

      <main id="main" tabIndex={-1}>
        <HeadlineCard />
        <HeroSection onOpenLesson={openLesson} />
        <BasicsTrail lessonIndex={lessonIndex} onLessonChange={openLesson} />
        <EditorialSectionsGrid activeSection={activeSection} onSelectSection={setActiveSection} />
        <IndicatorsPanel
          activeSection={activeSection}
          onClearSection={clearSection}
          readings={readings}
        />
        <MarketsSection market={market} />
        <DidacticAndAnalysisSection activeSection={activeSection} onClearSection={clearSection} />
        <EconomiaNoBolso />
        <ChartsAndComparator readings={readings} />
        <PublicMoneySection />
        <GlossarySection />
      </main>

      <Footer />
    </>
  );
};

export default App;
