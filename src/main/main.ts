import { ChildProcess, spawn } from 'child_process';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { URLSearchParams } from 'url';
import logger from './logger';
import { writeFile } from 'fs/promises';

async function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
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
        logger.info(`http server started on http://localhost:${port}`);
        resolve({ port: Number(port), process: server });
      }
      logger.info(`server output: ${data.toString()}`);
    });
    server.stderr.on('data', data => {
      logger.error(`server error: ${data.toString()}`);
    });
    server.on('close', () => {
      logger.info('server closed');
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
  function handleWrapper(channel: string, handler: (...args: unknown[]) => Promise<unknown>) {
    ipcMain.handle(channel, async (...args) => {
      const [_event, ...rest] = args;
      logger.debug(`handle IPC`, { channel, args: rest });
      try {
        const data = await handler(...rest);
        logger.debug(`handle IPC success`, { channel, data });
        return { success: true, data };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`handle IPC error`, { channel, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    });
  }

  async function handleResponse(response: Promise<Response>) {
    const res = await response;
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error);
    }
    if (res.status === 204) {
      return null;
    }
    return res.json();
  }

  async function doGet(path: string) {
    return await handleResponse(fetch(`${serverBaseURL}/${path}`));
  }

  async function doPost(path: string, body: unknown) {
    return await handleResponse(
      fetch(`${serverBaseURL}/${path}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  }

  async function doPut(path: string, body: unknown) {
    return await handleResponse(
      fetch(`${serverBaseURL}/${path}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    );
  }

  async function doDelete(path: string) {
    return await handleResponse(fetch(`${serverBaseURL}/${path}`, { method: 'DELETE' }));
  }

  handleWrapper('namespaces:list', async () => {
    return await doGet('namespaces/');
  });

  handleWrapper('namespaces:get', async (...args: unknown[]) => {
    const [id] = args;
    return await doGet(`namespaces/${id}`);
  });

  handleWrapper('namespaces:create', async (...args: unknown[]) => {
    const [body] = args;
    return await doPost('namespaces/', body);
  });

  handleWrapper('namespaces:update', async (...args: unknown[]) => {
    const [id, body] = args;
    return await doPut(`namespaces/${id}`, body);
  });

  handleWrapper('namespaces:delete', async (...args: unknown[]) => {
    const [id] = args;
    return await doDelete(`namespaces/${id}`);
  });

  handleWrapper('certificates:list', async (...args: unknown[]) => {
    const [namespaceId] = args;
    return await doGet(
      `certificates/?${new URLSearchParams({ namespaceId: String(namespaceId) })}`,
    );
  });

  handleWrapper('certificates:create', async (...args: unknown[]) => {
    const [body] = args;
    return await doPost('certificates/', body);
  });

  handleWrapper('certificates:delete', async (...args: unknown[]) => {
    const [certId] = args;
    return await doDelete(`certificates/${certId}`);
  });

  handleWrapper('certificates:renew', async (...args: unknown[]) => {
    const [certId, body] = args;
    return await doPost(`certificates/${certId}/renew/`, body);
  });

  handleWrapper('certificates:get', async (...args: unknown[]) => {
    const [certId] = args;
    return await doGet(`certificates/${certId}`);
  });

  handleWrapper('certificates:export', async (...args: unknown[]) => {
    const [certId] = args;
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '保存证书与私钥',
        defaultPath: `certificate-${certId}.tar`,
        filters: [{ name: 'Tar Archive', extensions: ['tar'] }],
      });
      if (canceled || !filePath) {
        throw new Error('用户取消保存');
      }
      // 请求后端接口，获取 tar 包流
      const res = await fetch(`${serverBaseURL}/certificates/${certId}/export/`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      await writeFile(filePath, buffer);
      return null;
    } catch (err) {
      logger.error(`export certificate error`, { error: err });
      throw err;
    }
  });
}
