<div align="center">

<img src="./public/favicon.svg" alt="King's Economy" width="96">

# King's Economy

### Brazil's economy, explained from scratch.

An economics news portal that teaches as it informs: live official indicators, B3 market data, daily economic news, and step-by-step lessons for people who never studied economics.

**English** · [Português (Brasil)](./README.pt-BR.md)

<br>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-News-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Serverless-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](./LICENSE)
[![CI](https://github.com/Kings-Newsletter/kings-economy/actions/workflows/ci.yml/badge.svg)](https://github.com/Kings-Newsletter/kings-economy/actions/workflows/ci.yml)
[![GitHub issues](https://img.shields.io/github/issues/Kings-Newsletter/kings-economy?style=flat-square)](https://github.com/Kings-Newsletter/kings-economy/issues)

</div>

---

## Contents

- [About](#about)
- [Features](#features)
- [Data sources](#data-sources)
- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [News API](#news-api)
- [Routes](#routes)
- [Quality checks](#quality-checks)
- [Security notes](#security-notes)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## About

King's Economy is the economics branch of [King's Newsletter](https://kingsnewsletter.com), with its own visual identity. It looks and reads like the economics section of a newspaper, but every page is written for beginners: technical terms open a plain-language definition, each section starts with a one-sentence summary, and calculators let readers test ideas with their own numbers.

The interface is in Brazilian Portuguese and is published as **King's Economy**.

**Explore:** [Source code](https://github.com/Kings-Newsletter/kings-economy) · [Report an issue](https://github.com/Kings-Newsletter/kings-economy/issues) · [King's Newsletter](https://kingsnewsletter.com)

## Features

- **Daily economic news** — the latest edition's headline on the home page, a news page with the full edition, an archive of previous editions, and a dedicated page for every story (summary, context, sources, and related stories).
- **Live official indicators** — Selic, 12-month IPCA, PTAX dollar, GDP, unemployment, and the primary fiscal result, each with its latest value, change, sparkline, and observation date.
- **B3 market ticker** — Ibovespa and the 20 most traded stocks in a sticky strip that scrolls automatically and manually (touch, wheel, drag, or arrow buttons), with a pause control.
- **Stock pages** — price and volume charts (5 days, 1 month, 3 months), daily figures explained in plain language, company profile, and official sources (company IR site, B3, CVM, Portal do Investidor, B3 Educação).
- **Currencies** — US dollar, euro, pound sterling, and bitcoin in reais, with 15-day history and intraday range.
- **"Economy from scratch" path** — seven short lessons, each with a one-sentence summary, an everyday example, and a quick quiz. Progress is saved in the browser.
- **Calculators** — personal inflation basket (styled as a receipt), monthly expense under inflation, loan installments (Price table), real interest rate (Fisher equation) with a chart, and Brazil's fiscal framework spending limit.
- **Inline glossary** — terms such as Selic, IPCA, GDP, and spread open their definition on tap, including inside news stories.
- **Responsive and accessible** — compact app bar and side drawer on phones and tablets, light and dark themes, keyboard navigation, visible focus, and reduced-motion support.

## Data sources

| Data | Source | Notes |
| --- | --- | --- |
| Selic, IPCA, PTAX, primary result, unemployment | [Banco Central do Brasil — SGS](https://www3.bcb.gov.br/sgspub/) | Public API, called from the browser |
| GDP | [IBGE — SIDRA](https://sidra.ibge.gov.br/) | Falls back to IBGE API v3 |
| Currencies and bitcoin | [AwesomeAPI](https://docs.awesomeapi.com.br/) | Free, no key |
| B3 quotes, history, and company profiles | [brapi](https://brapi.dev/) | Token optional; free plan limits apply |
| News | MongoDB collection shared with King's Newsletter | Read only on the server |

No value is invented. When a source does not respond, the item is shown as unavailable. The primary fiscal result series (SGS 5793) uses the public-sector borrowing requirement convention, where positive means deficit; the site translates it into "deficit" or "surplus".

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript (strict), Vite 6 |
| Styling | Hand-written CSS with design tokens, self-hosted fonts via Fontsource (Source Serif 4, Atkinson Hyperlegible Next) |
| Icons and charts | Lucide, native SVG charts |
| Server | Vercel serverless function (`api/noticias.ts`) |
| Data | MongoDB (official Node.js driver) |
| Quality | ESLint 9, TypeScript project references, GitHub Actions |

## Project structure

```text
.
├── api/
│   └── noticias.ts          # Vercel function: GET /api/noticias
├── server/
│   └── newsApi.ts           # MongoDB queries shared by Vercel and the Vite dev server
├── public/                  # Static assets (favicon)
├── src/
│   ├── components/
│   │   ├── layout/          # Header, side drawer, B3 ticker, footer
│   │   ├── sections/        # Home sections, news, story, and stock pages
│   │   └── ui/              # Fields, glossary terms, figures, indicator readings
│   ├── data/                # Editorial content, lessons, and glossary
│   ├── lib/                 # Data clients (BCB/IBGE, brapi, AwesomeAPI, news) and formatting
│   ├── App.tsx              # Hash-based routing
│   └── index.css            # Design tokens and all styles
├── .github/workflows/ci.yml # Lint, type check, and build
├── vercel.json
└── vite.config.ts           # Also serves /api/noticias during development
```

## Getting started

### Prerequisites

- [Node.js 20 or newer](https://nodejs.org/)
- A MongoDB connection string to show news (optional; the rest of the site works without it)
- A [brapi](https://brapi.dev/) token for the full B3 ticker and stock pages (optional)

### Installation

```bash
git clone https://github.com/Kings-Newsletter/kings-economy.git
cd kings-economy
npm install
cp .env.example .env
```

Fill in `.env` (see below), then start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server, including the local `/api/noticias` |
| `npm run build` | Type check (app, config, and server) and production build |
| `npm run typecheck` | Type check only |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_BRAPI_TOKEN` | No | brapi token. Without it, only the four demo stocks (PETR4, VALE3, ITUB4, MGLU3) are shown. |
| `MONGODB_URI` | For news | MongoDB connection string. Server only. |
| `MONGODB_DB` | For news | Database name. |
| `MONGODB_COLLECTION` | For news | Collection with the economic news (for example, `economia`). |

Variables prefixed with `VITE_` are embedded in the published JavaScript. MongoDB variables have no prefix and never reach the browser.

## News API

`GET /api/noticias` reads the configured collection. Documents follow the same shape as King's Newsletter's `news` collection (`title`, `summary`, `context`, `category`, `source`, `publishedAt`, `editionDate`, `url`, `headline`, `relatedSources`, `image`).

| Request | Response |
| --- | --- |
| `/api/noticias` | Latest edition: `{ date, stories }` |
| `/api/noticias?date=dd/mm/yyyy` | Edition for a date |
| `/api/noticias?history=true` | `{ editions: [{ date, stories }] }` |
| `/api/noticias?id=<ObjectId>` | `{ story, more }`, a full story and other stories from its edition |

Successful responses are cached by the CDN for 5 minutes; errors are never cached. Error messages never include database details.

## Routes

The site is a single page with hash routes, so it needs no server rewrites:

| Route | Page |
| --- | --- |
| `#/` and `#<section>` | Home and its sections |
| `#/noticias` | Latest edition |
| `#/noticias/dd-mm-yyyy` | Archived edition |
| `#/noticia/<id>` | Story page |
| `#/acao/<ticker>` | Stock page (for example, `#/acao/PETR4` or `#/acao/%5EBVSP`) |

## Quality checks

```bash
npm run lint
npm run build
```

GitHub Actions runs lint, type check, and build on every push and pull request to `main`.

## Security notes

- **brapi token:** the site has no server for market data, so `VITE_BRAPI_TOKEN` is visible in the published JavaScript and can be reused by anyone. The free plan allows 15,000 requests per month across all visitors; responses are cached in the browser for 15 minutes. To keep the token private, move brapi calls to a serverless function.
- **MongoDB:** accessed only by `server/newsApi.ts`. The repository ignores `.env` files; configure secrets in the hosting provider.
- **External content:** story links and images are validated as `http(s)` URLs, and image credits and licenses are shown as required by Creative Commons.

## Deployment

The project is ready for [Vercel](https://vercel.com/): Vite builds the frontend into `dist/`, and `api/noticias.ts` becomes a serverless function in the São Paulo region (`gru1`). Add `MONGODB_URI`, `MONGODB_DB`, `MONGODB_COLLECTION`, and optionally `VITE_BRAPI_TOKEN` under **Settings → Environment Variables** before deploying.

## Contributing

Bug reports and ideas are welcome. Please [open an issue](https://github.com/Kings-Newsletter/kings-economy/issues) before larger changes, and run `npm run lint` and `npm run build` before submitting a pull request. Educational content must stay accurate: never invent figures, and cite the official source.

## License

This project is licensed under the [MIT License](./LICENSE).

---

<div align="center">

Part of the <a href="https://kingsnewsletter.com">King's Newsletter</a> family.

</div>
