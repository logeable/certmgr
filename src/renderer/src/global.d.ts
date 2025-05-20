export {};

declare global {
  interface Window {
    msg: {
      ping: () => Promise<string>;
    };
  }
}
