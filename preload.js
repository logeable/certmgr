const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("msg", {
  ping: async () => {
    const result = await ipcRenderer.invoke("ping", "hello");
    return result;
  },
});
