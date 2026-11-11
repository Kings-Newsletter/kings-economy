import React from 'react';
import { Crown } from 'lucide-react';
import { NAV_LINKS } from './Header';

export const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="wrap site-footer-inner">
      <div className="site-footer-about">
        <p className="brand" translate="no">
          <Crown className="brand-mark" aria-hidden="true" strokeWidth={1.6} />
          <span>King&apos;s Economia</span>
        </p>
        <p>
          Economia explicada em linguagem direta, do básico ao noticiário. A metodologia de cada
          indicador segue as publicações do Banco Central do Brasil, do IBGE e do Tesouro
          Nacional. As calculadoras são educativas e não substituem orientação financeira.
        </p>
      </div>
      <nav aria-label="Seções do portal, rodapé">
        <ul className="site-footer-links">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <a href={href}>
                <Icon aria-hidden="true" size={16} />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p className="site-footer-copy">&copy; {new Date().getFullYear()} King&apos;s Economia</p>
    </div>
  </footer>
);
