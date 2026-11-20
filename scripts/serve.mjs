import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export function serve({ port = Number(process.env.PORT || 4321), host = '127.0.0.1' } = {}) {
  const root = resolve('dist');
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
  };
  const server = createServer(async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      res.end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(root + sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const data = await readFile(file);
      res.writeHead(200, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      const fallback = await readFile(resolve(root, '404.html')).catch(() =>
        Buffer.from('Build the site first: npm run build'),
      );
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : fallback);
    }
  });
  server.on('error', (error) => {
    console.error(`No se pudo iniciar el preview: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, host, () =>
    console.log(`Portfolio: http://${host}:${server.address().port}`),
  );
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) serve();
