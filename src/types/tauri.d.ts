// Tauri type definitions for window object
declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: any) => Promise<any>;
      convertFileSrc: (filePath: string, protocol?: string) => string;
    };
  }
}

export {};
