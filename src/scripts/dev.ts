import { execSync, spawn } from 'child_process';
import { AddressInfo } from 'net';
import vite from 'vite';

async function startVite() {
  const server = await vite.createServer({
    server: {
      host: '127.0.0.1',
    },
  });
  await server.listen();
  const address = server.httpServer?.address() as AddressInfo;
  return `http://${address?.address}:${address?.port}`;
}

function buildTs() {
  execSync('tsc -p .', { stdio: 'inherit' });
}

async function startElectron(url: string) {
  const child = spawn('electron', ['.'], {
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: url,
    },
  });
  child.stdout.on('data', data => {
    process.stdout.write(data.toString());
  });
  child.stderr.on('data', data => {
    process.stderr.write(data.toString());
  });
  child.on('close', code => {
    console.error(`electron process exited with code ${code}`);
    process.exit(code);
  });
}
(async () => {
  buildTs();
  console.log('[ts] build completed');
  const url = await startVite();
  console.log('[vite] server started at', url);
  await startElectron(url);
  console.log('[electron] started');
})();
