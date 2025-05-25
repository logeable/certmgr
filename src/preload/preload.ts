import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('request_server', (channel: string, ...args: unknown[]) => {
  return ipcRenderer.invoke(channel, ...args);
});
