import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('api', {
  namespaces: {
    list: async () => {
      const result = await ipcRenderer.invoke('namespaces:list');
      return result;
    },
    create: async (name: string, desc: string) => {
      const result = await ipcRenderer.invoke('namespaces:create', name, desc);
      return result;
    },
    edit: async (id: string, name: string, desc: string) => {
      const result = await ipcRenderer.invoke('namespaces:edit', { id, name, desc });
      return result;
    },
    delete: async (id: string) => {
      const result = await ipcRenderer.invoke('namespaces:delete', id);
      return result;
    },
  },
  certificates: {
    list: async (namespaceId: string) => {
      const result = await ipcRenderer.invoke('certificates:list', namespaceId);
      return result;
    },
    create: async (params: {
      namespaceId: string;
      issuerId: number;
      keyType: string;
      keyLen: string;
      validDays: string;
      desc: string;
      subject: {
        country: string;
        state: string;
        city: string;
        org: string;
        ou: string;
        commonName: string;
        email: string;
      };
    }) => {
      const result = await ipcRenderer.invoke('certificates:create', params);
      return result;
    },
    delete: async (certId: number) => {
      const result = await ipcRenderer.invoke('certificates:delete', certId);
      return result;
    },
    renew: async (certId: number, validDays: number) => {
      const result = await ipcRenderer.invoke('certificates:renew', certId, validDays);
      return result;
    },
  },
});
