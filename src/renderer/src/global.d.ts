export {};

declare global {
  interface Window {
    msg: {
      status: () => Promise<{ status: string }>;
      ping: () => Promise<string>;
      path: () => Promise<{ cwd: string; app: string; dir: string }>;
    };
  }
}
