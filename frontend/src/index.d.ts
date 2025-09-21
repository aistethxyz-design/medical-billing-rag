// Type declarations for AISteth Medical Billing Platform

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

declare module '*.tiff' {
  const src: string;
  export default src;
}

// React Dropzone module declaration
declare module 'react-dropzone' {
  export interface DropzoneOptions {
    accept?: Record<string, string[]>;
    multiple?: boolean;
    maxSize?: number;
    onDrop?: (acceptedFiles: File[], rejectedFiles: any[]) => void;
    [key: string]: any;
  }

  export interface DropzoneState {
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    acceptedFiles: File[];
    rejectedFiles: any[];
    getRootProps: (props?: any) => any;
    getInputProps: (props?: any) => any;
  }

  export function useDropzone(options?: DropzoneOptions): DropzoneState;
}

// Global type augmentations
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

// React component types with more flexibility
declare namespace React {
  interface Component<P = {}, S = {}, SS = any> {
    refs: {
      [key: string]: ReactInstance;
    };
  }

  interface HTMLAttributes<T> {
    refKey?: string;
    [key: string]: any;
  }

  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    accept?: string;
    multiple?: boolean;
    [key: string]: any;
  }
}

export {};
