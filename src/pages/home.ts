import { profile, skills, formatReviewDate } from '../data/profile.js';
import { projects } from '../data/projects.js';
import { images } from '../data/images.js';
import { icon } from '../components/icons.js';
import { escape as e, external } from '../components/html.js';
import { projectCard } from '../components/project.js';
import { commonHead } from '../components/head.js';
import { englishProfile } from '../components/languages.js';
import { responsiveImage } from '../components/media.js';

export interface PageOptions {
  siteUrl: string;
  ready: boolean;
  cvExists: boolean;
  assetVersion: string;
}

const TITLE = `${profile.name} — Backend, arquitectura y sistemas`;
const DESCRIPTION = `Portfolio de ${profile.name}, estudiante avanzado de Ingeniería en Sistemas en UTN Córdoba. Proyectos de backend, arquitectura de software, cloud y automatización.`;

function cvLink(cvExists: boolean): string {
  return cvExists && profile.cv
    ? `<a class="text-link cv-link" href="${e(profile.cv)}" ${external}>${icon('file')} Ver CV ${icon('arrow')}</a>`
    : '';
}

function structuredData(siteUrl: string): string {
  const portrait = images[profile.portrait.image];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    ...(siteUrl ? { url: `${siteUrl}/` } : {}),
    mainEntity: {
      '@type': 'Person',
      name: profile.name,
      description: `${profile.headline} en UTN FRC.`,
      ...(siteUrl ? { image: `${siteUrl}${portrait.full}` } : {}),
      sameAs: [profile.github, profile.linkedin],
      homeLocation: { '@type': 'Place', name: profile.location },
      alumniOf: {
        '@type': 'CollegeOrUniversity',
        name: 'Universidad Tecnológica Nacional, Facultad Regional Córdoba',
      },
      knowsAbout: ['Desarrollo backend', 'Arquitectura de software', 'Cloud', 'DevOps'],
    },
  }).replace(/</g, '\\u003c');
}

function head({ siteUrl, ready, assetVersion }: PageOptions): string {
  const indexable = ready && !!siteUrl;
  const social = siteUrl
    ? `<link rel="canonical" href="${e(siteUrl)}/"/>
  <meta property="og:url" content="${e(siteUrl)}/"/>
  <meta property="og:image" content="${e(siteUrl)}/og.png"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>`
    : '';
  return `<head>
  ${commonHead(assetVersion)}
  <title>${e(TITLE)}</title>
  <meta name="description" content="${e(DESCRIPTION)}"/>
  <meta name="author" content="${e(profile.name)}"/>
  <meta name="robots" content="${indexable ? 'index, follow' : 'noindex, nofollow'}"/>
  <meta property="og:type" content="profile"/>
  <meta property="og:locale" content="es_AR"/>
  <meta property="og:title" content="${e(TITLE)}"/>
  <meta property="og:description" content="${e(DESCRIPTION)}"/>
  <meta property="og:image:alt" content="${e(profile.name)}. Backend, arquitectura y sistemas. ${e(profile.location)}."/>
  ${social}
  <meta name="twitter:card" content="summary_large_image"/>
  <script type="application/ld+json">${structuredData(siteUrl)}</script>
  <script type="module" src="/assets/client.${e(assetVersion)}.js"></script>
</head>`;
}

function header(): string {
  return `<header class="site-header"><div class="container header-inner">
    <a class="wordmark" href="#inicio" aria-label="${e(profile.name)}, inicio"><span class="monogram">ap<span>.</span></span><span class="wordmark-name">${e(profile.name)}</span></a>
    <div class="navigation-wrap">
      <button class="icon-button menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="navigation" hidden>${icon('menu', 'menu-icon')}${icon('close', 'close-icon')}</button>
      <nav aria-label="Navegación principal" id="navigation">
        <a href="#sobre-mi">Sobre mí</a><a href="#proyectos">Proyectos</a><a href="#stack">Stack</a><a href="#formacion">Formación</a><a href="#contacto" class="nav-contact">Hablemos ${icon('right')}</a>
      </nav>
    </div>
    <div class="header-actions"><button class="icon-button theme-toggle" type="button" aria-label="Tema: sistema. Cambiar a claro" title="Cambiar tema" hidden><span data-theme-icon="system">${icon('monitor')}</span><span data-theme-icon="light" hidden>${icon('sun')}</span><span data-theme-icon="dark" hidden>${icon('moon')}</span></button></div>
  </div></header>`;
}

