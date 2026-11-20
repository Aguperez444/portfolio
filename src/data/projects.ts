import type { IconName } from '../components/icons.js';
import type { ImageId } from './images.js';

export interface ProjectMedia {
  /** Imagen generada por `npm run images` (ver scripts/images.mjs). */
  image: ImageId;
  /** Texto alternativo: describe lo que muestra la captura, no la repite como título. */
  alt: string;
  caption: string;
}

export interface ArchitectureNode {
  icon: IconName;
  title: string;
  description: string;
  /** Etiqueta del conector que sale de este nodo hacia el siguiente. */
  via?: string;
  emphasized?: boolean;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  summary: string;
  stack: string[];
  links: { repo: string; demo?: string };
  state: 'En desarrollo' | 'Código disponible' | 'En uso desde 2023';
  role: string;
  detail: { title: string; description: string }[];
  media?: ProjectMedia[];
  architecture?: {
    label: string;
    nodes: ArchitectureNode[];
    caption: string;
    link: { label: string; href: string };
  };
  visibility: boolean;
  featured: boolean;
  icon: IconName;
  /** Fecha (YYYY-MM-DD) del último contraste del contenido con el repositorio. */
  verifiedAt: string;
}

export const projects: Project[] = [
  {
    id: 'ganker',
    name: 'Ganker',
    category: 'Colaborativo · Aplicación web',
    summary:
      'Una plataforma para encontrar compañeros de juego, formar equipos y conversar. Un proyecto para conectar personas y trabajar los desafíos de un sistema de punta a punta.',
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'React + Vite', 'Docker', 'OCI'],
    links: { repo: 'https://github.com/Aguperez444/Ganker', demo: 'https://gankerweb.app/' },
    state: 'En desarrollo',
    role: 'Lideré el desarrollo del backend, tomé las decisiones de arquitectura y tecnologías y realicé íntegramente el despliegue y la configuración del pipeline CI/CD.',
    detail: [
      {
        title: 'Arquitectura y tecnologías',
        description:
          'Definí la arquitectura del backend y elegí sus tecnologías, separando dominio, casos de uso y adaptadores para la persistencia y los servicios externos.',
      },
      {
        title: 'Comunicación e integraciones',
        description:
          'API REST, WebSockets e integraciones documentadas con Riot Games, Discord y proveedores de autenticación federada.',
      },
      {
        title: 'Despliegue y CI/CD',
        description:
          'Implementé de principio a fin el despliegue en OCI con Docker Compose y Nginx, y el pipeline de CI/CD con GitHub Actions.',
      },
    ],
    media: [
      {
        image: 'ganker-landing',
        alt: 'Página de inicio de Ganker con el lema «Encuentra. Conecta. Compite.» y los juegos soportados.',
        caption: 'Página de inicio',
      },
      {
        image: 'ganker-dashboard',
        alt: 'Panel de usuario de Ganker con perfiles de juego, rangos y roles por juego.',
        caption: 'Panel con perfiles de juego',
      },
      {
        image: 'ganker-login',
        alt: 'Pantalla de inicio de sesión de Ganker con email y acceso mediante Discord, Steam, Twitch y Google.',
        caption: 'Acceso con proveedores externos',
      },
    ],
    architecture: {
      label: 'De la interfaz a los datos',
      nodes: [
        { icon: 'window', title: 'React + Vite', description: 'Interfaz web', via: 'HTTPS' },
        {
          icon: 'server',
          title: 'Nginx',
          description: 'Archivos estáticos · proxy',
          via: 'REST / WebSockets',
        },
        {
          icon: 'code',
          title: 'FastAPI',
          description: 'Dominio · aplicación · adaptadores',
          via: 'SQLAlchemy',
          emphasized: true,
        },
        { icon: 'layers', title: 'PostgreSQL', description: 'Persistencia · migraciones Alembic' },
      ],
      caption:
        'Esquema resumido del despliegue documentado. Nginx sirve el cliente y deriva la API y los WebSockets.',
      link: {
        label: 'Explorar la arquitectura',
        href: 'https://github.com/Aguperez444/Ganker/blob/main/backend/README.md',
      },
    },
    visibility: true,
    featured: true,
    icon: 'network',
    verifiedAt: '2026-11-02',
  },
  {
    id: 'inventario',
    name: 'Inventario y ventas',
    category: 'Solución para comercio real · Aplicación de escritorio',
    summary:
      'Una herramienta para gestionar ventas, reposición de stock, precios y reportes en un comercio minorista. La versión original, desarrollada con Python, Tkinter y SQLite3, se utiliza diariamente desde 2023.',
    stack: ['Python', 'Tkinter', 'SQLite3'],
    links: { repo: 'https://github.com/Aguperez444/app_punto_de_venta' },
    state: 'En uso desde 2023',
    role: 'Desarrollé la aplicación a medida del trabajo diario del local. Más adelante hice un refactor para mejorar su mantenibilidad y aplicar arquitectura hexagonal.',
    detail: [],
    media: [
      {
        image: 'ventas-menu',
        alt: 'Menú principal de la aplicación de escritorio con accesos a búsqueda, alta de productos, precios, ventas y stock.',
        caption: 'Menú principal',
      },
      {
        image: 'ventas-alta',
        alt: 'Formulario de alta de producto con nombre, código, precio, detalle, stock y código de barras.',
        caption: 'Alta de productos',
      },
    ],
    visibility: true,
    featured: false,
    icon: 'box',
    verifiedAt: '2026-11-03',
  },
  {
    id: 'microservicios',
    name: 'Backend de microservicios',
    category: 'Académico / colaborativo',
    summary:
      'Un sistema distribuido con servicios de solicitudes y camiones, un punto de entrada común y control de acceso por roles.',
    stack: ['Java', 'Spring', 'Spring Cloud Gateway', 'Keycloak', 'Docker Compose'],
    links: { repo: 'https://github.com/Aguperez444/backend_contenedores' },
    state: 'Código disponible',
    role: 'Participé en el desarrollo de una solución académica en equipo. Fui el principal responsable de la lógica de negocio y de la conexión de los microservicios con el API Gateway.',
    detail: [
      {
        title: 'Enfoque técnico',
        description:
          'Servicios separados detrás de un API Gateway. Autenticación y autorización mediante Keycloak, OAuth2 y JWT, con un entorno integrado en Docker Compose.',
      },
    ],
    visibility: true,
    featured: false,
    icon: 'network',
    verifiedAt: '2026-11-02',
  },
  {
    id: 'automatizador',
    name: 'Automatizador Desktop',
    category: 'Personal · Automatización en Linux',
    summary:
      'Una utilidad para crear archivos .desktop de ejecutables y scripts, eligiendo el nombre y el ícono desde una interfaz gráfica.',
    stack: ['Python', 'Linux', 'Tkinter'],
    links: { repo: 'https://github.com/Aguperez444/automatizador_desktop' },
    state: 'Código disponible',
    role: 'Desarrollé una herramienta personal para simplificar una tarea cotidiana en Linux.',
    detail: [
      {
        title: 'Alcance',
        description:
          'Generación de lanzadores .desktop para ejecutables como .jar, .AppImage y scripts. Selección de archivo, nombre, ícono y categoría.',
      },
    ],
    visibility: true,
    featured: false,
    icon: 'terminal',
    verifiedAt: '2026-11-03',
  },
  {
    id: 'ups',
    name: 'UPS Web Monitor',
    category: 'Personal · Open source',
    summary:
      'Una API que integra Network UPS Tools para consultar el estado de una UPS desde Linux. Un punto de encuentro entre hardware y backend.',
    stack: ['Python', 'FastAPI', 'NUT', 'Next.js', 'Linux'],
    links: { repo: 'https://github.com/Aguperez444/ups-web-monitor' },
    state: 'En desarrollo',
    role: 'Desarrollo la API y un primer dashboard para consultar el estado de una UPS.',
    detail: [
      {
        title: 'Estado actual',
        description:
          'El backend expone datos de NUT en /ups/raw y /ups/summary, y un primer dashboard en Next.js muestra el resumen. Los gráficos, el historial y las alertas siguen pendientes; no se presentan como funciones terminadas.',
      },
    ],
    media: [
      {
        image: 'ups-dashboard',
        alt: 'Primer dashboard con estado de la UPS, carga, voltajes de entrada, salida y batería, nivel de batería y frecuencia.',
        caption: 'Primer dashboard (en desarrollo)',
      },
    ],
    visibility: true,
    featured: false,
    icon: 'activity',
    verifiedAt: '2026-11-03',
  },
];
