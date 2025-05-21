export {};

declare global {
  interface Namespace {
    id: string;
    name: string;
    desc: string;
    certCount: number;
    createdAt: number;
  }

  interface Certificate {
    id: string;
    desc: string;
    certPem: string;
    keyPem: string;
    updatedAt: number;
    createdAt: number;
    subject: string;
    issuerId: number;
  }
  interface Window {
    api: {
      namespaces: {
        list: () => Promise<Namespace[]>;
        create: (name: string, desc: string) => Promise<{ id: string }>;
        edit: (id: string, name: string, desc: string) => Promise<Namespace>;
        delete: (id: string) => Promise<void>;
      };
      certificates: {
        list: (namespaceId: string) => Promise<Certificate[]>;
        createRoot: (params: {
          namespaceId: string;
          issuerId: number;
          keyType: string;
          keyLen: number;
          validDays: number;
          remark: string;
          subject: {
            country: string;
            state: string;
            city: string;
            org: string;
            ou: string;
            commonName: string;
            email: string;
          };
        }) => Promise<Certificate>;
      };
    };
  }
}
