/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEFAULT_TAX_PERCENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
