export interface Namespace {
  id: string;
  name: string;
  desc: string;
  certCount: number;
  createdAt: number;
}

export interface Certificate {
  id: number;
  desc: string;
  certPem: string;
  keyPem: string;
  updatedAt: number;
  createdAt: number;
  subject: string;
  issuerId: number;
  isCA: boolean;
}

export interface CertificateDetail extends Certificate {
  issuerSubject: string;
  keyType: string;
  keyLen: number;
  eccCurve: string;
  validDays: number;
  notBefore: number;
  notAfter: number;
  keyUsage: string[];
  extKeyUsage: string[];
  dnsNames: string[];
  ipAddresses: string[];
}

const api = {
  namespaces: {
    list: async () => {
      const res = await window.request_server<Namespace[]>('namespaces:list');
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    get: async (id: string) => {
      const res = await window.request_server<Namespace>('namespaces:get', id);
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    create: async (name: string, desc: string) => {
      const res = await window.request_server<{ id: number }>('namespaces:create', { name, desc });
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    update: async (id: string, name: string, desc: string) => {
      const res = await window.request_server<Namespace>('namespaces:update', id, { name, desc });
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    delete: async (id: string) => {
      const res = await window.request_server<void>('namespaces:delete', id);
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
  },
  certificates: {
    list: async (namespaceId: string) => {
      const res = await window.request_server<Certificate[]>('certificates:list', namespaceId);
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    create: async (
      namespaceId: string,
      issuerId: number,
      keyType: string,
      keyLen: number,
      eccCurve: string,
      validDays: number,
      desc: string,
      subject: {
        country: string;
        state: string;
        city: string;
        org: string;
        ou: string;
        commonName: string;
      },
      usage: {
        digitalSignature: boolean;
        keyEncipherment: boolean;
        keyCertSign: boolean;
        cRLSign: boolean;
      },
      extendedUsage: {
        serverAuth: boolean;
        clientAuth: boolean;
        codeSigning: boolean;
      },
      basicConstraints: {
        ca: boolean;
      },
      dnsNames: string[],
      ipAddresses: string[],
    ) => {
      const res = await window.request_server<Certificate>('certificates:create', {
        namespaceId,
        issuerId,
        keyType,
        keyLen,
        eccCurve,
        validDays,
        desc,
        subject,
        usage,
        extendedUsage,
        basicConstraints,
        dnsNames,
        ipAddresses,
      });
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    delete: async (certId: number) => {
      const res = await window.request_server<void>('certificates:delete', certId);
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    renew: async (certId: number, validDays: number) => {
      const res = await window.request_server<void>('certificates:renew', certId, {
        validDays,
      });
      if (res.success) {
        return res.data;
      }
      throw new Error(res.error);
    },
    get: async (certId: number) => {
      const res = await window.request_server<CertificateDetail>('certificates:get', certId);
      if (res.success) {
        return res.data;
      }
    },
  },
};
export default api;
