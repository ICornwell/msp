declare module 'vite/client' {
  export type ImportMetaEnv = {
    readonly VITE_API_BASE_URL: string;
    // more env variables...
  };

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
