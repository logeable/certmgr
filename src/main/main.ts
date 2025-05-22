import { ChildProcess, spawn } from 'child_process';
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

async function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
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

async function startServer() {
  const path = join(app.getAppPath(), '../bin/server');
  const server = spawn(path);
  return new Promise<{ port: number; process: ChildProcess }>((resolve, reject) => {
    const returnPort = 0;

    setTimeout(() => {
      if (returnPort === 0) {
        server.kill();
        reject(new Error('server start timeout'));
      }
    }, 5000);

    server.stdout.on('data', data => {
      if (data.toString().includes('http server started on')) {
        const port = data.toString().split(':')[2].trim();
        console.log(`http server started on http://localhost:${port}`);
        resolve({ port: Number(port), process: server });
      }
      console.log(`server output: ${data.toString()}`);
    });
    server.stderr.on('data', data => {
      console.error(`server error: ${data.toString()}`);
    });
    server.on('close', () => {
      console.log('server closed');
    });
  });
}

app.whenReady().then(async () => {
  let serverPort = 8080;
  let serverProcess: ChildProcess | null = null;

  if (process.env.NODE_ENV !== 'development') {
    const { port, process } = await startServer();
    serverPort = port;
    serverProcess = process;
  }

  handleIPC(`http://localhost:${serverPort}/api/v1`);

  await createWindow();

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });

  app.on('before-quit', function () {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  app.on('window-all-closed', function () {
    app.quit();
  });
});

function handleIPC(serverBaseURL: string) {
  ipcMain.handle('namespaces:list', async () => {
    const response = await fetch(`${serverBaseURL}/namespaces/`);
    const data = await response.json();
    return data;
  });

  ipcMain.handle('namespaces:create', async (_, name: string, desc: string) => {
    const response = await fetch(`${serverBaseURL}/namespaces/`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ name, desc }),
    });
    const data = await response.json();
    return data;
  });

  ipcMain.handle('namespaces:edit', async (_, { id, name, desc }) => {
    const response = await fetch(`${serverBaseURL}/namespaces/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'PUT',
      body: JSON.stringify({ name, desc }),
    });
    const data = await response.json();
    return data;
  });

  ipcMain.handle('namespaces:delete', async (_, id: string) => {
    const response = await fetch(`${serverBaseURL}/namespaces/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  });

  ipcMain.handle('certificates:list', async (_, namespaceId: string) => {
    const response = await fetch(`${serverBaseURL}/certificates/?namespace_id=${namespaceId}`);
    const data = await response.json();
    return data;
  });

  ipcMain.handle(
    'certificates:create',
    async (
      _,
      params: {
        namespaceId: string;
        issuerId: number;
        keyType: string;
        keyLen: number;
        validDays: number;
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
      },
    ) => {
      const response = await fetch(`${serverBaseURL}/certificates/`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(params),
      });
      const data = await response.json();
      return data;
    },
  );

  ipcMain.handle('certificates:delete', async (_, certId: number) => {
    const response = await fetch(`${serverBaseURL}/certificates/${certId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  });

  ipcMain.handle('certificates:renew', async (_, certId: number, validDays: number) => {
    const response = await fetch(`${serverBaseURL}/certificates/${certId}/renew`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ validDays: validDays }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error);
    }
    const data = await response.json();
    return data;
  });
}
