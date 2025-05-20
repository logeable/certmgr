const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 加载前端页面（假设前端构建产物在 dist 目录）
  win.loadFile("index.html");

  // 可选：打开开发者工具
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle("ping", async (event, arg) => {
    console.log(arg);

    return "pong";
  });
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
