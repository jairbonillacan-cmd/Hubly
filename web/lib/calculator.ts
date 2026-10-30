/**
 * Motor matemático y de precios de Hubly para agencias
 */

export type Currency = "mxn" | "usd" | "eur";

export interface HoursSavedInputs {
  /** Cantidad de marcas gestionadas por la agencia (1-30) */
  brands: number;
  /** Publicaciones promedio mensuales por cada marca (0-60) */
  postsPerBrand: number;
  /** Horas invertidas en compilar y analizar un reporte mensual (0-8) */
  reportHours: number;
  /** Horas dedicadas a maquetar y acordar una parrilla mensual (0-4) */
  gridHours: number;
  /** Minutos dedicados a subir, configurar y programar cada post (0-15) */
  postMinutes: number;
}

export interface HoursSavedResult {
  /** Horas totales mensuales en reportes (brands * reportHours) */
  reportHoursTotal: number;
  /** Horas totales mensuales en parrillas (brands * gridHours) */
  gridHoursTotal: number;
  /** Horas totales mensuales en programación ((brands * posts * postMinutes) / 60) */
  scheduleHoursTotal: number;
  /** Total mensual de horas operativas redondeadas */
  totalHours: number;
  /** Equivalente en jornadas laborales estándar de 8 horas (1 decimal) */
  workdays: number;
}

export interface TierItem {
  id: string;
  name: string;
  brandFrom: number;
  brandTo: number | null;
  count: number;
  unitPrice: number;
  amount: number;
  isIncluded: boolean;
  isActive: boolean;
}

export interface VolumePricingResult {
  totalBrands: number;
  basePlan: {
    name: string;
    brandsIncluded: number;
    basePrice: number;
  };
  extraBrandsCount: number;
  tiers: TierItem[];
  totalPrice: number;
  flatPrice: number;
  monthlySavings: number;
  annualSavings: number;
}

export const CURRENCY_CONFIG: Record<
  Currency,
  { symbol: string; code: string; locale: string; name: string }
> = {
  mxn: { symbol: "$", code: "MXN", locale: "es-MX", name: "Pesos (MXN)" },
  usd: { symbol: "$", code: "USD", locale: "en-US", name: "Dólares (USD)" },
  eur: { symbol: "€", code: "EUR", locale: "es-ES", name: "Euros (EUR)" },
};

export const PRICING_CONSTANTS = {
  v3: {
    solo: {
      prices: { mxn: 390, usd: 24, eur: 24 },
      maxBrands: 2,
      extraBrandPrices: { mxn: 195, usd: 12, eur: 12 },
      baseUsers: 1,
      maxTotalUsers: 3,
      extraUserPrices: { mxn: 95, usd: 6, eur: 6 },
      includedTasksMonthly: 150,
    },
    estudio: {
      prices: { mxn: 1950, usd: 120, eur: 120 },
      baseUsers: 10,
      maxBrands: 10,
      includedTasksMonthly: 750,
      extraBrandTiers: [
        { upTo: 15, prices: { mxn: 195, usd: 12, eur: 12 } }, // Marcas 11 a 25 (hasta 15 extras)
        { upTo: 40, prices: { mxn: 170, usd: 10.5, eur: 10.5 } }, // Marcas 26 a 50 (siguientes 25 extras)
        { upTo: 90, prices: { mxn: 150, usd: 9.25, eur: 9.25 } }, // Marcas 51 a 100 (siguientes 50 extras)
        { upTo: null, prices: { mxn: 130, usd: 8, eur: 8 } }, // Marcas 101+ (extras superiores a 90)
      ],
      extraUserPrices: { mxn: 95, usd: 6, eur: 6 },
    },
  },
  defaultHourlyRate: {
    mxn: 350,
    usd: 25,
    eur: 25,
  },
};

/**
 * FÓRMULA 1: Cálculo exacto de horas ahorradas
 *
 * Horas = Math.round(brands * reportHours + brands * gridHours + (brands * postsPerBrand * postMinutes) / 60)
 * Jornadas = Math.round((total / 8) * 10) / 10
 */
