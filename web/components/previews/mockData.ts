import type { PreviewPost } from "./types";

export const MOCK_INSTAGRAM_FEED_POST: PreviewPost = {
  id: "ig-feed-1",
  platform: "instagram",
  format: "feed",
  author: {
    name: "Café Lunar",
    handle: "@cafelunar_mx",
    avatarUrl: "",
    initials: "CL",
    verified: true,
    role: "Tostaduría de Especialidad",
  },
  content:
    "De la finca a tu taza sin atajos. Nuestro nuevo lote de Caturra amarillo proviene de fincas regenerativas en Veracruz a 1,450 msnm. Notas de mandarina, panela y cacao tostado. ¿Ya lo probaste en tu método favorito?",
  tags: ["cafedeespecialidad", "veracruz", "caturra", "tostadoartesanal", "specialtycoffee"],
  location: "Coyoacán, Ciudad de México",
  publishedAt: "Hace 2 horas",
  status: "pending",
  metrics: {
    likes: 1842,
    comments: 48,
    saves: 312,
    shares: 95,
  },
  media: [
    {
      type: "cover",
      coverKind: "beans",
      aspectRatio: "1:1",
      alt: "Granos de café tostado de especialidad",
    },
    {
      type: "cover",
      coverKind: "cup",
      aspectRatio: "1:1",
      alt: "Taza de café recién filtrado",
    },
    {
      type: "cover",
      coverKind: "sun",
      aspectRatio: "1:1",
      alt: "Finca de café al amanecer",
    },
  ],
  comments: [
    {
      id: "c1",
      author: "sofia_barista",
      handle: "sofia_barista",
      text: "¡El perfil en Chemex queda espectacular! Notas súper limpias.",
      timeAgo: "1 h",
      likes: 12,
    },
    {
      id: "c2",
      author: "diego_brew",
      handle: "diego_brew",
      text: "¿Cuándo llega la molienda para AeroPress a la tienda en línea?",
      timeAgo: "45 min",
      likes: 4,
    },
  ],
};

export const MOCK_INSTAGRAM_REEL_POST: PreviewPost = {
  id: "ig-reel-1",
  platform: "instagram",
  format: "reel",
  author: {
    name: "Café Lunar",
    handle: "@cafelunar_mx",
    avatarUrl: "",
    initials: "CL",
    verified: true,
  },
  content:
    "Prensa francesa en 4 minutos. ☕️ Cuatro minutos, una prensa y cero pretextos. Te dejamos la receta exacta: 20g de café molienda gruesa por 300g de agua a 92°C. Guarda este reel para tu café de mañana.",
  tags: ["prensafrancesa", "recetasdecafe", "baristalife", "cafeina"],
  publishedAt: "Hace 4 horas",
  status: "approved",
  metrics: {
    likes: 14250,
    comments: 320,
    saves: 4120,
    shares: 890,
  },
  audioTrack: {
    title: "Morning Routine Lo-Fi Vibes",
    artist: "Café Lunar Audio",
    isOriginal: true,
  },
  media: [
    {
      type: "cover",
      coverKind: "steam",
      aspectRatio: "9:16",
      duration: "0:42",
      alt: "Prensa francesa paso a paso en video",
    },
  ],
};

export const MOCK_TIKTOK_POST: PreviewPost = {
  id: "tiktok-1",
  platform: "tiktok",
  format: "video",
  author: {
    name: "Café Lunar",
    handle: "@cafelunar",
    avatarUrl: "",
    initials: "CL",
    verified: true,
  },
  content:
    "El truco definitivo para que tu café no amargue nunca más. 😱 No uses agua hirviendo directamente de la tetera. Espera 45 segundos antes de verter. Pruébalo y cuéntanos la diferencia en los comentarios.",
  tags: ["coffeetips", "hackscafeteros", "aprendeentiktok", "coffeecommunity"],
  status: "pending",
  metrics: {
    likes: 48900,
    comments: 1340,
    saves: 9420,
    shares: 3120,
  },
  audioTrack: {
    title: "Original Sound - Barista Tips México",
    artist: "Café Lunar",
    isOriginal: true,
  },
  media: [
    {
      type: "cover",
      coverKind: "cup",
      aspectRatio: "9:16",
      duration: "0:35",
      alt: "Tutorial de preparación de café sin amargor",
    },
  ],
};

