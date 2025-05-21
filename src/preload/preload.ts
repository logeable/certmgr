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
});