function hero(cv: string): string {
  return `<section class="hero container" id="inicio" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="hero-intro">Hola, soy ${e(profile.name)}.</p>
        <h1 id="hero-title">El software empieza<br/>con una buena<br/><span>forma de pensar<span class="accent-period">.</span></span></h1>
        <p class="hero-description">Estudiante avanzado de Ingeniería en Sistemas.<br class="desktop-break"/> Construyo proyectos con foco en el backend, el diseño<br class="desktop-break"/> de software y lo que pasa después del deploy.</p>
        <div class="hero-actions"><a class="button primary" href="#proyectos">Ver proyectos ${icon('down')}</a>${cv}</div>
        <div class="hero-socials"><a href="${e(profile.github)}" ${external}>${icon('github')} GitHub ${icon('arrow')}</a><a href="${e(profile.linkedin)}" ${external}>${icon('linkedin')} LinkedIn ${icon('arrow')}</a></div>
      </div>
      <div class="hero-visual" aria-hidden="true"><div class="visual-grid"></div><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="system-core"><span class="core-bracket">{</span><span>ap<span class="core-dot">.</span></span><span class="core-bracket">}</span></div><div class="system-node node-domain">${icon('layers')}<span>dominio</span><span class="node-light"></span></div><div class="system-node node-api">${icon('code')}<span>backend</span><span class="node-light"></span></div><div class="system-node node-infra">${icon('cloud')}<span>infraestructura</span><span class="node-light"></span></div><div class="orbit-point point-one"></div><div class="orbit-point point-two"></div></div>
      <div class="hero-bottom"><span>${icon('pin')} ${e(profile.location)}</span><span><span class="dot"></span> ${e(profile.academicStatus)} · UTN FRC</span><a href="#sobre-mi">Un poco más sobre mí ${icon('down')}</a></div>
    </section>`;
}

function about(): string {
  return `<section class="section container about" id="sobre-mi" aria-labelledby="about-title">
      <div class="about-intro">
        <h2 id="about-title">Entender el problema.<br/><span class="muted-heading">Y escribir el código.</span></h2>
        <div class="portrait">${responsiveImage(profile.portrait.image, { alt: profile.portrait.alt, sizes: '(max-width: 900px) 240px, 340px' })}</div>
      </div>
      <div class="about-copy">
        <p class="lead">Me interesa entender los sistemas de punta a punta: el dominio, las APIs, los datos y la infraestructura que los sostiene.</p>
        <p>Estudio Ingeniería en Sistemas de Información en la UTN Facultad Regional Córdoba. En proyectos personales, académicos y colaborativos trabajo con backend en Python y Java, arquitectura por capas y hexagonal, pruebas y despliegues con contenedores.</p>
        <p>Desarrollé una aplicación de inventario y ventas que se utiliza diariamente en un comercio minorista desde 2023. Con el tiempo me tocó mantenerla y me encontré con problemas que no había previsto; esa experiencia me llevó a prestar especial atención a cómo separar responsabilidades y a cómo mantener el software a medida que evoluciona.</p>
        <p>Hoy busco construir software que se pueda entender, probar, <strong>mantener y evolucionar</strong>, y seguir aprendiendo y mejorando en el proceso.</p>
        <div class="about-note">${icon('layers')}<span>Mi foco: backend, arquitectura de software,<br class="desktop-break"/> cloud y DevOps.</span></div>
      </div>
    </section>`;
}

function projectsSection(): string {
  const visibleProjects = projects.filter((project) => project.visibility);
  return `<section class="section container" id="proyectos" aria-labelledby="projects-title">
      <div class="section-heading"><h2 id="projects-title">Ideas que llevé al código<span class="title-period">.</span></h2><p>Proyectos personales, académicos y colaborativos,<br class="desktop-break"/> con capturas reales cuando las hay.</p></div>
      <div class="projects-grid">${visibleProjects.map((project) => projectCard(project)).join('')}</div>
      <div class="section-footnote"><span>El código cuenta el resto de la historia.</span><a href="${e(profile.github)}?tab=repositories" ${external} class="text-link">Más en GitHub ${icon('arrow')}</a></div>
    </section>`;
}

