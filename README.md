# Mi Portfolio

Portfolio técnico estático, en español, con cinco proyectos, CV, formación y contacto. Diseño responsive azul noche/turquesa, tema claro/oscuro/sistema y navegación por teclado. No requiere backend, base de datos ni servicios externos en runtime.

## Ejecutar

Requiere Node.js **22.16 o posterior** y npm.

```sh
npm ci
npm run dev
```

Abrí `http://127.0.0.1:4321`.

```sh
npm run images    # Regenera variantes WebP y src/data/images.ts desde project_images/
npm run check     # TypeScript estricto
npm run lint      # Formato consistente con Prettier
npm run build     # Genera dist/ para cualquier servidor estático
npm test          # Integridad del contenido, imágenes y enlaces locales
npm run test:http # Prueba del servidor HTTP (requiere permitir sockets locales)
npm run verify    # Todos los checks anteriores, en orden
npm run preview   # Sirve el último dist/ en el puerto 4321
```

## Estructura y personalización

```text
src/
  data/profile.ts     Datos personales, email, estudios, retrato y stack
  data/projects.ts    Única fuente tipada de los cinco proyectos, capturas y arquitectura
  data/images.ts      Catálogo tipado de variantes WebP, dimensiones intrínsecas y srcset
  components/         Head compartido, íconos SVG, galería/imágenes, escape HTML y fichas
  pages/home.ts       HTML semántico, SEO, JSON-LD y secciones
  pages/not-found.ts  Página 404 estática compartiendo tema y tipografía
  styles/main.css     Tokens de color, temas, responsive e impresión
  client.ts           Mejoras progresivas del navegador (tema, menú, portapapeles, visor)
  build.ts            Generación, validaciones de assets/imágenes y archivos de SEO
public/
  cv.pdf              CV limpio de metadatos de terceros
  images/             Retrato y capturas optimizadas en WebP responsive
  fonts/              Tipografía variable local, subconjunto latino + licencia OFL
  favicon.svg         Monograma propio
  og.svg / og.png     Tarjeta social propia, 1200 × 630
  theme.js            Preferencia de tema antes del primer render
deploy/               Nginx, headers y Docker Compose
scripts/              Desarrollo, preview y pipeline de imágenes con sharp
tests/                Comprobaciones de contenido, cliente y servidor HTTP
```

- **Formación:** el título intermedio sigue como **previsto para el 24/11/2026**. Cambiar `intermediateDegree.status` a `obtenido` sólo después de confirmarlo. `academicStatus` alimenta presentación y formación; `degreeStatus` indica el próximo cursado y `reviewedAt` es la fecha de revisión en formato `YYYY-MM-DD`. Editarlos en `profile.ts`; la fecha se muestra con formato argentino y zona UTC para evitar desplazamientos. El paso del tiempo no equivale a obtener un título. La graduación de Ingeniería no se presenta como conseguida ni con fecha definitiva.

## Revisión y publicación

El build predeterminado es una **versión de revisión**, con `noindex, nofollow` y `robots.txt` que bloquea rastreo. No se publicó el sitio ni se cambió la VM o la configuración de Ganker.

Copiá la configuración de ejemplo y revisala:

```sh
cp .env.example .env
```

```dotenv
SITE_URL=https://agustinperez.dev.ar
PUBLICATION_READY=false
```

`SITE_URL` es el origen final, sin ruta ni parámetros. También se puede pasar como variable del entorno; tiene prioridad sobre `.env`. El dominio es configurable y no se afirma que esté operativo.

Después de confirmar los pendientes, configurá `PUBLICATION_READY=true` y ejecutá `npm run verify`. El build de publicación exige dominio HTTPS, email y archivo CV existentes. Habilita indexación, genera `sitemap.xml`, canonical, Open Graph y la referencia al sitemap en `robots.txt`. El build de revisión omite el sitemap para evitar anunciar una URL no configurada. Los archivos CSS/JS incluyen hash para permitir caché prolongada sin servir versiones antiguas; imágenes y fuentes aplican caché estática intermedia, mientras `theme.js`, HTML, CV y la imagen social se revalidan.

`noindex` es una directiva para buscadores y no un control de acceso. Para una revisión privada, serví el sitio localmente o con un control de acceso en el servidor.

## Desplegar en OCI con Nginx

Se ofrecen dos alternativas. Ambas conservan URLs públicas normales por HTTPS, sin puertos de aplicación en los enlaces.

