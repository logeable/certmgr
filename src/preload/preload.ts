import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld('msg', {
  ping: async () => {
    const result = await ipcRenderer.invoke('ping');
    return result;
  },
  status: async () => {
    const result = await ipcRenderer.invoke('status');
    return result;
  },
  path: async () => {
    const result = await ipcRenderer.invoke('path');
    return result;
  },
});
