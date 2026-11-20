import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { serve } from '../scripts/serve.mjs';

test('el servidor entrega HTML, PDF, assets y 404 reales', async () => {
  const server = serve({ port: 0 });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    const pdf = await fetch(`${base}/cv.pdf`, { method: 'HEAD' });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    const webp = await fetch(`${base}/images/portrait-400.webp`, { method: 'HEAD' });
    assert.equal(webp.status, 200);
    assert.equal(webp.headers.get('content-type'), 'image/webp');
    const missing = await fetch(`${base}/no-existe`);
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /Esta ruta no existe/);
    const invalidMethod = await fetch(base, { method: 'POST' });
    assert.equal(invalidMethod.status, 405);
    const traversal = await fetch(`${base}/..%2fpackage.json`);
    assert.equal(traversal.status, 403);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
