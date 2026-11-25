// Optimiza las imágenes originales de project_images/ y genera:
//   - public/images/*.webp en varios anchos (srcset)
//   - src/data/images.ts con rutas y dimensiones (evita CLS y rutas rotas)
// Uso: npm run images. Los originales no se modifican ni se publican.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = 'project_images';
const OUTPUT = 'public/images';

/**
 * crop: región del original en píxeles. widths: anchos generados (sin ampliar).
 * Las capturas incluidas usan datos de prueba y recortan paneles de chat de terceros.
 */
const manifest = [
  {
    id: 'portrait',
    input: 'retrato.png',
    crop: { left: 0, top: 40, width: 768, height: 960 },
    widths: [400, 768],
    quality: 80,
  },
  { id: 'ganker-landing', input: 'ganker/ganker_landing_1.png', widths: [800, 1600] },
  {
    id: 'ganker-dashboard',
    // Se excluye el panel de conversaciones (mensajes de prueba de otros usuarios).
    input: 'ganker/ganker_dash.png',
    crop: { left: 0, top: 0, width: 2020, height: 1243 },
    widths: [800, 1600],
  },
  { id: 'ganker-login', input: 'ganker/ganker_login.png', widths: [800, 1600] },
  {
    id: 'ventas-menu',
    input: 'ventas/main_menu.png',
    crop: { left: 714, top: 0, width: 1120, height: 630 },
    widths: [560, 1120],
  },
  { id: 'ventas-busqueda', input: 'ventas/product_search.png', widths: [800, 1600] },
  {
    id: 'ventas-alta',
    input: 'ventas/add_product.png',
    crop: { left: 828, top: 0, width: 884, height: 497 },
    widths: [884],
  },
  { id: 'ventas-listado', input: 'ventas/sales_overview.png', widths: [800, 1600] },
  { id: 'ups-flujo', input: 'ups_web_monitor/dashboard_principal.png', widths: [800, 1600] },
  { id: 'ups-info', input: 'ups_web_monitor/informacion_ups.png', widths: [800, 1600] },
  { id: 'ups-historial', input: 'ups_web_monitor/historial_carga.png', widths: [800, 1600] },
];

await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });

const entries = [];
for (const item of manifest) {
  const base = sharp(`${SOURCE}/${item.input}`);
  const meta = await base.metadata();
  const region = item.crop ?? { left: 0, top: 0, width: meta.width, height: meta.height };
  const variants = [];
  for (const width of item.widths) {
    const target = Math.min(width, region.width);
    const file = `${item.id}-${target}.webp`;
    const info = await sharp(`${SOURCE}/${item.input}`)
      .extract(region)
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: item.quality ?? 78, effort: 6 })
      .toFile(`${OUTPUT}/${file}`);
    variants.push({ src: `/images/${file}`, width: info.width, height: info.height });
    console.log(
      `${file.padEnd(28)} ${info.width}×${info.height} · ${Math.round(info.size / 1024)} KB`,
    );
  }
  const largest = variants.at(-1);
  entries.push({
    id: item.id,
    src: variants[0].src,
    full: largest.src,
    srcset: variants.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
    width: largest.width,
    height: largest.height,
  });
}

const body = entries
  .map((entry) => {
    const key = /^[a-zA-Z_$][\w$]*$/.test(entry.id) ? entry.id : `'${entry.id}'`;
    return `  ${key}: {\n    src: '${entry.src}',\n    full: '${entry.full}',\n    srcset: '${entry.srcset}',\n    width: ${entry.width},\n    height: ${entry.height},\n  },`;
  })
  .join('\n');
await writeFile(
  'src/data/images.ts',
  `// Archivo generado por scripts/images.mjs (npm run images). No editar a mano.\nexport interface ImageAsset {\n  src: string;\n  full: string;\n  srcset: string;\n  width: number;\n  height: number;\n}\n\nexport const images = {\n${body}\n} satisfies Record<string, ImageAsset>;\n\nexport type ImageId = keyof typeof images;\n`,
);
console.log(`\n${entries.length} imágenes → ${OUTPUT}/ y src/data/images.ts`);
