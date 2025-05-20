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
    await win.loadURL('http://localhost:5173');
  } else {
    await win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 可选：打开开发者工具
  // win.webContents.openDevTools();
}

app.whenReady().then(async () => {
  ipcMain.handle('ping', async (event, arg) => {
    console.log(arg);

    return 'pong';
  });
  await createWindow();

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
