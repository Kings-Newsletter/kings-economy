import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Em desenvolvimento, o próprio Vite responde /api/noticias com o mesmo código da função
 * da Vercel (server/newsApi.ts). As variáveis do MongoDB vêm do .env e ficam só no
 * servidor: sem o prefixo VITE_, o Vite não as coloca no JavaScript do navegador.
 * Variáveis já definidas no processo têm prioridade sobre o arquivo.
 */
/**
 * O site é publicado em kingsnewsletter.com/economy: o projeto da King's Newsletter
 * repassa /economy/* para este projeto (rewrite no vercel.json de lá). Por isso todos os
 * arquivos e a API ficam sob /economy/, inclusive no dev.
 */
const BASE = '/economy/';

const newsApiDev =(env: Record<string, string>): Plugin => ({
  name: 'kings-economia-news-api',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(`${BASE}api/noticias`, async (req, res) => {
      try {
        const mod = await server.ssrLoadModule('/server/newsApi.ts');
        const url = new URL(req.url ?? '/', 'http://localhost');
        const query = Object.fromEntries(url.searchParams.entries());
        const result = await mod.handleNewsRequest(query, {
          MONGODB_URI: process.env.MONGODB_URI ?? env.MONGODB_URI,
          MONGODB_DB: process.env.MONGODB_DB ?? env.MONGODB_DB,
          MONGODB_COLLECTION: process.env.MONGODB_COLLECTION ?? env.MONGODB_COLLECTION,
        });
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', mod.cacheHeader(result.cache));
        res.end(JSON.stringify(result.body));
      } catch {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Não foi possível consultar as notícias agora.' }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: BASE,
    plugins: [react(), newsApiDev(env)],
    server: {
      port: 5173,
      open: false,
    },
  };
});
