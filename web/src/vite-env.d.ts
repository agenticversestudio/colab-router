/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_DEFAULT_USER_ID?: string;
  readonly VITE_DEFAULT_PASSKEY?: string;
  readonly VITE_DEFAULT_API_KEY?: string;
  readonly VITE_GROQ_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
