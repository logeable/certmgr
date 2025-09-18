import { ChildProcess, spawn, exec } from 'child_process';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path, { join } from 'path';
import { URLSearchParams } from 'url';
import logger from './logger';
import { writeFile, unlink, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';

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
    let foundPort = false;

    setTimeout(() => {
      if (!foundPort) {
        server.kill();
        logger.error('server start timeout');
        reject(new Error('server start timeout'));
      }
    }, 5000);

    let buffer = '';

    server.stdout.on('data', data => {
      logger.debug(`server output: ${data.toString()}`);

      if (!foundPort) {
        buffer += data.toString();
        if (buffer.includes('http server started on')) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            const match = line.match(/server started on .*:(\d+)/);
            if (match) {
              const port = match[1];
              foundPort = true;

              logger.info(`http server started on http://localhost:${port}`);
              resolve({ port: Number(port), process: server });
            }
          }
        }
      }
    });
    server.stderr.on('data', data => {
      logger.error(`server error: ${data.toString()}`);
    });
    server.on('error', err => {
      logger.error(`start error: ${err.message}`);
    });
    server.on('exit', code => {
      logger.info(`server exited with code ${code}`);
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

  handleWrapper('certificates:installRoot', async (...args: unknown[]) => {
    const [certId] = args;
    const cert = await doGet(`certificates/${certId}`);

    if (!cert.certPem) {
      throw new Error('证书数据不存在');
    }

    // 创建临时目录和文件
    const tempDir = await mkdtemp(join(tmpdir(), 'certmgr-'));
    const certPath = join(tempDir, `cert-${certId}.pem`);

    try {
      // 写入证书数据到临时文件
      await writeFile(certPath, cert.certPem);

      // 安装到登录钥匙串
      installToLoginKeychain(certPath);

      return null;
    } catch (error) {
      // 清理临时文件
      try {
        await unlink(certPath);
      } catch (cleanupError) {
        logger.warn('清理临时文件失败', { error: cleanupError });
      }
      throw error;
    }
  });
}

function installToLoginKeychain(certPath: string) {
  const script = `
    do shell script "security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db \\"${certPath}\\"" 
  `;

  const cmd = `osascript -e '${script}'`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    console.log('Certificate installed to login keychain successfully via osascript');
  });
}
