import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { home } from '../.build/pages/home.js';
import { projects } from '../.build/data/projects.js';
import { profile, formatReviewDate } from '../.build/data/profile.js';
import { projectCard } from '../.build/components/project.js';

const html = await readFile('dist/index.html', 'utf8');

test('la página incluye los cinco proyectos en orden y todos los anclajes existen', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  let last = -1;
  for (const project of projects.filter((item) => item.visibility)) {
    const position = html.indexOf(`id="proyecto-${project.id}"`);
    assert.ok(position > last, project.name);
    last = position;
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'IDs únicos');
  for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.includes(anchor), `Anclaje inexistente: ${anchor}`);
  }
});

test('todos los assets locales y el CV enlazado existen', async () => {
  for (const [, path] of html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)) {
    await access(`dist${path}`);
  }
  assert.equal((await readFile('dist/cv.pdf')).subarray(0, 5).toString(), '%PDF-');
});

test('publicación configurable, sin indexar una revisión ni anunciar títulos futuros como obtenidos', () => {
  const review = home({ siteUrl: '', ready: false, cvExists: false, assetVersion: 'test' });
  assert.match(review, /noindex, nofollow/);
  assert.doesNotMatch(review, /rel="canonical"/);
  assert.doesNotMatch(review, /href="\/cv.pdf"/);
  assert.match(review, /TÍTULO INTERMEDIO · PREVISTO/);
  assert.match(review, /Académico \/ colaborativo/);
  assert.match(review, /primer dashboard en Next\.js muestra el resumen/);
  assert.match(review, /gráficos, el historial y las alertas siguen pendientes/);
  assert.doesNotMatch(review, /3535083770|tel:/);
  const production = home({
    siteUrl: 'https://portfolio.example',
    ready: true,
    cvExists: true,
    assetVersion: 'test',
  });
  assert.match(production, /index, follow/);
  assert.match(production, /rel="canonical" href="https:\/\/portfolio.example\/"/);
  assert.match(production, /https:\/\/portfolio.example\/og.png/);
  assert.doesNotMatch(production, /publication-notice/);
});

test('inicio y 404 comparten el arranque de tema y la fuente local', async () => {
  const errorPage = await readFile('dist/404.html', 'utf8');
  for (const page of [html, errorPage]) {
    assert.match(page, /<script src="\/theme.js"><\/script>/);
    assert.match(page, /rel="preload" href="\/fonts\/sans.woff2"/);
    assert.match(page, /name="theme-color"/);
    assert.match(page, /viewport-fit=cover/);
  }
  assert.match(errorPage, /name="robots" content="noindex"/);
});

test('la actualización académica se refleja en presentación y formación, sin cambiar el título previsto', () => {
  const before = { status: profile.academicStatus, date: profile.reviewedAt };
  try {
    profile.academicStatus = 'Estado de prueba <sin confirmar>';
    profile.reviewedAt = '2026-12-01';
    const page = home({ siteUrl: '', ready: false, cvExists: true, assetVersion: 'test' });
    assert.equal((page.match(/Estado de prueba &lt;sin confirmar&gt;/g) || []).length, 2);
    assert.match(page, /<time datetime="2026-12-01">01\/12\/2026<\/time>/);
    assert.match(page, /TÍTULO INTERMEDIO · PREVISTO/);
    assert.doesNotMatch(page, /actualizado al 02\/11\/2026/);
  } finally {
    profile.academicStatus = before.status;
    profile.reviewedAt = before.date;
  }
  assert.equal(formatReviewDate('2024-02-29'), '29/02/2024');
  assert.throws(() => formatReviewDate('2026-02-29'));
});

test('el botón del menú precede sus enlaces en el HTML', () => {
  const menu = html.indexOf('class="icon-button menu-toggle"');
  const navigation = html.indexOf('<nav ');
  assert.ok(menu > 0 && menu < navigation);
  assert.match(html, /aria-controls="navigation"/);
});

