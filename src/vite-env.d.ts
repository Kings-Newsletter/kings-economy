/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Token da brapi, definido em .env.local. Opcional: sem ele, só as ações de demonstração. */
  readonly VITE_BRAPI_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
