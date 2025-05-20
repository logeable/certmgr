import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

async function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    await win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 可选：打开开发者工具
  // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  ipcMain.handle('ping', async (_event, _arg) => {
    const timeout = Math.floor(Math.random() * 3000) + 1000;
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('pong');
      }, timeout);
    });
  });

  ipcMain.handle('status', async (_event, _arg) => {
    const response = await fetch('http://localhost:8080/status');
    const data = await response.json();
    return data;
  });

  ipcMain.handle('path', async (_event, _arg) => {
    return {
      cwd: process.cwd(),
      app: app.getAppPath(),
      dir: __dirname,
    };
  });

  await createWindow();

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