### A. Servir dist/ desde el Nginx de entrada

1. En una máquina con Node, ejecutá `npm ci` y `npm run verify` con la configuración final.
2. Copiá **el contenido de `dist/`**, no los fuentes ni `.env`, a una carpeta de release en la VM, por ejemplo `/var/www/portfolio/releases/2026-11-02/`. Usá un identificador nuevo en cada actualización.
3. Hacé que `/var/www/portfolio/current` apunte al release elegido. En actualizaciones, un cambio atómico de symlink permite volver al release anterior sin reconstruir.
4. Copiá `deploy/security-headers.conf` a `/etc/nginx/snippets/portfolio-security.conf`. Creá un virtual host separado a partir de `deploy/nginx.conf`. Ajustá rutas y dominio. Los paths de certificados son ejemplos y deben existir antes de habilitar el bloque HTTPS.
5. Validá **toda** la configuración con `sudo nginx -t`. Sólo si es válida, recargá el proceso que actualmente recibe tráfico (`sudo systemctl reload nginx` si está gestionado por systemd).
6. Comprobá el dominio, el CV, una ruta inexistente con HTTP 404 y las cabeceras. Visitá también Ganker para comprobar la convivencia.

Ejemplo de copia desde tu máquina (reemplazar usuario y host reales):

```sh
rsync -av dist/ usuario@servidor:/var/www/portfolio/releases/2026-11-02/
```

Los permisos de esos directorios se preparan una vez en la VM; no ejecutar el build como root.

### B. Contenedor estático detrás de un proxy existente

```sh
SITE_URL=https://agustinperez.dev.ar PUBLICATION_READY=true \
  docker compose -p portfolio -f deploy/compose.yaml up -d --build
```

La imagen es multi-stage: Node compila y Nginx sirve los estáticos. Compose enlaza `127.0.0.1:8081:80`; el puerto no queda publicado en todas las interfaces. Verificá antes que esté disponible. Las opciones son **de build**: cambiar variables del contenedor sin reconstruir no modifica el HTML.

Si el Nginx de entrada corre en el host, en el bloque HTTPS de **este dominio** reemplazá las locations estáticas del ejemplo por:

```nginx
location / {
    proxy_pass http://127.0.0.1:8081;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Si el proxy de entrada está en Docker, su `127.0.0.1` refiere al propio contenedor. En ese caso, conectá el portfolio a una red Docker compartida y usá el nombre DNS del servicio como upstream (`http://portfolio:80`), sin publicar el puerto 8081. Adaptá la topología después de inspeccionar el despliegue real.

### Convivencia con gankerweb.app

Los puertos 80 y 443 deben pertenecer al **único punto de entrada existente**. Agregar un segundo Nginx que intente ocuparlos produce conflictos. Primero identificá si el receptor actual es Nginx del host o el contenedor de Ganker.

- El virtual host de Ganker conserva sus `server_name`, rutas de API/WebSockets, volúmenes y certificados.
- El nuevo virtual host responde exclusivamente a `agustinperez.dev.ar` y sirve los estáticos o hace proxy al contenedor de portfolio.
- No reemplaces el archivo global `nginx.conf`, no uses `default_server` y no ejecutes `docker compose down` sobre Ganker.
- El ejemplo no agrega `www`: sólo configurarlo si se desea, con DNS y certificado que lo cubran.

No se inspeccionó ni modificó la VM. El ejemplo describe la configuración adicional y debe adaptarse al punto de entrada real.

### DNS y TLS

1. Crear un registro **A** para `agustinperez.dev.ar` hacia la IPv4 pública de la VM. Crear **AAAA** únicamente si IPv6 está configurado y funciona. Confirmar resolución antes del cambio de tráfico.
2. Mantener el acceso HTTP/HTTPS del punto de entrada según los security lists/NSG y firewall existentes en OCI. No abrir 8081 públicamente.
3. Obtener un certificado válido con el proveedor/mecanismo que se use en esa infraestructura. Configurar `ssl_certificate` y `ssl_certificate_key` con rutas reales.
4. Documentar y comprobar la renovación, quién la ejecuta y cómo recarga Nginx. El proyecto no supone que haya Certbot, un proxy TLS o renovación automática.
5. Mantener HTTP → HTTPS una vez que HTTPS funcione. Si el mecanismo ACME requiere una ruta HTTP, agregar la excepción correspondiente antes de la redirección.

