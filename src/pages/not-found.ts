import { profile } from '../data/profile.js';
import { commonHead } from '../components/head.js';
import { escape as e } from '../components/html.js';

export function notFound(assetVersion: string): string {
  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
  ${commonHead(assetVersion)}
  <meta name="robots" content="noindex"/>
  <title>Página no encontrada — ${e(profile.name)}</title>
</head>
<body>
  <main class="container section error-page">
    <h1>Esta ruta no existe<span class="title-period">.</span></h1>
    <p class="error-code">Error 404</p>
    <p class="hero-description">Podés volver al portfolio y conocer mis proyectos.</p>
    <p class="hero-actions"><a class="button primary" href="/">Volver al inicio →</a></p>
  </main>
</body>
</html>`;
}
