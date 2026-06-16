/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_NASA_API_KEY: string;
  readonly VITE_MARSVISTA_API_KEY?: string;
  readonly VITE_MULTIPLAYER_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
