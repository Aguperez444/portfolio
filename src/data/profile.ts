import type { IconName } from '../components/icons.js';

export const profile = {
  name: 'Agustín Perez',
  headline: 'Estudiante avanzado de Ingeniería en Sistemas de Información',
  location: 'Córdoba, Argentina',
  portrait: {
    image: 'portrait' as const,
    alt: 'Retrato de Agustín Perez.',
  },
  email: 'agustinperez444@gmail.com',
  github: 'https://github.com/Aguperez444',
  linkedin: 'https://www.linkedin.com/in/agust%C3%ADn-perez-772308224/',
  cv: '/cv-11-2026.pdf',
  reviewedAt: '2026-11-02',
  academicStatus: 'Finalizando 4.º año',
  degreeStatus: 'Cursado de 5.º año previsto para 2027.',
  fourthYearCompletion: '19/11/2026',
  intermediateDegree: {
    name: 'Analista Universitario en Sistemas de Información',
    status: 'previsto' as 'previsto' | 'obtenido',
    date: '24/11/2026',
  },
  english: {
    assessment: 'EF SET',
    description: 'Examen de 90 minutos · noviembre de 2026',
    globalScore: 66,
    globalLevel: 'C1',
    summary: 'Comprensión C2; expresión B1.',
    skills: [
      { name: 'Lectura', score: 82, level: 'C2' },
      { name: 'Escucha', score: 84, level: 'C2' },
      { name: 'Expresión escrita', score: 48, level: 'B1' },
      { name: 'Expresión oral', score: 48, level: 'B1' },
    ],
    certificate: { url: 'https://cert.efset.org/es/Qgv7n9', linkVerified: true },
  },
};

export const skills: { title: string; icon: IconName; items: string[] }[] = [
  { title: 'Lenguajes', icon: 'code', items: ['Python', 'Java', 'JavaScript'] },
  {
    title: 'Backend e integraciones',
    icon: 'server',
    items: ['FastAPI', 'Spring', 'Pydantic', 'REST', 'WebSockets', 'OAuth2 / JWT'],
  },
  {
    title: 'Arquitectura y datos',
    icon: 'layers',
    items: [
      'Arquitectura hexagonal',
      'Diseño por capas',
      'Repositorios',
      'Unit of Work',
      'SQLAlchemy',
      'PostgreSQL',
      'SQLite',
      'Alembic',
    ],
  },
  {
    title: 'Infraestructura y entrega',
    icon: 'cloud',
    items: ['Linux', 'Docker / Compose', 'Nginx', 'Oracle Cloud (OCI)', 'GitHub Actions', 'Git'],
  },
  {
    title: 'Frontend',
    icon: 'window',
    items: ['React', 'Vite', 'Tailwind CSS'],
  },
  {
    title: 'Calidad',
    icon: 'check',
    items: ['Pytest', 'Vitest', 'Pruebas unitarias', 'Pruebas de integración'],
  },
];

export function formatReviewDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw new Error('reviewedAt debe ser una fecha válida con formato YYYY-MM-DD.');
  }
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}
