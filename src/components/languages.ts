import { profile } from '../data/profile.js';
import { escape as e, external } from './html.js';
import { icon } from './icons.js';

export function englishProfile(): string {
  const english = profile.english;
  return `<article class="education-item language-profile" aria-labelledby="english-title">
    <h3 id="english-title">Inglés</h3>
    <p class="institution">${e(english.assessment)} · ${e(english.globalLevel)} global · ${english.globalScore}/100</p>
    <p>${e(english.summary)}</p>
    <dl class="language-skills">${english.skills.map((skill) => `<div><dt>${e(skill.name)}</dt><dd>${skill.score}/100 · ${e(skill.level)}</dd></div>`).join('')}</dl>
    <p class="academic-date">${e(english.description)}</p>
    ${english.certificate.linkVerified ? `<a class="text-link" href="${e(english.certificate.url)}" ${external}>Ver certificado EF SET ${icon('arrow')}</a>` : ''}
  </article>`;
}
