import React from 'react';
import {
  ChevronRight,
  Clock,
  CreditCard,
  GraduationCap,
  Landmark,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react';
import { BASIC_LESSONS } from '../../data/basics';
import { Term } from '../ui/Term';

interface HeroSectionProps {
  onOpenLesson: (index: number) => void;
}

const CHAIN = [
  { icon: Landmark, text: 'O Banco Central sobe a Selic' },
  { icon: CreditCard, text: 'Empréstimos e parcelas ficam mais caros' },
  { icon: ShoppingCart, text: 'As pessoas compram menos a prazo' },
  { icon: TrendingDown, text: 'Os preços passam a subir mais devagar' },
];

const COMMON_QUESTIONS: Array<{ question: string; lessonId: string }> = [
  { question: 'Por que o mesmo dinheiro compra cada vez menos?', lessonId: 'inflacao' },
  { question: 'O que é a Selic e por que ela aparece tanto no jornal?', lessonId: 'selic' },
  { question: 'Por que o dólar mexe até no preço do pão?', lessonId: 'cambio' },
  { question: 'O que quer dizer “o PIB cresceu”?', lessonId: 'pib' },
  { question: 'Para onde vai o imposto que eu pago?', lessonId: 'governo-impostos' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenLesson }) => (
  <section className="lead" aria-labelledby="lead-title">
    <div className="wrap lead-grid">
      <article className="lead-story">
        <p className="story-tag">
          <GraduationCap aria-hidden="true" size={16} /> Explicador para iniciantes
        </p>
        <h1 id="lead-title">Por que tudo fica mais caro? Entenda a economia do zero.</h1>
        <p className="lead-deck">
          Inflação, <Term entry="Selic">Selic</Term>, dólar e <Term entry="PIB">PIB</Term>{' '}
          aparecem todo dia no noticiário e mexem no seu bolso. Aqui cada ideia é explicada em
          frases curtas, com exemplos do supermercado, da conta de luz e da parcela do cartão.
        </p>
        <p className="story-meta">
          <Clock aria-hidden="true" size={15} /> {BASIC_LESSONS.length} lições curtas, cerca de 2
          minutos cada
        </p>
        <div className="lead-actions">
          <a className="button button-primary" href="#do-zero" onClick={() => onOpenLesson(0)}>
            Começar do zero
          </a>
          <a className="button" href="#no-bolso">
            Calcular minha inflação
          </a>
        </div>

        <figure className="chain" aria-labelledby="chain-caption">
          <ol>
            {CHAIN.map(({ icon: Icon, text }, i) => (
              <li key={text} style={{ '--i': i } as React.CSSProperties}>
                <span className="chain-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
          <figcaption id="chain-caption">
            Como a decisão sobre os juros chega ao preço do supermercado. Segundo o Banco Central,
            o efeito completo leva de 6 a 18 meses.
          </figcaption>
        </figure>
      </article>

      <aside className="lead-aside" aria-labelledby="questions-title">
        <h2 id="questions-title">Perguntas que todo mundo faz</h2>
        <ul>
          {COMMON_QUESTIONS.map(({ question, lessonId }) => {
            const index = BASIC_LESSONS.findIndex((l) => l.id === lessonId);
            return (
              <li key={lessonId}>
                <a href="#do-zero" onClick={() => onOpenLesson(index)}>
                  <span>{question}</span>
                  <ChevronRight aria-hidden="true" size={18} />
                </a>
              </li>
            );
          })}
        </ul>
        <p className="lead-aside-note">
          Os indicadores da faixa no topo são consultados direto no Banco Central e no IBGE quando
          você abre a página, sempre com a data do dado. As calculadoras usam os números que você
          informar.
        </p>
      </aside>
    </div>
  </section>
);
