/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Opcional: e-mail tratado como master admin no cliente (alinhar ao banco). */
  readonly VITE_MASTER_ADMIN_EMAIL?: string
}
