export {};

declare global {
  interface Namespace {
    id: string;
    name: string;
    desc: string;
    certCount: number;
    createdAt: number;
  }

  interface Window {
    api: {
      namespaces: {
        list: () => Promise<Namespace[]>;
        create: (name: string, desc: string) => Promise<{ id: string }>;
        edit: (id: string, name: string, desc: string) => Promise<Namespace>;
        delete: (id: string) => Promise<void>;
      };
    };
  }
}
