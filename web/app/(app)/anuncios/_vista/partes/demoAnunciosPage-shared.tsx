
export interface SampleAdCard {
  id: string;
  title: string;
  status: "Activo";
  clickScore: number;
  resultados: number;
  resultadosBadgeColor: "yellow" | "green";
  gasto: string;
  costoResultado: string;
  clicks: number;
  pctCampana: string;
  aiInsight: string;
}

export const SAMPLE_ADS: SampleAdCard[] = [
  {
    id: "hb-ad-1",
    title: "Publicación de Instagram: Fall in Round Top looks...",
    status: "Activo",
    clickScore: 100,
    resultados: 45,
    resultadosBadgeColor: "yellow",
    gasto: "$425.50",
    costoResultado: "$9.46",
    clicks: 48,
    pctCampana: "19.00%",
    aiInsight:
      "El cartel de 'THE HIVE · Through October 31' genera alta intención presencial en compradores mayoristas de Round Top. Mantén presupuesto activo hasta el cierre del show.",
  },
  {
    id: "hb-ad-2",
    title: "Instagram post: TAXCO QUARTZ FROM GUERRERO,...",
    status: "Activo",
    clickScore: 100,
    resultados: 47,
    resultadosBadgeColor: "green",
    gasto: "$362.83",
    costoResultado: "$7.72",
    clicks: 54,
    pctCampana: "16.00%",
    aiInsight:
      "Mejor volumen de visitas al perfil (47) con excelente eficiencia ($7.72/visita). Mostrar la drusa de cuarzo de Taxco en mano da escala real inmediata.",
  },
  {
    id: "hb-ad-3",
    title: "Publicación de Instagram: Fall in Round Top looks...",
    status: "Activo",
    clickScore: 100,
    resultados: 28,
    resultadosBadgeColor: "yellow",
    gasto: "$323.99",
    costoResultado: "$11.57",
    clicks: 46,
    pctCampana: "15.00%",
    aiInsight:
      "Variación de audiencia abierta para The Fall Show. Buen CTR inicial; considera rotar hacia el formato de video en mano para bajar el costo por resultado.",
  },
  {
    id: "hb-ad-4",
    title: "Instagram post: 💜VERACRUZ AMETHYST | TATATILA,...",
    status: "Activo",
    clickScore: 100,
    resultados: 39,
    resultadosBadgeColor: "yellow",
    gasto: "$298.40",
    costoResultado: "$7.65",
    clicks: 44,
    pctCampana: "13.37%",
    aiInsight:
      "El costo por visita más bajo del top 4 ($7.65). El contraste de la amatista de Tatatila, Veracruz en primer plano detiene el scroll en los primeros 1.5 segundos.",
  },
  {
    id: "hb-ad-5",
    title: "Instagram post: 🎃 MineraliA LIVE SALE — Rare Specimens...",
    status: "Activo",
    clickScore: 100,
    resultados: 34,
    resultadosBadgeColor: "green",
    gasto: "$248.10",
    costoResultado: "$7.30",
    clicks: 41,
    pctCampana: "11.12%",
    aiInsight:
      "Anuncio de urgencia para transmisión en vivo (@amethysts.us). Convierte muy bien en recordatorios y mensajes directos previos al Live.",
  },
  {
    id: "hb-ad-6",
    title: "Instagram post: MineraliA LIVE SALE — Wholesale Lot...",
    status: "Activo",
    clickScore: 100,
    resultados: 29,
    resultadosBadgeColor: "yellow",
    gasto: "$214.60",
    costoResultado: "$7.40",
    clicks: 36,
    pctCampana: "9.62%",
    aiInsight:
      "Segmentación de dueños de boutiques de decoración y wellness. Excelente retención visual por el titular amarillo de alto contraste.",
  },
  {
    id: "hb-ad-7",
    title: "Publicación de Instagram: Fall in Round Top looks...",
    status: "Activo",
    clickScore: 100,
    resultados: 24,
    resultadosBadgeColor: "yellow",
    gasto: "$189.40",
    costoResultado: "$7.89",
    clicks: 31,
    pctCampana: "8.49%",
    aiInsight:
      "Retargeting de visitantes del perfil en Texas y compradores mayoristas recurrentes.",
  },
  {
    id: "hb-ad-8",
    title: "Publicación de Instagram: 🐝 LAST DAYS — BEE HERE BEFORE IT ENDS...",
    status: "Activo",
    clickScore: 100,
    resultados: 22,
    resultadosBadgeColor: "green",
    gasto: "$168.39",
    costoResultado: "$7.65",
    clicks: 29,
    pctCampana: "7.40%",
    aiInsight:
      "Creativo de cierre de temporada ('LAST DAYS · BEE HERE BEFORE IT ENDS'). Alta tasa de clics en ubicación y cómo llegar.",
  },
];

export function ExampleTag() {
  return (
    <span
      style={{
        flexShrink: 0,
        background: "var(--ui-muted)",
        color: "var(--ui-text-3)",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
      }}
    >
      Ejemplo
    </span>
  );
}

export const SUBNAV_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "6px 14px",
  borderRadius: 999,
  color: "var(--ui-text-3)",
  fontWeight: 500,
  fontSize: 13,
  textDecoration: "none",
};
