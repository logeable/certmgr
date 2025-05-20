export {};

declare global {
  interface Window {
    api: {
      namespaces: {
        list: () => Promise<{ id: string; name: string }[]>;
        create: (name: string) => Promise<{ id: string }>;
      };
    };
  }
}
