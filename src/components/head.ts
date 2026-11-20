import { escape } from './html.js';

// Inicio y 404 comparten recursos, preferencias y metadatos de dispositivo.
export function commonHead(assetVersion: string): string {
  return `<meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
  <meta name="color-scheme" content="dark light"/>
  <meta name="theme-color" content="#0b1219"/>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
  <link rel="preload" href="/fonts/sans.woff2" as="font" type="font/woff2" crossorigin/>
  <link rel="stylesheet" href="/assets/style.${escape(assetVersion)}.css"/>
  <script src="/theme.js"></script>`;
}
