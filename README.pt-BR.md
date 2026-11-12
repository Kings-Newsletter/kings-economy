<div align="center">

<img src="./public/favicon.svg" alt="King's Economy" width="96">

# King's Economy

### A economia do Brasil, explicada do zero.

Um portal de notícias de economia que ensina enquanto informa: indicadores oficiais ao vivo, cotações da B3, notícias econômicas do dia e lições passo a passo para quem nunca estudou economia.

[English](./README.md) · **Português (Brasil)**

<br>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Not%C3%ADcias-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue?style=flat-square)](./LICENSE)
[![CI](https://github.com/Kings-Newsletter/kings-economy/actions/workflows/ci.yml/badge.svg)](https://github.com/Kings-Newsletter/kings-economy/actions/workflows/ci.yml)
[![Issues](https://img.shields.io/github/issues/Kings-Newsletter/kings-economy?style=flat-square)](https://github.com/Kings-Newsletter/kings-economy/issues)

</div>

---

## Sumário

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Fontes de dados](#fontes-de-dados)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como começar](#como-começar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [API de notícias](#api-de-notícias)
- [Rotas](#rotas)
- [Verificações de qualidade](#verificações-de-qualidade)
- [Segurança](#segurança)
- [Publicação](#publicação)
- [Como contribuir](#como-contribuir)
- [Licença](#licença)

## Sobre

O King's Economy é a ramificação de economia da [King's Newsletter](https://kingsnewsletter.com), com identidade visual própria. Tem a cara e o ritmo de leitura de uma seção de economia de jornal, mas cada página foi escrita para iniciantes: termos técnicos abrem uma definição simples, cada seção começa com um resumo "Em uma frase" e as calculadoras deixam o leitor testar as ideias com os próprios números.

A interface é em português do Brasil e é publicada como **King's Economy**.

**Explore:** [Código-fonte](https://github.com/Kings-Newsletter/kings-economy) · [Relatar um problema](https://github.com/Kings-Newsletter/kings-economy/issues) · [King's Newsletter](https://kingsnewsletter.com)

## Funcionalidades

- **Notícias econômicas do dia** — a manchete da edição mais recente na página inicial, uma página de notícias com a edição completa, o arquivo das edições anteriores e uma página própria para cada notícia (resumo, contexto, fontes e notícias relacionadas).
- **Indicadores oficiais ao vivo** — Selic, IPCA em 12 meses, dólar PTAX, PIB, desemprego e resultado primário, cada um com o último valor, a variação, um mini gráfico e a data da observação.
- **Faixa da bolsa (B3)** — o Ibovespa e as 20 ações mais negociadas numa faixa presa ao topo, que rola sozinha e à mão (toque, roda do mouse, arrastar ou setas), com botão de pausa.
- **Páginas de ações** — gráficos de preço e volume (5 dias, 1 mês, 3 meses), os números do dia explicados em linguagem simples, perfil da empresa e fontes oficiais (RI da empresa, B3, CVM, Portal do Investidor, B3 Educação).
- **Moedas** — dólar, euro, libra e bitcoin em reais, com histórico de 15 dias e mínima e máxima do dia.
- **Trilha "Economia do zero"** — sete lições curtas, cada uma com resumo em uma frase, exemplo do dia a dia e um teste rápido. O progresso fica salvo no navegador.
- **Calculadoras** — inflação da sua cesta (em formato de cupom fiscal), despesa mensal com inflação, parcela de financiamento (Tabela Price), juro real (equação de Fisher) com gráfico e limite de gastos do arcabouço fiscal.
- **Glossário no texto** — termos como Selic, IPCA, PIB e spread abrem a definição ao tocar, inclusive dentro das notícias.
- **Responsivo e acessível** — barra compacta e menu lateral no celular e no tablet, temas claro e escuro, navegação por teclado, foco visível e respeito à preferência de reduzir movimento.

## Fontes de dados

| Dado | Fonte | Observações |
| --- | --- | --- |
| Selic, IPCA, PTAX, resultado primário, desemprego | [Banco Central do Brasil — SGS](https://www3.bcb.gov.br/sgspub/) | API pública, consultada no navegador |
| PIB | [IBGE — SIDRA](https://sidra.ibge.gov.br/) | Usa a API v3 do IBGE como reserva |
| Moedas e bitcoin | [AwesomeAPI](https://docs.awesomeapi.com.br/) | Gratuita, sem chave |
| Cotações, histórico e perfil das empresas da B3 | [brapi](https://brapi.dev/) | Token opcional; valem os limites do plano gratuito |
| Notícias | Collection do MongoDB compartilhada com a King's Newsletter | Lida só no servidor |

Nenhum valor é inventado. Quando uma fonte não responde, o item aparece como indisponível. A série do resultado primário (SGS 5793) segue a convenção de necessidade de financiamento do setor público, em que positivo é déficit; o site traduz o número em "déficit" ou "superávit".

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript (strict), Vite 6 |
| Estilo | CSS próprio com tokens de design, fontes hospedadas via Fontsource (Source Serif 4, Atkinson Hyperlegible Next) |
| Ícones e gráficos | Lucide, gráficos em SVG nativo |
| Servidor | Função serverless da Vercel (`api/noticias.ts`) |
| Dados | MongoDB (driver oficial para Node.js) |
| Qualidade | ESLint 9, project references do TypeScript, GitHub Actions |

## Estrutura do projeto

```text
.
├── api/
│   └── noticias.ts          # Função da Vercel: GET /api/noticias
├── server/
│   └── newsApi.ts           # Consultas ao MongoDB, usadas pela Vercel e pelo Vite em desenvolvimento
├── public/                  # Arquivos estáticos (favicon)
├── src/
│   ├── components/
│   │   ├── layout/          # Cabeçalho, menu lateral, faixa da B3, rodapé
│   │   ├── sections/        # Seções da página inicial, notícias, notícia e ação
│   │   └── ui/              # Campos, termos do glossário, figuras, leituras de indicadores
│   ├── data/                # Conteúdo editorial, lições e glossário
│   ├── lib/                 # Clientes de dados (BCB/IBGE, brapi, AwesomeAPI, notícias) e formatação
│   ├── App.tsx              # Rotas por hash
│   └── index.css            # Tokens de design e todos os estilos
├── .github/workflows/ci.yml # Lint, checagem de tipos e build
├── vercel.json
└── vite.config.ts           # Também responde /api/noticias em desenvolvimento
```

## Como começar

### Pré-requisitos

- [Node.js 20 ou mais recente](https://nodejs.org/)
- Uma string de conexão do MongoDB para mostrar as notícias (opcional; o resto do site funciona sem ela)
- Um token da [brapi](https://brapi.dev/) para a faixa completa da B3 e as páginas de ações (opcional)

### Instalação

```bash
git clone https://github.com/Kings-Newsletter/kings-economy.git
cd kings-economy
npm install
cp .env.example .env
```

Preencha o `.env` (veja abaixo) e inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

### Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento, incluindo o `/api/noticias` local |
| `npm run build` | Checagem de tipos (app, configuração e servidor) e build de produção |
| `npm run typecheck` | Só a checagem de tipos |
| `npm run lint` | ESLint |
| `npm run preview` | Pré-visualiza o build de produção |

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `VITE_BRAPI_TOKEN` | Não | Token da brapi. Sem ele, só as quatro ações de demonstração (PETR4, VALE3, ITUB4, MGLU3). |
| `MONGODB_URI` | Para notícias | String de conexão do MongoDB. Só no servidor. |
| `MONGODB_DB` | Para notícias | Nome do banco. |
| `MONGODB_COLLECTION` | Para notícias | Collection com as notícias de economia (por exemplo, `economia`). |

Variáveis com o prefixo `VITE_` vão para o JavaScript publicado. As do MongoDB não têm prefixo e nunca chegam ao navegador.

## API de notícias

`GET /api/noticias` lê a collection configurada. Os documentos seguem o mesmo formato da collection `news` da King's Newsletter (`title`, `summary`, `context`, `category`, `source`, `publishedAt`, `editionDate`, `url`, `headline`, `relatedSources`, `image`).

| Requisição | Resposta |
| --- | --- |
| `/api/noticias` | Edição mais recente: `{ date, stories }` |
| `/api/noticias?date=dd/mm/aaaa` | Edição de uma data |
| `/api/noticias?history=true` | `{ editions: [{ date, stories }] }` |
| `/api/noticias?id=<ObjectId>` | `{ story, more }`, a notícia completa e outras da mesma edição |

Respostas de sucesso ficam 5 minutos no cache da CDN; erros nunca ficam guardados. As mensagens de erro nunca incluem detalhes do banco.

## Rotas

O site é uma página única com rotas por hash, então não precisa de regras de reescrita no servidor:

| Rota | Página |
| --- | --- |
| `#/` e `#<seção>` | Página inicial e suas seções |
| `#/noticias` | Edição mais recente |
| `#/noticias/dd-mm-aaaa` | Edição do arquivo |
| `#/noticia/<id>` | Página da notícia |
| `#/acao/<código>` | Página da ação (por exemplo, `#/acao/PETR4` ou `#/acao/%5EBVSP`) |

## Verificações de qualidade

```bash
npm run lint
npm run build
```

O GitHub Actions roda lint, checagem de tipos e build a cada push e pull request para a `main`.

## Segurança

- **Token da brapi:** o site não tem servidor para os dados de mercado, então o `VITE_BRAPI_TOKEN` fica visível no JavaScript publicado e pode ser reutilizado por qualquer pessoa. O plano gratuito permite 15 mil requisições por mês, somando todos os visitantes; as respostas ficam 15 minutos em cache no navegador. Para manter o token privado, leve as chamadas da brapi para uma função serverless.
- **MongoDB:** acessado só por `server/newsApi.ts`. O repositório ignora os arquivos `.env`; configure os segredos no provedor de hospedagem.
- **Conteúdo externo:** links e imagens das notícias são validados como URLs `http(s)`, e o crédito e a licença das fotos aparecem como exigem as licenças Creative Commons.

## Publicação

O projeto está pronto para a [Vercel](https://vercel.com/): o Vite gera o frontend em `dist/` e `api/noticias.ts` vira uma função serverless na região de São Paulo (`gru1`). Antes de publicar, cadastre `MONGODB_URI`, `MONGODB_DB`, `MONGODB_COLLECTION` e, se quiser, `VITE_BRAPI_TOKEN` em **Settings → Environment Variables**.

## Como contribuir

Relatos de problemas e ideias são bem-vindos. [Abra uma issue](https://github.com/Kings-Newsletter/kings-economy/issues) antes de mudanças maiores e rode `npm run lint` e `npm run build` antes de enviar um pull request. O conteúdo educativo precisa continuar correto: nunca invente números e cite a fonte oficial.

## Licença

Este projeto está sob a [Licença MIT](./LICENSE).

---

<div align="center">

Parte da família <a href="https://kingsnewsletter.com">King's Newsletter</a>.

</div>
