/**
 * Notícias de economia do King's Economia, ramificação da King's Newsletter.
 * Vêm da API própria /api/noticias (server/newsApi.ts), que lê a collection de economia
 * no MongoDB. O navegador nunca fala com o banco diretamente.
 */

import { useEffect, useState } from 'react';
import type { Loadable } from './marketData';

const ENDPOINT = '/api/noticias';
export const NEWSLETTER_URL = 'https://kingsnewsletter.com';

export interface StoryImage {
  url: string;
  alt: string;
  credit?: string;
  license?: string;
  licenseUrl?: string;
  sourceUrl?: string;
  width?: number | null;
  height?: number | null;
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  publishedAt: string;
  editionDate: string;
  url: string;
  headline: boolean;
  image: StoryImage | null;
}

export interface StoryFull extends Story {
  context: string;
  relatedSources: Array<{ name: string; url: string; publishedAt: string }>;
}

export interface Edition {
  /** null quando ainda não há nenhuma notícia publicada. */
  date: string | null;
  stories: Story[];
}

export interface EditionSummary {
  date: string;
  stories: number;
}

class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

const fetchJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!res.ok) throw new HttpError(res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
};

const memo = new Map<string, Promise<unknown>>();
const once = <T>(key: string, load: () => Promise<T>): Promise<T> => {
  if (!memo.has(key)) {
    memo.set(
      key,
      load().catch((e) => {
        memo.delete(key);
        throw e;
      })
    );
  }
  return memo.get(key) as Promise<T>;
};

export const loadEdition = (date?: string) =>
  once(`edition:${date ?? ''}`, () =>
    fetchJson<Edition>(date ? `${ENDPOINT}?date=${encodeURIComponent(date)}` : ENDPOINT)
  );

export const loadHistory = () =>
  once('history', async () => (await fetchJson<{ editions: EditionSummary[] }>(`${ENDPOINT}?history=true`)).editions);

export const loadStory = (id: string) =>
  once(`story:${id}`, () => fetchJson<{ story: StoryFull; more: Story[] }>(`${ENDPOINT}?id=${encodeURIComponent(id)}`));

const useLoad = <T>(key: string, load: () => Promise<T>): Loadable<T> & { notFound?: boolean } => {
  const [state, setState] = useState<Loadable<T> & { notFound?: boolean }>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    load()
      .then((data) => alive && setState({ status: 'ok', data }))
      .catch((e) => alive && setState({ status: 'error', notFound: e instanceof HttpError && (e.status === 404 || e.status === 400) }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
};

export const useEdition = (date?: string) => useLoad(`edition:${date ?? ''}`, () => loadEdition(date));
export const useHistory = () => useLoad('history', loadHistory);
export const useStory = (id: string) => useLoad(`story:${id}`, () => loadStory(id));

/** "11/11/2026" ⇄ "11-11-2026", para usar a data no endereço da página. */
export const dateToSlug = (date: string) => date.replace(/\//g, '-');
export const slugToDate = (slug: string) => (/^\d{2}-\d{2}-\d{4}$/.test(slug) ? slug.replace(/-/g, '/') : null);

export const newsHref = (date?: string) => (date ? `#/noticias/${dateToSlug(date)}` : '#/noticias');
export const storyHref = (id: string) => `#/noticia/${id}`;

/** "11/11/2026" → "11 de novembro de 2026". */
export const longDate = (date: string) => {
  const m = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]))));
};

export const editionLabel = (date: string) => `Edição de ${longDate(date)}`;
