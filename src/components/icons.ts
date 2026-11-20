import { icons, type IconNode } from 'lucide';

const iconMap = {
  arrow: icons.ArrowUpRight,
  right: icons.ArrowRight,
  down: icons.ArrowDown,
  up: icons.ArrowUp,
  github: [
    [
      'path',
      {
        d: 'M9 19c-4.3 1.3-4.3-2.2-6-2.7M15 22v-3.9a3.4 3.4 0 0 0-.9-2.7c3-.3 6.2-1.5 6.2-6.9a5.4 5.4 0 0 0-1.5-3.7 5 5 0 0 0-.1-3.7S17.5.7 14.8 2.5a13 13 0 0 0-7 0C5.1.7 3.9 1.1 3.9 1.1a5 5 0 0 0-.1 3.7 5.4 5.4 0 0 0-1.5 3.7c0 5.4 3.2 6.6 6.2 6.9a3.4 3.4 0 0 0-.9 2.7V22',
      },
    ],
  ],
  linkedin: [
    ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '3' }],
    ['path', { d: 'M7 10v7m0-10v.1M11 17v-7m0 3a3 3 0 0 1 6 0v4' }],
  ],
  file: icons.FileText,
  pin: icons.MapPin,
  sun: icons.Sun,
  moon: icons.Moon,
  monitor: icons.Monitor,
  menu: icons.Menu,
  close: icons.X,
  mail: icons.Mail,
  copy: icons.Copy,
  code: icons.Code2,
  server: icons.Server,
  layers: icons.Layers3,
  cloud: icons.Cloud,
  window: icons.AppWindow,
  check: icons.BadgeCheck,
  box: icons.Package,
  network: icons.Network,
  terminal: icons.SquareTerminal,
  activity: icons.Activity,
  plus: icons.Plus,
  expand: icons.Maximize2,
} satisfies Record<string, IconNode>;

/** Nombres válidos: un error de tipeo falla en `npm run check` en lugar de mostrar otro ícono. */
export type IconName = keyof typeof iconMap;

function renderNode(node: IconNode): string {
  return node
    .map(([tag, attributes]) => {
      const attrs = Object.entries(attributes)
        .map(([key, value]) => ` ${key}="${String(value)}"`)
        .join('');
      return `<${tag}${attrs}></${tag}>`;
    })
    .join('');
}

export function icon(name: IconName, className = ''): string {
  const classes = ['icon', className].filter(Boolean).join(' ');
  return `<svg class="${classes}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${renderNode(iconMap[name])}</svg>`;
}
