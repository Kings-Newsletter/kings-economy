import React, { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { GLOSSARY_ENTRIES } from '../../data/economicContent';
import { SectionHead } from '../ui/RangeField';

const ALL = 'Todas';

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const GlossarySection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(GLOSSARY_ENTRIES.map((g) => g.category)))],
    []
  );

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return GLOSSARY_ENTRIES.filter(
      (entry) =>
        (category === ALL || entry.category === category) &&
        (!q ||
          normalize(entry.term).includes(q) ||
          normalize(entry.plainDefinition).includes(q) ||
          entry.relatedTerms.some((t) => normalize(t).includes(q)))
    );
  }, [query, category]);

  return (
    <section id="glossario" className="band" aria-labelledby="glossario-title">
      <div className="wrap">
        <SectionHead id="glossario-title" title="Glossário" icon={BookOpen}>
          Siglas e termos do noticiário econômico, explicados com exemplos do dia a dia.
        </SectionHead>

        <div className="glossary-tools">
          <label className="search">
            <Search aria-hidden="true" size={18} />
            <span className="sr-only">Buscar no glossário</span>
            <input
              type="search"
              name="glossario-busca"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar um termo, como Selic ou PIB…"
            />
          </label>
          <div className="chips" role="group" aria-label="Filtrar por assunto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className="chip"
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {results.length === 1 ? '1 termo encontrado' : `${results.length} termos encontrados`}
        </p>

        {results.length > 0 ? (
          <dl className="glossary">
            {results.map((entry) => (
              <div key={entry.term} className="glossary-entry">
                <dt>
                  {entry.term}
                  <span className="glossary-category">{entry.category}</span>
                </dt>
                <dd>
                  <p>{entry.plainDefinition}</p>
                  <p className="glossary-example">
                    <em>Exemplo:</em> {entry.practicalExample}
                  </p>
                  {entry.relatedTerms.length > 0 && (
                    <p className="glossary-related">
                      Ver também:{' '}
                      {entry.relatedTerms.map((rel, i) => (
                        <React.Fragment key={rel}>
                          {i > 0 && ', '}
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => {
                              setCategory(ALL);
                              setQuery(rel);
                            }}
                          >
                            {rel}
                          </button>
                        </React.Fragment>
                      ))}
                    </p>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="empty-state">
            Nenhum termo encontrado para “{query}”. Tente uma sigla, como IPCA, ou{' '}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setQuery('');
                setCategory(ALL);
              }}
            >
              limpe a busca
            </button>
            .
          </p>
        )}
      </div>
    </section>
  );
};