export function calculateHoursSaved(inputs: HoursSavedInputs): HoursSavedResult {
  const { brands, postsPerBrand, reportHours, gridHours, postMinutes } = inputs;
  const reportHoursTotal = brands * reportHours;
  const gridHoursTotal = brands * gridHours;
  const scheduleHoursTotal = (brands * postsPerBrand * postMinutes) / 60;
  const total = reportHoursTotal + gridHoursTotal + scheduleHoursTotal;

  return {
    reportHoursTotal,
    gridHoursTotal,
    scheduleHoursTotal,
    totalHours: Math.round(total),
    workdays: Math.round((total / 8) * 10) / 10,
  };
}

/**
 * FÓRMULA 2: Cálculo de precios por tramos de volumen (Plan Estudio)
 *
 * Desglosa las marcas extras en los tramos progresivos no retroactivos:
 * - 1–10: Plan Estudio ($1,950 MXN)
 * - 11–25: $195 MXN/marca
 * - 26–50: $170 MXN/marca
 * - 51–100: $150 MXN/marca
 * - 101+: $130 MXN/marca
 */
export function calculateVolumePricing(
  totalBrands: number,
  currency: Currency = "mxn"
): VolumePricingResult {
  const plan = PRICING_CONSTANTS.v3.estudio;
  const basePrice = plan.prices[currency];
  const brandsIncluded = plan.maxBrands;
  const extraBrandsCount = Math.max(0, totalBrands - brandsIncluded);

  const rawTiers = plan.extraBrandTiers;
  const tierItems: TierItem[] = [];

  // Tramo Base (Marcas 1–10)
  tierItems.push({
    id: "base",
    name: "Marcas 1–10",
    brandFrom: 1,
    brandTo: 10,
    count: Math.min(totalBrands, 10),
    unitPrice: basePrice,
    amount: basePrice,
    isIncluded: true,
    isActive: totalBrands >= 1,
  });

  let previousUpTo = 0;
  let remainingExtras = extraBrandsCount;

  for (let i = 0; i < rawTiers.length; i++) {
    const tier = rawTiers[i];
    const tierCapacity = tier.upTo !== null ? tier.upTo - previousUpTo : Infinity;
    const countInTier = Math.max(0, Math.min(remainingExtras, tierCapacity));
    const unitPrice = tier.prices[currency];
    const brandFrom = brandsIncluded + previousUpTo + 1;
    const brandTo = tier.upTo !== null ? brandsIncluded + tier.upTo : null;

    tierItems.push({
      id: `tier-${i + 1}`,
      name: brandTo ? `Marcas ${brandFrom}–${brandTo}` : `Marcas ${brandFrom}+`,
      brandFrom,
      brandTo,
      count: countInTier,
      unitPrice,
      amount: countInTier * unitPrice,
      isIncluded: false,
      isActive: totalBrands >= brandFrom,
    });

    remainingExtras = Math.max(0, remainingExtras - countInTier);
    if (tier.upTo !== null) {
      previousUpTo = tier.upTo;
    }
  }

  const extraBrandsCost = tierItems
    .filter((t) => !t.isIncluded)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPrice = basePrice + extraBrandsCost;

  // Precio plano de comparación (si todas las marcas extras costaran la tarifa base de $195 MXN)
  const tier1UnitPrice = rawTiers[0].prices[currency];
  const flatPrice = basePrice + extraBrandsCount * tier1UnitPrice;
  const monthlySavings = Math.max(0, flatPrice - totalPrice);
  const annualSavings = monthlySavings * 12;

  return {
    totalBrands,
    basePlan: {
      name: "Plan Estudio",
      brandsIncluded,
      basePrice,
    },
    extraBrandsCount,
    tiers: tierItems,
    totalPrice,
    flatPrice,
    monthlySavings,
    annualSavings,
  };
}

/**
 * Formatea un número según la moneda activa
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  return `${config.symbol}${amount.toLocaleString(config.locale)}`;
}
