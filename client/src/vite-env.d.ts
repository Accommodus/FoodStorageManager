/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly SERVER_URI?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
