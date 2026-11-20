import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { home } from './pages/home.js';
import { profile } from './data/profile.js';
import { projects } from './data/projects.js';
import { escape } from './components/html.js';
import { notFound } from './pages/not-found.js';
import { images } from './data/images.js';

// Sólo se aceptan las dos opciones públicas de build. Nunca se inyecta process.env.
const env: Record<string, string | undefined> = {};
try {
  const file = await readFile('.env', 'utf8');
  for (const line of file.split('\n')) {
    const match = line.match(/^\s*(SITE_URL|PUBLICATION_READY)\s*=\s*["']?([^"'#]*?)["']?\s*$/);
    if (match?.[1] && match[2]) env[match[1]] = match[2].trim();
  }
} catch {
  /* La configuración local es opcional. */
}

const rawUrl = process.env['SITE_URL'] ?? env['SITE_URL'] ?? '';
const ready = (process.env['PUBLICATION_READY'] ?? env['PUBLICATION_READY']) === 'true';
let siteUrl = '';
if (rawUrl) {
  const url = new URL(rawUrl);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error('SITE_URL debe ser un origen HTTP(S) sin ruta, credenciales ni parámetros.');
  }
  if (ready && url.protocol !== 'https:')
    throw new Error('La publicación requiere un SITE_URL HTTPS.');
  siteUrl = url.origin;
}
let cvExists = false;
if (profile.cv) {
  if (!profile.cv.startsWith('/') || profile.cv.includes('..'))
    throw new Error('CV: usar una ruta local desde public/.');
  try {
    await access(`public${profile.cv}`);
    cvExists = true;
  } catch {
    /* Se omite el enlace si falta el PDF. */
  }
}
if (ready && (!siteUrl || !cvExists || !profile.email)) {
  throw new Error('Antes de publicar, configurá SITE_URL, el email y un archivo de CV existente.');
}
for (const project of projects) {
  for (const link of Object.values(project.links)) {
    if (new URL(link).protocol !== 'https:') throw new Error(`Enlace inválido en ${project.id}.`);
  }
}

// Las imágenes se generan con `npm run images`; un archivo faltante rompe el build, no la página.
for (const [id, asset] of Object.entries(images)) {
  for (const candidate of asset.srcset.split(', ').map((entry) => entry.split(' ')[0])) {
    try {
      await access(`public${candidate}`);
    } catch {
      throw new Error(`Imagen ${id}: falta public${candidate}. Ejecutá npm run images.`);
    }
  }
}

const css = await readFile('src/styles/main.css', 'utf8');
const js = await readFile('.build/client.js', 'utf8');
// FNV-1a para versionar los assets sin dependencias ni cachés obsoletas.
let hash = 2166136261;
for (const char of css + js) {
  hash ^= char.charCodeAt(0);
  hash = Math.imul(hash, 16777619);
}
const assetVersion = (hash >>> 0).toString(16);
// Resolver el contenido antes de borrar dist/: un dato inválido conserva la salida anterior.
const page = home({ siteUrl, ready, cvExists, assetVersion });
await rm('dist', { recursive: true, force: true });
await mkdir('dist/assets', { recursive: true });
await cp('public', 'dist', { recursive: true });
await writeFile(`dist/assets/style.${assetVersion}.css`, css);
await writeFile(`dist/assets/client.${assetVersion}.js`, js);
await writeFile('dist/index.html', page);
await writeFile('dist/404.html', notFound(assetVersion));
const indexable = ready && !!siteUrl;
await writeFile(
  'dist/robots.txt',
  indexable
    ? `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n',
);
if (indexable)
  await writeFile(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escape(siteUrl)}/</loc></url></urlset>`,
  );
console.log(
  `Portfolio generado en dist/ · ${indexable ? 'publicación habilitada' : 'revisión, noindex'} · CV ${cvExists ? 'disponible' : 'pendiente'}.`,
);
