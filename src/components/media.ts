import { images, type ImageId } from '../data/images.js';
import type { ProjectMedia } from '../data/projects.js';
import { escape as e } from './html.js';
import { icon } from './icons.js';

interface ImageOptions {
  alt: string;
  sizes: string;
  className?: string;
  /** Las imágenes por debajo del primer viewport se cargan en diferido. */
  eager?: boolean;
}

/** `<img>` responsivo con dimensiones intrínsecas para reservar espacio y evitar CLS. */
export function responsiveImage(id: ImageId, { alt, sizes, className, eager }: ImageOptions) {
  const asset = images[id];
  return `<img${className ? ` class="${e(className)}"` : ''} src="${e(asset.src)}" srcset="${e(asset.srcset)}" sizes="${e(sizes)}" width="${asset.width}" height="${asset.height}" alt="${e(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"/>`;
}

/**
 * Galería de capturas reales. Cada miniatura es un enlace a la imagen completa,
 * así funciona sin JavaScript; con JavaScript se abre en un visor accesible.
 */
export function gallery(media: ProjectMedia[], projectName: string, sizes: string): string {
  if (media.length === 0) return '';
  const items = media
    .map((item) => {
      const asset = images[item.image];
      return `<figure class="gallery-item"><a class="gallery-link" href="${e(asset.full)}" data-lightbox data-caption="${e(`${projectName} · ${item.caption}`)}">${responsiveImage(item.image, { alt: item.alt, sizes })}<span class="gallery-zoom">${icon('expand')}<span class="visually-hidden">(ampliar captura)</span></span></a><figcaption>${e(item.caption)}</figcaption></figure>`;
    })
    .join('');
  return `<div class="gallery gallery-${media.length}" role="group" aria-label="Capturas de ${e(projectName)}">${items}</div>`;
}