function stackSection(): string {
  const groups = skills
    .map(
      (group) =>
        `<article class="skill-group"><div class="skill-top">${icon(group.icon)}</div><h3>${e(group.title)}</h3><ul>${group.items.map((item) => `<li>${e(item)}</li>`).join('')}</ul></article>`,
    )
    .join('');
  return `<section class="section stack-section" id="stack" aria-labelledby="stack-title"><div class="container">
      <div class="section-heading"><h2 id="stack-title">Las herramientas que utilizo<span class="title-period">.</span></h2><p>Tecnologías que usé en mis proyectos,<br class="desktop-break"/> sin niveles inventados.</p></div>
      <div class="skills-grid">${groups}</div>
    </div></section>`;
}

function educationSection(): string {
  const intermediate = profile.intermediateDegree;
  const planned = intermediate.status === 'previsto';
  return `<section class="section container education" id="formacion" aria-labelledby="education-title">
      <div><h2 id="education-title">Una base sólida.<br/><span class="muted-heading">Siempre en construcción.</span></h2><p class="education-intro">Formación técnica, práctica en proyectos<br class="desktop-break"/> y curiosidad para seguir aprendiendo.</p></div>
      <div class="timeline">
        <article class="education-item"><div class="education-meta"><span>2023 — ACTUALIDAD</span><span class="status in-progress">En curso</span></div><h3>Ingeniería en Sistemas<br class="desktop-break"/> de Información</h3><p class="institution">Universidad Tecnológica Nacional · Facultad Regional Córdoba</p><p>${e(profile.academicStatus)} (cierre previsto: ${e(profile.fourthYearCompletion)}). ${e(profile.degreeStatus)}</p><div class="intermediate"><h4>${e(intermediate.name)}</h4><p class="mini-label">TÍTULO INTERMEDIO · ${planned ? 'PREVISTO' : 'OBTENIDO'}</p><p>${planned ? 'Obtención prevista' : 'Obtenido'}: ${e(intermediate.date)}${planned ? '. Sujeto a confirmación.' : '.'}</p></div><p class="academic-date">Estado académico actualizado al <time datetime="${e(profile.reviewedAt)}">${e(formatReviewDate(profile.reviewedAt))}</time>.</p></article>
        <article class="education-item"><div class="education-meta"><span>2016 — 2022</span><span class="status">Título obtenido</span></div><h3>Técnico en Informática<br class="desktop-break"/> Personal y Profesional</h3><p class="institution">IPET N.º 139 Gral. Manuel Belgrano</p><p>Formación secundaria técnica completa.</p></article>
        ${englishProfile()}
      </div>
    </section>`;
}

function contactSection(cv: string): string {
  const email = profile.email
    ? `<div class="email-row"><a class="email-link" href="mailto:${e(profile.email)}"><span>${e(profile.email)}</span> ${icon('arrow')}</a><button class="icon-button copy-email" type="button" data-email="${e(profile.email)}" aria-label="Copiar email" title="Copiar email" hidden>${icon('copy')}</button></div><span class="copy-status" role="status" aria-live="polite"></span>`
    : '';
  return `<section class="contact-section" id="contacto" aria-labelledby="contact-title"><div class="container contact-inner">
      <div><h2 id="contact-title">Una buena conversación<br/>puede ser el próximo <span>paso.</span></h2><p>Si mi perfil encaja con tu equipo o querés conversar<br class="desktop-break"/> sobre un proyecto, me gustaría conocerte.</p>${email}<div class="contact-links"><a class="text-link" href="${e(profile.linkedin)}" ${external}>${icon('linkedin')} LinkedIn ${icon('arrow')}</a><a class="text-link" href="${e(profile.github)}" ${external}>${icon('github')} GitHub ${icon('arrow')}</a>${cv}</div></div>
      <div class="contact-signature" aria-hidden="true">ap<span>.</span></div>
    </div></section>`;
}

function footer(): string {
  return `<footer class="container site-footer"><a class="wordmark" href="#inicio" aria-label="Volver al inicio"><span class="monogram">ap<span>.</span></span></a><p>© <span data-year>${new Date().getFullYear()}</span> ${e(profile.name)} <span class="footer-separator">/</span> Hecho con intención, en Córdoba.</p><a href="#inicio" class="text-link">Volver arriba ${icon('up')}</a></footer>`;
}

export function home(options: PageOptions): string {
  const cv = cvLink(options.cvExists);
  return `<!DOCTYPE html>
<html lang="es-AR">
${head(options)}
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  ${header()}
  <main id="contenido" tabindex="-1">
    ${hero(cv)}
    ${about()}
    ${projectsSection()}
    ${stackSection()}
    ${educationSection()}
    ${contactSection(cv)}
  </main>
  ${footer()}
</body>
</html>`;
}
