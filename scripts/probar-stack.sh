#!/usr/bin/env bash
# =============================================================================
# SMOKE TEST DE PRODUCCIÓN - PORTFOLIO (https://agustinperez.dev.ar)
# =============================================================================
set -euo pipefail

BASE_URL=${1:-https://agustinperez.dev.ar}
BASE_URL=${BASE_URL%/}

echo "[*] Esperando que $BASE_URL responda..."
for attempt in {1..30}; do
  if curl --silent --show-error --fail --output /dev/null --connect-timeout 3 --max-time 5 "$BASE_URL/"; then
    break
  fi
  [[ "$attempt" -lt 30 ]] || { echo "FALLO: $BASE_URL no respondió tras 30 intentos" >&2; exit 1; }
  sleep 2
done
echo "OK Sitio principal ($BASE_URL/): HTTP 200"

# 1. Verificar que archivos ocultos estén bloqueados (403 o 404 en Nginx)
env_status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE_URL/.env")
[[ "$env_status" == "403" || "$env_status" == "404" ]] || {
  echo "FALLO Seguridad: /.env devolvió HTTP $env_status (esperado 403 o 404)" >&2
  exit 1
}
echo "OK Hardening /.env: HTTP $env_status"

# 2. Verificar HTML, script de tema y bundles CSS/JS con hash en /assets/
cb="cb=$(date +%s)"
html=$(curl --silent --show-error --fail "$BASE_URL/?$cb")

js_asset=$(printf '%s\n' "$html" | sed -n 's/.*src="\(\/assets\/client\.[^"]*\.js\)".*/\1/p' | head -n 1 || true)
css_asset=$(printf '%s\n' "$html" | sed -n 's/.*href="\(\/assets\/style\.[^"]*\.css\)".*/\1/p' | head -n 1 || true)

[[ -n "$js_asset" && -n "$css_asset" ]] || {
  echo "FALLO: No se detectaron bundles /assets/style.*.css o /assets/client.*.js en el HTML" >&2
  exit 1
}

js_type=$(curl --silent --fail --output /dev/null --write-out '%{content_type}' "${BASE_URL}${js_asset}")
[[ "$js_type" == *javascript* ]] || { echo "FALLO $js_asset: Content-Type inesperado ($js_type)" >&2; exit 1; }
echo "OK Bundle JS ($js_asset): $js_type"

css_type=$(curl --silent --fail --output /dev/null --write-out '%{content_type}' "${BASE_URL}${css_asset}")
[[ "$css_type" == *text/css* ]] || { echo "FALLO $css_asset: Content-Type inesperado ($css_type)" >&2; exit 1; }
echo "OK Bundle CSS ($css_asset): $css_type"

theme_type=$(curl --silent --fail --output /dev/null --write-out '%{content_type}' "${BASE_URL}/theme.js?$cb")
[[ "$theme_type" == *javascript* ]] || { echo "FALLO /theme.js: Content-Type inesperado ($theme_type)" >&2; exit 1; }
echo "OK Script de tema (/theme.js): $theme_type"

# 3. Verificar que el CV enlazado en la página exista y sea application/pdf
cv_path=$(printf '%s\n' "$html" | sed -n 's/.*href="\(\/[^"]*\.pdf\)".*/\1/p' | head -n 1 || true)
[[ -n "$cv_path" ]] || { echo "FALLO: No se encontró enlace al CV (.pdf) en el HTML publicado" >&2; exit 1; }

cv_meta=$(curl --silent --output /dev/null --write-out '%{http_code}|%{content_type}' "${BASE_URL}${cv_path}?$cb")
cv_status=${cv_meta%%|*}
cv_type=${cv_meta#*|}
[[ "$cv_status" == "200" ]] || { echo "FALLO CV ($cv_path): devolvió HTTP $cv_status (esperado 200)" >&2; exit 1; }
[[ "$cv_type" == *application/pdf* ]] || { echo "FALLO CV ($cv_path): Content-Type inesperado ($cv_type)" >&2; exit 1; }
echo "OK CV ($cv_path): HTTP $cv_status ($cv_type)"

# 4. Verificar SEO técnico y Open Graph (/robots.txt, /sitemap.xml, /og.png)
robots_meta=$(curl --silent --output /dev/null --write-out '%{http_code}|%{content_type}' "$BASE_URL/robots.txt?$cb")
robots_status=${robots_meta%%|*}
robots_type=${robots_meta#*|}
[[ "$robots_status" == "200" ]] || { echo "FALLO SEO: /robots.txt devolvió HTTP $robots_status (esperado 200)" >&2; exit 1; }
[[ "$robots_type" == *text/plain* ]] || { echo "FALLO SEO: /robots.txt Content-Type inesperado ($robots_type)" >&2; exit 1; }
echo "OK SEO /robots.txt: HTTP $robots_status ($robots_type)"

sitemap_meta=$(curl --silent --output /dev/null --write-out '%{http_code}|%{content_type}' "$BASE_URL/sitemap.xml?$cb")
sitemap_status=${sitemap_meta%%|*}
sitemap_type=${sitemap_meta#*|}
[[ "$sitemap_status" == "200" ]] || { echo "FALLO SEO: /sitemap.xml devolvió HTTP $sitemap_status (esperado 200)" >&2; exit 1; }
[[ "$sitemap_type" == *xml* ]] || { echo "FALLO SEO: /sitemap.xml Content-Type inesperado ($sitemap_type)" >&2; exit 1; }
echo "OK SEO /sitemap.xml: HTTP $sitemap_status ($sitemap_type)"

og_meta=$(curl --silent --output /dev/null --write-out '%{http_code}|%{content_type}' "$BASE_URL/og.png?$cb")
og_status=${og_meta%%|*}
og_type=${og_meta#*|}
[[ "$og_status" == "200" ]] || { echo "FALLO SEO: /og.png devolvió HTTP $og_status (esperado 200)" >&2; exit 1; }
[[ "$og_type" == *image/png* ]] || { echo "FALLO SEO: /og.png Content-Type inesperado ($og_type)" >&2; exit 1; }
echo "OK Open Graph /og.png: HTTP $og_status ($og_type)"

# 5. Verificar que una ruta inexistente devuelva HTTP 404
not_found_status=$(curl --silent --output /dev/null --write-out '%{http_code}' "$BASE_URL/ruta-inexistente-smoke-test")
[[ "$not_found_status" == "404" ]] || {
  echo "FALLO 404: ruta inexistente devolvió HTTP $not_found_status (esperado 404)" >&2
  exit 1
}
echo "OK Página 404: HTTP $not_found_status"

echo "[OK] Smoke test completado exitosamente en $BASE_URL"
