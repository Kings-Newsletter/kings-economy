/**
 * Função da Vercel: GET /api/noticias. Toda a lógica está em server/newsApi.ts.
 * As variáveis MONGODB_URI, MONGODB_DB e MONGODB_COLLECTION precisam estar
 * cadastradas no projeto da Vercel (Settings > Environment Variables).
 */
// Extensão .js: o projeto é ESM ("type": "module") e o Node exige o caminho completo.
import { cacheHeader, handleNewsRequest } from '../server/newsApi.js';

interface Req {
  method?: string;
  query: Record<string, string | string[] | undefined>;
}
interface Res {
  setHeader(name: string, value: string): void;
  status(code: number): { json(body: unknown): void };
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const query = Object.fromEntries(
    Object.entries(req.query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  );
  const result = await handleNewsRequest(query, process.env);
  res.setHeader('Cache-Control', cacheHeader(result.cache));
  return res.status(result.status).json(result.body);
}
