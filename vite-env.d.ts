interface ImportMetaEnv {
  readonly VITE_DATABASE_URL: string;
  readonly VITE_N8N_WEBHOOK_URL: string;
  readonly VITE_N8N_WEBHOOK_SECRET: string;
  readonly VITE_ADMIN_USER?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
