import type { Project } from '../data/projects.js';
import { icon } from './icons.js';
import { escape as e, external } from './html.js';
import { gallery } from './media.js';

function statusBadge(project: Project): string {
  const active = project.state !== 'Código disponible';
  return `<span class="status${active ? ' in-progress' : ''}">${active ? '<span class="dot"></span>' : ''}${e(project.state)}</span>`;
}

function links(project: Project): string {
  const demo = project.links.demo
    ? `<a class="button primary compact" href="${e(project.links.demo)}" ${external}>Visitar ${e(project.name)} ${icon('arrow')}</a>`
    : '';
  return `<div class="project-links">${demo}<a class="text-link" href="${e(project.links.repo)}" ${external}>${icon('github')} Ver repositorio ${icon('arrow')}</a></div>`;
}

function notesList(project: Project): string {
  return project.detail
    .map(
      (detail) =>
        `<div class="project-note"><h4>${e(detail.title)}</h4><p>${e(detail.description)}</p></div>`,
    )
    .join('');
}

function content(project: Project, inlineNotes = false): string {
  const notes =
    inlineNotes && project.detail.length > 0
      ? `<div class="project-inline-notes">${notesList(project)}</div>`
      : '';
  return `<div class="project-content">
      <div class="project-topline">${statusBadge(project)}<span class="project-symbol">${icon(project.icon)}</span></div>
      <h3 id="title-${e(project.id)}">${e(project.name)}<span class="title-period">.</span></h3>
      <p class="project-category">${e(project.category)}</p>
      <p class="project-summary">${e(project.summary)}</p>
      <p class="project-role"><span>Mi aporte</span> ${e(project.role)}</p>
      ${notes}
      <ul class="tags" aria-label="Tecnologías de ${e(project.name)}">${project.stack.map((tech) => `<li>${e(tech)}</li>`).join('')}</ul>
      ${links(project)}
    </div>`;
}

function architecture(project: Project): string {
  const diagram = project.architecture;
  if (!diagram) return '';
  const nodes = diagram.nodes
    .map(
      (node, index) =>
        `<li><div class="flow-node${node.emphasized ? ' emphasized' : ''}"><span class="node-icon">${icon(node.icon)}</span><div><strong>${e(node.title)}</strong><small>${e(node.description)}</small></div><span class="node-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span></div>${node.via ? `<div class="flow-connector"><span><span class="visually-hidden">Se conecta mediante </span>${e(node.via)}</span></div>` : ''}</li>`,
    )
    .join('');
  return `<div class="project-architecture">
      <p class="architecture-topline"><span class="dot"></span> ${e(diagram.label)}</p>
      <ol class="flow" aria-label="${e(diagram.label)}">${nodes}</ol>
      <p class="architecture-caption">${e(diagram.caption)}</p>
      <a href="${e(diagram.link.href)}" class="text-link" ${external}>${e(diagram.link.label)} ${icon('arrow')}</a>
    </div>`;
}

function featuredCard(project: Project): string {
  const decisions = project.detail
    .map((detail) => `<div><h4>${e(detail.title)}</h4><p>${e(detail.description)}</p></div>`)
    .join('');
  return `<article class="project-card featured" id="proyecto-${e(project.id)}" aria-labelledby="title-${e(project.id)}">
    ${content(project)}
    ${architecture(project)}
    ${project.media?.length ? `<div class="featured-gallery">${gallery(project.media, project.name, '(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 380px')}</div>` : ''}
    ${decisions ? `<div class="featured-decisions">${decisions}</div>` : ''}
  </article>`;
}

function mediaRowCard(project: Project): string {
  const media = project.media ?? [];
  const notes = notesList(project);
  return `<article class="project-card project-row has-media" id="proyecto-${e(project.id)}" aria-labelledby="title-${e(project.id)}">
    ${content(project)}
    <div class="project-aside">${gallery(media, project.name, '(max-width: 900px) 100vw, 520px')}${notes}</div>
  </article>`;
}

function compactCard(project: Project): string {
  return `<article class="project-card project-compact" id="proyecto-${e(project.id)}" aria-labelledby="title-${e(project.id)}">
    ${content(project, true)}
  </article>`;
}

export function projectCard(project: Project): string {
  if (project.featured) return featuredCard(project);
  if (project.media && project.media.length > 0) return mediaRowCard(project);
  return compactCard(project);
}