test('el estado académico alcanza contraste AA en los dos temas y su variante del sistema', async () => {
  const css = await readFile('src/styles/main.css', 'utf8');
  function luminance(hex) {
    let value = hex.slice(1);
    if (value.length === 3) value = [...value].map((digit) => digit + digit).join('');
    return [0, 2, 4].reduce((sum, index, channel) => {
      const c = parseInt(value.slice(index, index + 2), 16) / 255;
      return (
        sum +
        (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) *
          [0.2126, 0.7152, 0.0722][channel]
      );
    }, 0);
  }
  const pairs = [...css.matchAll(/--status-text:\s*(#[a-f0-9]+);\s*--status-bg:\s*(#[a-f0-9]+);/g)];
  assert.equal(pairs.length, 3, 'Oscuro, claro explícito y claro del sistema');
  for (const [, text, background] of pairs) {
    const values = [luminance(text), luminance(background)].sort((a, b) => a - b);
    const ratio = (values[1] + 0.05) / (values[0] + 0.05);
    assert.ok(ratio >= 4.5, `Contraste insuficiente: ${ratio}`);
  }
});

test('nombres largos, Unicode y caracteres HTML se preservan como datos, sin crear markup', () => {
  const before = profile.name;
  try {
    profile.name = 'Agustín </script><img src=x> Perez 🧉 مرحبا';
    const page = home({ siteUrl: '', ready: false, cvExists: false, assetVersion: 'test' });
    assert.doesNotMatch(page, /<img src=x>/);
    const schema = page.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
    assert.equal(JSON.parse(schema).mainEntity.name, profile.name);
  } finally {
    profile.name = before;
  }
  const project = {
    ...projects[1],
    name: 'Título extenso '.repeat(20) + '🧉 中文 فارسی',
    summary: '<script>alert(1)</script> & pruebas',
    role: '',
    stack: [],
  };
  const card = projectCard(project);
  assert.ok(card.includes(project.name));
  assert.match(card, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; pruebas/);
  assert.doesNotMatch(card, /<script>/);
});

test('la identidad y los textos aprobados mantienen el inventario breve y la atribución de Ganker', () => {
  const inventory = projects.find((project) => project.id === 'inventario');
  const card = projectCard(inventory);
  assert.match(card, /En uso desde 2023/);
  assert.match(card, /Solución para comercio real/);
  assert.match(card, /SQLite3/);
  assert.doesNotMatch(
    card,
    /caso de estudio|case-study|project-versions|<details|implantad|producción|1\.000/,
  );
  assert.match(html, /Agustín Perez/);
  assert.doesNotMatch(
    html,
    /Pérez|Después, escribir código|Disfruto conectar servicios y automatizar tareas/,
  );
  assert.match(
    html,
    /Entender el problema\.<br\/><span class="muted-heading">Y escribir el código\.<\/span>/,
  );
  const ganker = projectCard(projects.find((project) => project.id === 'ganker'));
  assert.match(ganker, /Lideré el desarrollo del backend/);
  assert.match(ganker, /tomé las decisiones de arquitectura y tecnologías/);
  assert.match(ganker, /realicé íntegramente el despliegue y la configuración del pipeline CI\/CD/);
  assert.match(ganker, /Colaborativo/);
});

test('EF SET conserva las diferencias por habilidad y sólo enlaza el certificado después de comprobarlo', () => {
  const options = { siteUrl: '', ready: false, cvExists: true, assetVersion: 'test' };
  const page = home(options);
  assert.match(page, /C1 global · 66\/100/);
  assert.match(page, /Comprensión C2; expresión B1\./);
  assert.match(page, /<dt>Lectura<\/dt><dd>82\/100 · C2/);
  assert.match(page, /<dt>Escucha<\/dt><dd>84\/100 · C2/);
  assert.match(page, /<dt>Expresión escrita<\/dt><dd>48\/100 · B1/);
  assert.match(page, /<dt>Expresión oral<\/dt><dd>48\/100 · B1/);
  assert.match(page, /href="https:\/\/cert\.efset\.org\/es\/Qgv7n9"/);
  const before = profile.english.certificate.linkVerified;
  try {
    profile.english.certificate.linkVerified = false;
    assert.doesNotMatch(home(options), /href="https:\/\/cert\.efset\.org/);
  } finally {
    profile.english.certificate.linkVerified = before;
  }
});

test('las imágenes optimizadas definen dimensiones intrínsecas, srcset existente y excluyen datos sensibles', async () => {
  const imgTags = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(imgTags.length, 7);
  for (const tag of imgTags) {
    assert.match(tag, /\bsrc="\/images\/[^"]+\.webp"/, tag);
    assert.match(tag, /\bwidth="\d+"/, tag);
    assert.match(tag, /\bheight="\d+"/, tag);
    assert.match(tag, /\balt="[^"]+"/, tag);
  }
  for (const [, srcset] of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const candidate of srcset.split(',')) {
      const [url] = candidate.trim().split(/\s+/);
      await access(`dist${url}`);
    }
  }
  const lightboxLinks = [...html.matchAll(/<a\b[^>]*\bdata-lightbox\b[^>]*>/g)].map((m) => m[0]);
  assert.equal(lightboxLinks.length, 6);
  for (const anchor of lightboxLinks) {
    const href = anchor.match(/\bhref="([^"]+)"/)?.[1];
    assert.ok(href, anchor);
    await access(`dist${href}`);
    assert.match(anchor, /\bdata-caption="[^"]+"/, anchor);
  }
  const builtImages = await readdir('dist/images');
  for (const file of builtImages) {
    assert.doesNotMatch(file, /product_search|sales_overview/);
  }
  const cvBytes = await readFile('dist/cv.pdf');
  assert.equal(cvBytes.includes(Buffer.from('Banco Roela')), false);
});
