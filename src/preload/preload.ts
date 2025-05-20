import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('api', {
  namespaces: {
    list: async () => {
      const result = await ipcRenderer.invoke('namespaces:list');
      return result;
    },
    create: async (name: string) => {
      const result = await ipcRenderer.invoke('namespaces:create', name);
      return result;
    },
  },
});