### Actualizar y volver atrás

Para estáticos: compilar, copiar a **un nuevo release**, cambiar el symlink y verificar. Conservar al menos el release anterior. El cambio de contenido no requiere reiniciar Nginx. Para cambios de configuración, ejecutar `nginx -t` antes de recargar.

Para Docker: guardar la imagen anterior con una etiqueta identificable, reconstruir el servicio `portfolio` y verificar su healthcheck. Para volver atrás, usar la imagen anterior. No incluir Ganker en estos comandos.

## Fuentes y verificación del contenido

Contraste realizado el **02/11/2026**, actualizado con `Prompt_Codex_Portfolio_Agustin_Perez_inventario_real.md` y `CV_Agustin_Perez.pdf`. El repositorio de inventario se consultó nuevamente. Estas son las fuentes de cada alcance:

| Proyecto       | Fuente contrastada                                                                                                                                               | Alcance mostrado                                                                                                                                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ganker         | [README](https://github.com/Aguperez444/Ganker), [backend](https://github.com/Aguperez444/Ganker/blob/main/backend/README.md)                                    | React/Vite, FastAPI, capas/puertos/adaptadores, REST/WebSockets, integraciones y despliegue documentado. Liderazgo del backend, decisiones de arquitectura y tecnologías y realización íntegra del despliegue y CI/CD, según confirmación directa del propietario. El proyecto completo sigue siendo colaborativo. |
| Inventario     | Brief y CV del propietario; [README de la refactorización](https://github.com/Aguperez444/app_punto_de_venta)                                                    | Versión original en uso diario desde 2023: Python, Tkinter y SQLite3. Refactorización posterior: SQLAlchemy/PostgreSQL, arquitectura hexagonal, UoW y pruebas.                                                                                                                                                     |
| Microservicios | [Repositorio](https://github.com/Aguperez444/backend_contenedores), [Keycloak](https://github.com/Aguperez444/backend_contenedores/blob/main/README_KEYCLOAK.md) | Estructura de gateway/solicitudes/camiones y autenticación; proyecto académico en equipo según brief/CV.                                                                                                                                                                                                           |
| Automatizador  | [Repositorio y código](https://github.com/Aguperez444/automatizador_desktop/blob/master/main.py)                                                                 | Python, interfaz Tkinter/ttkbootstrap y selección de ejecutable, nombre e ícono para .desktop.                                                                                                                                                                                                                     |
| UPS Monitor    | [Repositorio](https://github.com/Aguperez444/ups-web-monitor)                                                                                                    | Primera versión publicada (`v1.0.0`): lectura NUT con arquitectura hexagonal, persistencia histórica en SQLite, dashboard en Next.js (flujo eléctrico, información detallada e historial con gráficos) y distribución como AppImage con bandeja del sistema.                                                       |

El **03/11/2026** se comprobaron con respuesta HTTP 200 tanto la demo publicada de [Ganker](https://gankerweb.app/) como el [certificado oficial EF SET](https://cert.efset.org/es/Qgv7n9), quedando enlazados en la web. El sitio mantiene el estado honesto de Ganker como proyecto en desarrollo sin prometer SLA de disponibilidad. No se consultó contenido privado de LinkedIn ni se copiaron credenciales de los repositorios.

El uso real del inventario, los permisos y los reportes por día/semana/mes provienen del propietario, no de una inspección del negocio ni del README de la refactorización. La ficha pública es resumida y no muestra el caso de estudio ni el recuento histórico, por indicación del propietario. No identifica al comercio ni atribuye empleo o contratos; las capturas de búsqueda de productos y listado de ventas muestran únicamente datos de prueba confirmados por el propietario. Tampoco afirma ni niega que la refactorización esté implantada.

Las imágenes seleccionadas de `project_images/` (retrato, Ganker con recorte del panel de chat de terceros, pantallas con datos de prueba de inventario y las vistas de la v1.0.0 de UPS Monitor) se procesan con `npm run images` hacia variantes WebP livianas en `public/images/`.

## Datos a completar o confirmar antes de publicar

- Configurar el dominio final, DNS, TLS y su renovación. Revisar el Nginx que realmente recibe el tráfico de Ganker antes de instalar el virtual host adicional.
- Después de desplegar, activar `PUBLICATION_READY=true` y regenerar `dist/`.
