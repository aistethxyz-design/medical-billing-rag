declare module 'react-mermaid';

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PINECONE_API_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 