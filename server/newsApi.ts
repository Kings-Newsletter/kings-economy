/**
 * API de notícias do King's Economia, lida direto do MongoDB.
 * Roda só no servidor: na Vercel como função (api/noticias.ts) e, em desenvolvimento,
 * dentro do Vite (vite.config.ts). A string de conexão nunca chega ao navegador.
 *
 * Variáveis (arquivo .env): MONGODB_URI, MONGODB_DB e MONGODB_COLLECTION.
 * Os documentos seguem o mesmo formato da collection "news" da King's Newsletter.
 *
 *   GET /api/noticias                     edição mais recente
 *   GET /api/noticias?date=dd/mm/aaaa     edição de uma data
 *   GET /api/noticias?history=true        lista de edições
 *   GET /api/noticias?id=<ObjectId>       uma notícia completa, com outras da mesma edição
 */

import { MongoClient, ObjectId, type Collection, type Document } from 'mongodb';

export interface NewsEnv {
  MONGODB_URI?: string;
  MONGODB_DB?: string;
  MONGODB_COLLECTION?: string;
}

export interface ApiResult {
  status: number;
  body: unknown;
  cache: 'public' | 'none';
}

const DATE_RE = /^\d{2}\/\d{2}\/\d{4}$/;
const ID_RE = /^[a-f0-9]{24}$/i;

// Reaproveita a conexão entre chamadas da mesma instância (padrão recomendado em funções).
const globalForMongo = globalThis as unknown as { __keMongo?: Promise<MongoClient>; __keMongoUri?: string };

const getCollection = async (env: NewsEnv): Promise<Collection<Document>> => {
  const { MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION } = env;
  if (!MONGODB_URI || !MONGODB_DB || !MONGODB_COLLECTION) {
    throw Object.assign(new Error('Banco de dados não configurado.'), { code: 'NOT_CONFIGURED' });
  }
  if (!globalForMongo.__keMongo || globalForMongo.__keMongoUri !== MONGODB_URI) {
    globalForMongo.__keMongoUri = MONGODB_URI;
    globalForMongo.__keMongo = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
    })
      .connect()
      .catch((e) => {
        globalForMongo.__keMongo = undefined;
        throw e;
      });
  }
  const client = await globalForMongo.__keMongo;
  return client.db(MONGODB_DB).collection(MONGODB_COLLECTION);
};

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const httpUrl = (v: unknown) => {
  const s = text(v);
  return /^https?:\/\//i.test(s) ? s : '';
};

/** Campos públicos de uma notícia; nada interno (chaves de deduplicação, datas de checagem…). */
const toPublic = (d: Document, full: boolean) => {
  const img = d.image && typeof d.image === 'object' ? d.image : null;
  const imageUrl = img ? httpUrl(img.url) : '';
  return {
    id: String(d._id),
    title: text(d.title),
    summary: text(d.summary),
    ...(full ? { context: text(d.context) } : {}),
    category: text(d.category),
    source: text(d.source) || text(d.sourceName),
    publishedAt: text(d.publishedAt),
    editionDate: text(d.editionDate),
    url: httpUrl(d.url),
    headline: Boolean(d.headline),
    image: imageUrl
      ? {
          url: imageUrl,
          alt: text(img?.alt) || text(d.title),
          credit: text(img?.credit) || text(img?.attribution),
          license: text(img?.license),
          licenseUrl: httpUrl(img?.licenseUrl),
          sourceUrl: httpUrl(img?.source),
          width: Number(img?.width) || null,
          height: Number(img?.height) || null,
        }
      : null,
    ...(full
      ? {
          relatedSources: (Array.isArray(d.relatedSources) ? d.relatedSources : [])
            .map((r: Document) => ({
              name: text(r?.name),
              url: httpUrl(r?.url),
              publishedAt: text(r?.publishedAt),
            }))
            .filter((r: { name: string; url: string }) => r.name && r.url),
        }
      : {}),
  };
};

const VALID = { title: { $type: 'string', $ne: '' }, url: { $regex: /^https?:\/\//i } };

// editionDate é texto "dd/mm/aaaa"; para ordenar, vira data.
const editionSortStage = {
  $addFields: {
    _editionSort: {
      $dateFromString: { dateString: '$editionDate', format: '%d/%m/%Y', onError: null, onNull: null },
    },
  },
};

const latestDate = async (col: Collection<Document>) => {
  const rows = await col
    .aggregate([
      { $match: VALID },
      editionSortStage,
      { $match: { _editionSort: { $ne: null } } },
      { $sort: { _editionSort: -1 } },
      { $limit: 1 },
      { $project: { _id: 0, editionDate: 1 } },
    ])
    .toArray();
  return (rows[0]?.editionDate as string | undefined) ?? null;
};

const editionStories = (col: Collection<Document>, date: string) =>
  col
    .aggregate([
      { $match: { ...VALID, editionDate: date } },
      { $sort: { headline: -1, createdAt: -1, _id: -1 } },
    ])
    .toArray();

export const handleNewsRequest = async (
  query: Record<string, string | undefined>,
  env: NewsEnv
): Promise<ApiResult> => {
  try {
    const col = await getCollection(env);

    if (query.id !== undefined) {
      if (!ID_RE.test(query.id)) return { status: 400, body: { error: 'Notícia inválida.' }, cache: 'none' };
      const doc = await col.findOne({ _id: new ObjectId(query.id), ...VALID });
      if (!doc) return { status: 404, body: { error: 'Notícia não encontrada.' }, cache: 'none' };
      const date = text(doc.editionDate);
      const siblings = date ? await editionStories(col, date) : [];
      return {
        status: 200,
        body: {
          story: toPublic(doc, true),
          more: siblings.filter((s) => String(s._id) !== String(doc._id)).slice(0, 6).map((s) => toPublic(s, false)),
        },
        cache: 'public',
      };
    }

    if (query.history === 'true') {
      const rows = await col
        .aggregate([
          { $match: VALID },
          editionSortStage,
          { $match: { _editionSort: { $ne: null } } },
          { $group: { _id: '$editionDate', stories: { $sum: 1 }, _sort: { $max: '$_editionSort' } } },
          { $sort: { _sort: -1 } },
          { $limit: 365 },
          { $project: { _id: 0, date: '$_id', stories: 1 } },
        ])
        .toArray();
      return { status: 200, body: { editions: rows }, cache: 'public' };
    }

    let date = query.date;
    if (date !== undefined && !DATE_RE.test(date)) {
      return { status: 400, body: { error: 'Data inválida. Use dd/mm/aaaa.' }, cache: 'none' };
    }
    if (!date) {
      const latest = await latestDate(col);
      if (!latest) return { status: 200, body: { date: null, stories: [] }, cache: 'public' };
      date = latest;
    }
    const stories = await editionStories(col, date);
    return {
      status: 200,
      body: { date, stories: stories.map((s) => toPublic(s, false)) },
      cache: 'public',
    };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === 'NOT_CONFIGURED') {
      return { status: 503, body: { error: 'O banco de notícias ainda não foi configurado.' }, cache: 'none' };
    }
    // Nunca devolve a mensagem crua: ela pode conter o endereço do banco.
    console.error('[api/noticias]', (error as Error).name);
    return { status: 500, body: { error: 'Não foi possível consultar as notícias agora.' }, cache: 'none' };
  }
};

/** Cabeçalho de cache: a CDN guarda por 5 minutos; erros nunca ficam guardados. */
export const cacheHeader = (cache: ApiResult['cache']) =>
  cache === 'public' ? 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600' : 'no-store';
