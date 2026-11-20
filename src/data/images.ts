// Archivo generado por scripts/images.mjs (npm run images). No editar a mano.
export interface ImageAsset {
  src: string;
  full: string;
  srcset: string;
  width: number;
  height: number;
}

export const images = {
  portrait: {
    src: '/images/portrait-400.webp',
    full: '/images/portrait-768.webp',
    srcset: '/images/portrait-400.webp 400w, /images/portrait-768.webp 768w',
    width: 768,
    height: 960,
  },
  'ganker-landing': {
    src: '/images/ganker-landing-800.webp',
    full: '/images/ganker-landing-1600.webp',
    srcset: '/images/ganker-landing-800.webp 800w, /images/ganker-landing-1600.webp 1600w',
    width: 1600,
    height: 775,
  },
  'ganker-dashboard': {
    src: '/images/ganker-dashboard-800.webp',
    full: '/images/ganker-dashboard-1600.webp',
    srcset: '/images/ganker-dashboard-800.webp 800w, /images/ganker-dashboard-1600.webp 1600w',
    width: 1600,
    height: 985,
  },
  'ganker-login': {
    src: '/images/ganker-login-800.webp',
    full: '/images/ganker-login-1600.webp',
    srcset: '/images/ganker-login-800.webp 800w, /images/ganker-login-1600.webp 1600w',
    width: 1600,
    height: 765,
  },
  'ventas-menu': {
    src: '/images/ventas-menu-560.webp',
    full: '/images/ventas-menu-1120.webp',
    srcset: '/images/ventas-menu-560.webp 560w, /images/ventas-menu-1120.webp 1120w',
    width: 1120,
    height: 630,
  },
  'ventas-alta': {
    src: '/images/ventas-alta-884.webp',
    full: '/images/ventas-alta-884.webp',
    srcset: '/images/ventas-alta-884.webp 884w',
    width: 884,
    height: 497,
  },
  'ups-dashboard': {
    src: '/images/ups-dashboard-560.webp',
    full: '/images/ups-dashboard-1120.webp',
    srcset: '/images/ups-dashboard-560.webp 560w, /images/ups-dashboard-1120.webp 1120w',
    width: 1120,
    height: 700,
  },
} satisfies Record<string, ImageAsset>;

export type ImageId = keyof typeof images;