export const MOCK_FACEBOOK_POST: PreviewPost = {
  id: "fb-1",
  platform: "facebook",
  format: "feed",
  author: {
    name: "Café Lunar México",
    handle: "cafelunarmx",
    avatarUrl: "",
    initials: "CL",
    verified: true,
    role: "Empresa de alimentos y bebidas",
  },
  content:
    "¡Nuevo café de temporada disponible! ☀️\n\nDirecto desde los cafetales de altura en Huatusco, Veracruz. Un proceso lavado con fermentación controlada de 36 horas que resalta notas dulces de caramelo y manzana verde.\n\nPídelo hoy en grano entero o con molienda personalizada y recíbelo fresco en tu puerta en 24-48 horas con envío sin costo en compras mayores a $499 MXN.",
  tags: ["CafeDeMexico", "Huatusco", "TuesteFresco"],
  publishedAt: "Hace 3 horas",
  status: "changes",
  metrics: {
    likes: 540,
    comments: 63,
    shares: 28,
  },
  media: [
    {
      type: "cover",
      coverKind: "sun",
      aspectRatio: "16:9",
      alt: "Bolsa de Café Lunar Huatusco edición especial",
    },
  ],
  linkPreview: {
    url: "https://cafelunar.mx/tienda/huatusco-lavado",
    domain: "CAFELUNAR.MX",
    title: "Café Huatusco Lavado 250g — Edición Limitada",
    description: "Tostado fresco bajo demanda. Notas de manzana verde, caramelo y lima.",
  },
};

export const MOCK_LINKEDIN_POST: PreviewPost = {
  id: "li-1",
  platform: "linkedin",
  format: "feed",
  author: {
    name: "Café Lunar Wholesale",
    handle: "cafelunar-wholesale",
    avatarUrl: "",
    initials: "CL",
    verified: true,
    role: "Café de Especialidad Corporativo & Soluciones B2B • 14,800 seguidores",
  },
  content:
    "¿Sabías que el 72% de los colaboradores considera que un buen café en la oficina influye directamente en su bienestar diario?\n\nEn Café Lunar diseñamos programas de café corporativo que combinan máquinas de espresso profesionales con granos tostados semanalmente y capacitación para tu equipo de hospitalidad.\n\nSin contratos forzosos y con soporte técnico local en menos de 4 horas. Conoce cómo estamos transformando los espacios de trabajo en CDMX, Guadalajara y Monterrey.",
  tags: ["EmployeeExperience", "OfficeLife", "B2B", "CulturaCorporativa", "Hospitality"],
  publishedAt: "Hace 1 hora",
  status: "approved",
  metrics: {
    likes: 724,
    comments: 86,
    reposts: 31,
  },
  media: [
    {
      type: "cover",
      coverKind: "steam",
      aspectRatio: "1.91:1",
      alt: "Estación de café corporativo para empresas",
    },
  ],
  comments: [
    {
      id: "lc1",
      author: "Mariana Treviño",
      handle: "mariana-trevino",
      text: "Implementamos el programa en nuestras oficinas de Polanco hace 3 meses y el feedback del equipo ha sido excepcional.",
      timeAgo: "40 min",
      likes: 18,
    },
  ],
};

export const ALL_MOCK_POSTS: Record<string, PreviewPost> = {
  instagramFeed: MOCK_INSTAGRAM_FEED_POST,
  instagramReel: MOCK_INSTAGRAM_REEL_POST,
  tiktok: MOCK_TIKTOK_POST,
  facebook: MOCK_FACEBOOK_POST,
  linkedin: MOCK_LINKEDIN_POST,
};
