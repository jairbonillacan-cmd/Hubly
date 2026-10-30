"use client";

import { useState, useMemo, type ChangeEvent } from "react";
import { Check, ArrowRight, Minus, Plus, Sparkles, Clock, TrendingUp } from "lucide-react";

import {
  type Currency,
  type HoursSavedInputs,
  type HoursSavedResult,
  type TierItem,
  type VolumePricingResult,
  CURRENCY_CONFIG,
  PRICING_CONSTANTS,
  calculateHoursSaved,
  calculateVolumePricing,
  formatCurrency,
} from "../lib/calculator";

export type {
  Currency,
  HoursSavedInputs,
  HoursSavedResult,
  TierItem,
  VolumePricingResult,
};

export {
  CURRENCY_CONFIG,
  PRICING_CONSTANTS,
  calculateHoursSaved,
  calculateVolumePricing,
  formatCurrency,
};

export interface AgencyCalculatorProps {
  /** Número inicial de marcas (por defecto: 6) */
  initialBrands?: number;
  /** Posts mensuales por marca iniciales (por defecto: 12) */
  initialPostsPerBrand?: number;
  /** Horas de reporte iniciales (por defecto: 4) */
  initialReportHours?: number;
  /** Horas de parrilla iniciales (por defecto: 1.5) */
  initialGridHours?: number;
  /** Minutos para programar un post iniciales (por defecto: 6) */
  initialPostMinutes?: number;
  /** Moneda inicial activa (por defecto: "mxn") */
  defaultCurrency?: Currency;
  /** Pestaña activa inicial (por defecto: "hours") */
  defaultTab?: "hours" | "pricing" | "roi";
  /** Callback opcional al hacer clic en el botón de acción principal */
  onCtaClick?: (details: {
    tab: "hours" | "pricing" | "roi";
    brands: number;
    hoursSaved: number;
    monthlyPrice: number;
    currency: Currency;
  }) => void;
  /** Texto del botón CTA */
  ctaLabel?: string;
  /** Clases CSS adicionales */
  className?: string;
  /** Si se omite el encabezado descriptivo */
  hideHeader?: boolean;
}

/**
 * Componente interactivo AgencyCalculator
 *
 * Implementa de manera fidedigna:
 * 1. Calculadora de Horas de Henry (/calculadora)
 * 2. Calculadora de Escalado de Precios por Volumen (/lp/pricing)
 * 3. Proyector de ROI y Nómina Recuperada para Agencias
 *
 * Diseñado bajo el sistema visual Hubly (DESIGN.md):
 * - Colores: --ink, --surface, --ground, --green, --yellow, --coral, --lilac
 * - Tipografía: Bricolage Grotesque (titulares) y Figtree (interfaz)
 * - Botones primarios verdes de 52px de alto
 */
export function AgencyCalculator({
  initialBrands = 6,
  initialPostsPerBrand = 12,
  initialReportHours = 4,
  initialGridHours = 1.5,
  initialPostMinutes = 6,
  defaultCurrency = "mxn",
  defaultTab = "hours",
  onCtaClick,
  ctaLabel,
  className = "",
  hideHeader = false,
}: AgencyCalculatorProps) {
  const [activeTab, setActiveTab] = useState<"hours" | "pricing" | "roi">(defaultTab);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  // Estados de la calculadora de horas
  const [brands, setBrands] = useState<number>(initialBrands);
  const [postsPerBrand, setPostsPerBrand] = useState<number>(initialPostsPerBrand);
  const [reportHours, setReportHours] = useState<number>(initialReportHours);
  const [gridHours, setGridHours] = useState<number>(initialGridHours);
  const [postMinutes, setPostMinutes] = useState<number>(initialPostMinutes);

  // Estados de la calculadora de volumen
  const [pricingBrands, setPricingBrands] = useState<number>(Math.max(10, initialBrands));

  // Estados del estimador de ROI
  const [hourlyWage, setHourlyWage] = useState<number>(PRICING_CONSTANTS.defaultHourlyRate[currency]);

  // Cálculos reactivos de horas
  const hoursResult = useMemo(() => {
    return calculateHoursSaved({
      brands,
      postsPerBrand,
      reportHours,
      gridHours,
      postMinutes,
    });
  }, [brands, postsPerBrand, reportHours, gridHours, postMinutes]);

  // Cálculos reactivos de precios
  const pricingResult = useMemo(() => {
    return calculateVolumePricing(pricingBrands, currency);
  }, [pricingBrands, currency]);

  // Cálculos de ROI unificado
  const roiCalculations = useMemo(() => {
    const hoursForRoi = calculateHoursSaved({
      brands: pricingBrands,
      postsPerBrand,
      reportHours,
      gridHours,
      postMinutes,
    });

    const monthlyPayrollSaved = hoursForRoi.totalHours * hourlyWage;
    const subscriptionCost = pricingResult.totalPrice;
    const netMonthlyBenefit = monthlyPayrollSaved - subscriptionCost;
    const roiMultiplier =
      subscriptionCost > 0 ? (monthlyPayrollSaved / subscriptionCost).toFixed(1) : "0.0";

    return {
      hoursSaved: hoursForRoi.totalHours,
      workdays: hoursForRoi.workdays,
      payrollValue: monthlyPayrollSaved,
      subscriptionCost,
      netBenefit: netMonthlyBenefit,
      multiplier: roiMultiplier,
    };
  }, [pricingBrands, postsPerBrand, reportHours, gridHours, postMinutes, hourlyWage, pricingResult]);

  function handleTriggerCta() {
    if (onCtaClick) {
      onCtaClick({
        tab: activeTab,
        brands: activeTab === "hours" ? brands : pricingBrands,
        hoursSaved: activeTab === "hours" ? hoursResult.totalHours : roiCalculations.hoursSaved,
        monthlyPrice: pricingResult.totalPrice,
        currency,
      });
    }
  }

  // Progreso del slider de volumen de 1 a 150
  const sliderPercentage = ((pricingBrands - 1) / (150 - 1)) * 100;

  return (
    <section
      className={`w-full max-w-4xl mx-auto rounded-[24px] p-6 sm:p-9 md:p-10 transition-all ${className}`}
      style={{
        backgroundColor: "var(--surface, #ffffff)",
        border: "1px solid var(--line, #dde5da)",
        boxShadow: "var(--shadow-window, 0 24px 60px -24px rgba(16, 41, 31, 0.20))",
        color: "var(--ink, #10291f)",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      {/* Encabezado del componente */}
      {!hideHeader && (
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-[0.14em] mb-3"
            style={{
              backgroundColor: "var(--green-pale, #dcf5e6)",
              color: "var(--green, #0a7a55)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Calculadora para Agencias</span>
          </div>

          <h2
            className="text-[32px] sm:text-[42px] font-bold leading-[1.08] tracking-[-0.03em] m-0"
            style={{
              fontFamily: "var(--display, var(--font-bricolage, system-ui))",
              color: "var(--ink, #10291f)",
            }}
          >
            {activeTab === "hours" && "¿Cuántas horas te come lo aburrido?"}
            {activeTab === "pricing" && "¿Cuántas marcas manejas? Pagas menos por cada una."}
            {activeTab === "roi" && "El retorno real de operar con Hubly"}
          </h2>

          <p
            className="mt-3 text-[16px] sm:text-[17px] leading-[1.5]"
            style={{ color: "var(--ink-soft, #456256)" }}
          >
            {activeTab === "hours" && "Pon tus propios números — reportes, parrillas y publicación en tiempo real."}
            {activeTab === "pricing" && "Sin llamadas con ventas ni regateos: descuentos progresivos transparentes."}
            {activeTab === "roi" && "Compara las horas de nómina recuperadas contra el costo mensual de la herramienta."}
          </p>
        </header>
      )}

      {/* Barra de selector de pestaña y selector de moneda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b"
        style={{ borderColor: "var(--line, #dde5da)" }}
      >
        {/* Selector de pestañas */}
        <div
          role="tablist"
          aria-label="Vistas de la calculadora"
          className="inline-flex p-1 rounded-[16px] w-full sm:w-auto"
          style={{ backgroundColor: "var(--ground, #f6f5f0)" }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "hours"}
            onClick={() => setActiveTab("hours")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13.5px] font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === "hours" ? "var(--surface, #ffffff)" : "transparent",
              color: activeTab === "hours" ? "var(--ink, #10291f)" : "var(--ink-soft, #456256)",
              boxShadow: activeTab === "hours" ? "0 2px 8px rgba(16, 41, 31, 0.08)" : "none",
            }}
          >
            <Clock className="w-4 h-4" />
            <span>Horas Ahorradas</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pricing"}
            onClick={() => setActiveTab("pricing")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13.5px] font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === "pricing" ? "var(--surface, #ffffff)" : "transparent",
              color: activeTab === "pricing" ? "var(--ink, #10291f)" : "var(--ink-soft, #456256)",
              boxShadow: activeTab === "pricing" ? "0 2px 8px rgba(16, 41, 31, 0.08)" : "none",
            }}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Precios & Volumen</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "roi"}
            onClick={() => setActiveTab("roi")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] text-[13.5px] font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === "roi" ? "var(--surface, #ffffff)" : "transparent",
              color: activeTab === "roi" ? "var(--ink, #10291f)" : "var(--ink-soft, #456256)",
              boxShadow: activeTab === "roi" ? "0 2px 8px rgba(16, 41, 31, 0.08)" : "none",
            }}
          >
            <Sparkles className="w-4 h-4 text-[#ffd23f]" />
            <span>Retorno de Inversión</span>
          </button>
        </div>

        {/* Selector de moneda */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <span className="text-[12px] font-medium" style={{ color: "var(--ink-soft, #456256)" }}>
            Moneda:
          </span>
          <div className="inline-flex rounded-[10px] p-0.5 border" style={{ borderColor: "var(--line, #dde5da)", backgroundColor: "var(--ground, #f6f5f0)" }}>
            {(["mxn", "usd", "eur"] as Currency[]).map((cur) => (
              <button
                key={cur}
                type="button"
                onClick={() => setCurrency(cur)}
                className="px-2.5 py-1 text-[11.5px] font-bold rounded-[8px] uppercase transition-colors cursor-pointer"
                style={{
                  backgroundColor: currency === cur ? "var(--surface, #ffffff)" : "transparent",
                  color: currency === cur ? "var(--green, #0a7a55)" : "var(--ink-soft, #456256)",
                  boxShadow: currency === cur ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PESTAÑA 1: CALCULADORA DE HORAS AHORRADAS (Ruta /calculadora de Henry) */}
      {/* ==================================================================== */}
      {activeTab === "hours" && (
        <div className="space-y-8">
          {/* Tarjeta de controles con los 5 sliders exactos */}
          <div
            className="rounded-[20px] p-6 sm:p-7 border"
            style={{
              backgroundColor: "var(--ground, #f6f5f0)",
              borderColor: "var(--line, #dde5da)",
            }}
          >
            {/* Control 1: Marcas que manejas */}
            <div className="py-3.5 border-b" style={{ borderColor: "var(--line, #dde5da)" }}>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="calc-brands" className="text-[14.5px] font-semibold" style={{ color: "var(--ink, #10291f)" }}>
                  Marcas que manejas
                </label>
                <span className="text-[17px] font-bold tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                  {brands} marcas
                </span>
              </div>
              <input
                id="calc-brands"
                type="range"
                min={1}
                max={30}
                step={1}
                value={brands}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBrands(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer h-2 rounded-lg"
                style={{ accentColor: "var(--green, #0a7a55)" }}
                aria-label="Marcas que manejas"
              />
            </div>

            {/* Control 2: Posts al mes por marca */}
            <div className="py-3.5 border-b" style={{ borderColor: "var(--line, #dde5da)" }}>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="calc-posts" className="text-[14.5px] font-semibold" style={{ color: "var(--ink, #10291f)" }}>
                  Posts al mes por marca
                </label>
                <span className="text-[17px] font-bold tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                  {postsPerBrand} posts
                </span>
              </div>
              <input
                id="calc-posts"
                type="range"
                min={0}
                max={60}
                step={1}
                value={postsPerBrand}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPostsPerBrand(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer h-2 rounded-lg"
                style={{ accentColor: "var(--green, #0a7a55)" }}
                aria-label="Posts al mes por marca"
              />
            </div>

            {/* Control 3: Lo que te toma un reporte */}
            <div className="py-3.5 border-b" style={{ borderColor: "var(--line, #dde5da)" }}>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="calc-reports" className="text-[14.5px] font-semibold" style={{ color: "var(--ink, #10291f)" }}>
                  Lo que te toma un reporte
                </label>
                <span className="text-[17px] font-bold tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                  {reportHours} hrs
                </span>
              </div>
              <input
                id="calc-reports"
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={reportHours}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setReportHours(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer h-2 rounded-lg"
                style={{ accentColor: "var(--green, #0a7a55)" }}
                aria-label="Lo que te toma un reporte"
              />
            </div>

            {/* Control 4: Lo que te toma una parrilla */}
            <div className="py-3.5 border-b" style={{ borderColor: "var(--line, #dde5da)" }}>
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="calc-grid" className="text-[14.5px] font-semibold" style={{ color: "var(--ink, #10291f)" }}>
                  Lo que te toma una parrilla
                </label>
                <span className="text-[17px] font-bold tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                  {gridHours} hrs
                </span>
              </div>
              <input
                id="calc-grid"
                type="range"
                min={0}
                max={4}
                step={0.5}
                value={gridHours}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setGridHours(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer h-2 rounded-lg"
                style={{ accentColor: "var(--green, #0a7a55)" }}
                aria-label="Lo que te toma una parrilla"
              />
            </div>

            {/* Control 5: Programar cada post */}
            <div className="pt-3.5">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor="calc-post-min" className="text-[14.5px] font-semibold" style={{ color: "var(--ink, #10291f)" }}>
                  Programar cada post
                </label>
                <span className="text-[17px] font-bold tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                  {postMinutes} min
                </span>
              </div>
              <input
                id="calc-post-min"
                type="range"
                min={0}
                max={15}
                step={1}
                value={postMinutes}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPostMinutes(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer h-2 rounded-lg"
                style={{ accentColor: "var(--green, #0a7a55)" }}
                aria-label="Programar cada post"
              />
            </div>
          </div>

          {/* Resultado de horas perdidas */}
          <div className="text-center rounded-[20px] p-6 sm:p-8"
            style={{
              backgroundColor: "var(--green-pale, #dcf5e6)",
              border: "1px solid rgba(10, 122, 85, 0.2)",
            }}
            aria-live="polite"
          >
            <p className="text-[14.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--green-deep, #075a3f)" }}>
              Cada mes, lo aburrido te come
            </p>

            <p
              className="mt-1 text-[52px] sm:text-[68px] font-bold leading-none tracking-[-0.03em] tabular-nums"
              style={{
                fontFamily: "var(--display, var(--font-bricolage, system-ui))",
                color: "var(--ink, #10291f)",
              }}
            >
              {hoursResult.totalHours} horas
            </p>

            <p className="mt-2.5 text-[16px] sm:text-[17px]" style={{ color: "var(--ink, #10291f)" }}>
              ≈ <span className="font-bold underline decoration-[var(--yellow)] decoration-4 underline-offset-2">
                {hoursResult.workdays} jornadas completas
              </span> de trabajo que no crea nada.
            </p>

            {/* Desglose de horas por tarea */}
            <div className="mt-5 pt-4 border-t border-[rgba(10,122,85,0.15)] flex flex-wrap justify-center gap-3 sm:gap-6 text-[13px]">
              <span className="px-3 py-1 rounded-full bg-white/80 font-medium" style={{ color: "var(--ink, #10291f)" }}>
                Reportes: <strong>{hoursResult.reportHoursTotal}h</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 font-medium" style={{ color: "var(--ink, #10291f)" }}>
                Parrillas: <strong>{hoursResult.gridHoursTotal}h</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-white/80 font-medium" style={{ color: "var(--ink, #10291f)" }}>
                Programación: <strong>{Math.round(hoursResult.scheduleHoursTotal)}h</strong>
              </span>
            </div>

            {/* Botón CTA */}
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleTriggerCta}
                className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-[14px] text-[15px] font-bold text-white transition-all cursor-pointer shadow-md hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--green, #0a7a55)",
                }}
              >
                <span>{ctaLabel || "Recupera esas horas con Hubly"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <span className="text-[13px] font-medium" style={{ color: "var(--ink-soft, #456256)" }}>
                Hubly desde {formatCurrency(PRICING_CONSTANTS.v3.solo.prices[currency], currency)}/mes · 7 días gratis
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 2: PRECIOS POR VOLUMEN Y TRAMOS (Ruta /lp/pricing de Henry) */}
      {/* ==================================================================== */}
      {activeTab === "pricing" && (
        <div className="space-y-8">
          {/* Tramos informativos superiores */}
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--ink-soft, #456256)" }}>
              Escala de precios por marca al mes ({currency.toUpperCase()}):
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5" role="list">
              {pricingResult.tiers.map((tier) => (
                <div
                  key={tier.id}
                  role="listitem"
                  className="rounded-[14px] p-3 border transition-all"
                  style={{
                    backgroundColor: tier.isActive ? "var(--green-pale, #dcf5e6)" : "var(--ground, #f6f5f0)",
                    borderColor: tier.isActive ? "var(--green, #0a7a55)" : "var(--line, #dde5da)",
                    opacity: tier.isActive ? 1 : 0.6,
                  }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em]"
                    style={{ color: tier.isActive ? "var(--green-deep, #075a3f)" : "var(--ink-soft, #456256)" }}
                  >
                    {tier.name}
                  </p>
                  <p className="text-[20px] font-bold mt-1 tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                    {formatCurrency(tier.unitPrice, currency)}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--ink-soft, #456256)" }}>
                    {tier.isIncluded ? "ya incluidas en plan" : "por cada marca"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Slider interactivo de volumen (1 a 150 marcas) */}
          <div
            className="rounded-[20px] p-6 sm:p-7 border"
            style={{
              backgroundColor: "var(--surface, #ffffff)",
              borderColor: "var(--line, #dde5da)",
              boxShadow: "0 4px 16px -4px rgba(16, 41, 31, 0.08)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <span className="text-[14px] font-semibold" style={{ color: "var(--ink, #10291f)" }}>
                  ¿Cuántas marcas llevas en tu agencia?
                </span>
                <p className="text-[12.5px] mt-0.5" style={{ color: "var(--ink-soft, #456256)" }}>
                  Ajusta con el control o con los botones de marca individual:
                </p>
              </div>

              {/* Botones de incremento / decremento */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Una marca menos"
                  onClick={() => setPricingBrands((prev) => Math.max(1, prev - 1))}
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center border font-bold transition-colors cursor-pointer hover:bg-[var(--ground)]"
                  style={{ borderColor: "var(--line, #dde5da)", color: "var(--ink, #10291f)" }}
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span
                  className="text-[32px] font-bold w-16 text-center tabular-nums leading-none"
                  style={{
                    fontFamily: "var(--display, var(--font-bricolage, system-ui))",
                    color: "var(--ink, #10291f)",
                  }}
                >
                  {pricingBrands}
                </span>

                <button
                  type="button"
                  aria-label="Una marca más"
                  onClick={() => setPricingBrands((prev) => Math.min(150, prev + 1))}
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center border font-bold transition-colors cursor-pointer hover:bg-[var(--ground)]"
                  style={{ borderColor: "var(--line, #dde5da)", color: "var(--ink, #10291f)" }}
                >
                  <Plus className="w-4 h-4" />
                </button>

                <span className="text-[13px] font-medium" style={{ color: "var(--ink-soft, #456256)" }}>
                  marcas
                </span>
              </div>
            </div>

            {/* Slider de marcas con marcas de hito (10, 25, 50, 100) */}
            <div className="relative pt-2 pb-6 select-none">
              <div className="relative h-6 flex items-center">
                {/* Pista de fondo */}
                <div
                  className="w-full h-2 rounded-full"
                  style={{ backgroundColor: "var(--ground, #f6f5f0)" }}
                />

                {/* Pista activa verde */}
                <div
                  className="absolute left-0 h-2 rounded-full pointer-events-none"
                  style={{
                    width: `${sliderPercentage}%`,
                    backgroundColor: "var(--green, #0a7a55)",
                  }}
                />

                {/* Hito 10 */}
                <div className="absolute -translate-x-1/2 pointer-events-none" style={{ left: `${((10 - 1) / 149) * 100}%` }}>
                  <div className="w-0.5 h-3.5 rounded-full" style={{ backgroundColor: "var(--line, #dde5da)" }} />
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums" style={{ color: "var(--ink-soft, #456256)" }}>
                    10
                  </span>
                </div>

                {/* Hito 25 */}
                <div className="absolute -translate-x-1/2 pointer-events-none" style={{ left: `${((25 - 1) / 149) * 100}%` }}>
                  <div className="w-0.5 h-3.5 rounded-full" style={{ backgroundColor: "var(--line, #dde5da)" }} />
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums" style={{ color: "var(--ink-soft, #456256)" }}>
                    25
                  </span>
                </div>

                {/* Hito 50 */}
                <div className="absolute -translate-x-1/2 pointer-events-none" style={{ left: `${((50 - 1) / 149) * 100}%` }}>
                  <div className="w-0.5 h-3.5 rounded-full" style={{ backgroundColor: "var(--line, #dde5da)" }} />
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums" style={{ color: "var(--ink-soft, #456256)" }}>
                    50
                  </span>
                </div>

                {/* Hito 100 */}
                <div className="absolute -translate-x-1/2 pointer-events-none" style={{ left: `${((100 - 1) / 149) * 100}%` }}>
                  <div className="w-0.5 h-3.5 rounded-full" style={{ backgroundColor: "var(--line, #dde5da)" }} />
                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums" style={{ color: "var(--ink-soft, #456256)" }}>
                    100
                  </span>
                </div>

                {/* Input nativo oculto para interacción accesible */}
                <input
                  type="range"
                  min={1}
                  max={150}
                  step={1}
                  value={pricingBrands}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPricingBrands(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer m-0 z-10"
                  aria-label="Número de marcas"
                />
              </div>
            </div>

            {/* Desglose de cálculo de precios */}
            <div className="mt-4 pt-5 border-t space-y-2" style={{ borderColor: "var(--line, #dde5da)" }}>
              <div className="flex items-center justify-between text-[14px]">
                <span style={{ color: "var(--ink-soft, #456256)" }}>
                  {pricingResult.basePlan.name} · {pricingResult.basePlan.brandsIncluded} marcas incluidas
                </span>
                <span className="font-semibold tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                  {formatCurrency(pricingResult.basePlan.basePrice, currency)}
                </span>
              </div>

              {pricingResult.tiers
                .filter((tier) => !tier.isIncluded && tier.count > 0)
                .map((tier) => (
                  <div key={tier.id} className="flex items-center justify-between text-[14px]">
                    <span style={{ color: "var(--ink-soft, #456256)" }}>
                      {tier.count} {tier.count === 1 ? "marca" : "marcas"} ({tier.brandFrom}–{Math.min(pricingBrands, tier.brandTo ?? pricingBrands)}) × {formatCurrency(tier.unitPrice, currency)}
                    </span>
                    <span className="font-semibold tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                      {formatCurrency(tier.amount, currency)}
                    </span>
                  </div>
                ))}

              {/* Total final */}
              <div
                className="pt-3 border-t flex items-baseline justify-between"
                style={{ borderColor: "var(--line, #dde5da)" }}
              >
                <div>
                  <span className="text-[13px] font-bold uppercase tracking-[0.06em]" style={{ color: "var(--ink-soft, #456256)" }}>
                    Total mensual
                  </span>
                  <p className="text-[12px]" style={{ color: "var(--ink-soft, #456256)" }}>
                    Incluye 10 usuarios, reportes ilimitados e IA con memoria
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-[36px] sm:text-[44px] font-bold leading-none tabular-nums"
                    style={{
                      fontFamily: "var(--display, var(--font-bricolage, system-ui))",
                      color: "var(--green, #0a7a55)",
                    }}
                  >
                    {formatCurrency(pricingResult.totalPrice, currency)}
                  </span>
                  <span className="text-[13px] font-medium block" style={{ color: "var(--ink-soft, #456256)" }}>
                    / mes
                  </span>
                </div>
              </div>

              {/* Mensaje de ahorro frente al precio plano */}
              {pricingResult.monthlySavings > 0 ? (
                <div
                  className="mt-4 p-3.5 rounded-[12px] flex items-center gap-2.5 text-[13.5px] font-medium"
                  style={{
                    backgroundColor: "var(--yellow-pale, #fff6d6)",
                    border: "1px solid rgba(255, 210, 63, 0.4)",
                    color: "var(--ink, #10291f)",
                  }}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-[#b58900]" />
                  <span>
                    A precio plano serían <strong>{formatCurrency(pricingResult.flatPrice, currency)}</strong>.
                    Te quedas con <strong className="text-[var(--green)]">{formatCurrency(pricingResult.monthlySavings, currency)}</strong> cada mes ({formatCurrency(pricingResult.annualSavings, currency)} al año). 💛
                  </span>
                </div>
              ) : (
                <div className="text-[12.5px] pt-1" style={{ color: "var(--ink-soft, #456256)" }}>
                  A partir de la marca 26, cada nueva marca entra con descuento automático progresivo hasta llegar a {formatCurrency(130, currency)}/marca.
                </div>
              )}
            </div>
          </div>

          {/* CTA de la pestaña de precios */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleTriggerCta}
              className="inline-flex items-center justify-center gap-2 h-[52px] px-9 rounded-[14px] text-[15px] font-bold text-white transition-all cursor-pointer shadow-md hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--green, #0a7a55)",
              }}
            >
              <span>{ctaLabel || `Empezar prueba de 7 días con ${pricingBrands} marcas`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 3: RETORNO DE INVERSIÓN (ROI INTEGRADO DE AGENCIA)           */}
      {/* ==================================================================== */}
      {activeTab === "roi" && (
        <div className="space-y-8">
          {/* Ajuste de nómina de la agencia */}
          <div
            className="rounded-[20px] p-6 border"
            style={{
              backgroundColor: "var(--ground, #f6f5f0)",
              borderColor: "var(--line, #dde5da)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <label htmlFor="hourly-wage" className="text-[14.5px] font-semibold" style={{ color: "var(--ink, #10291f)" }}>
                  Costo promedio por hora del equipo de la agencia ({currency.toUpperCase()})
                </label>
                <p className="text-[12.5px]" style={{ color: "var(--ink-soft, #456256)" }}>
                  Salario o tarifa de diseñadores, community managers y directores de cuenta:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold" style={{ color: "var(--ink, #10291f)" }}>
                  {CURRENCY_CONFIG[currency].symbol}
                </span>
                <input
                  id="hourly-wage"
                  type="number"
                  min={1}
                  max={2000}
                  value={hourlyWage}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setHourlyWage(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 rounded-[10px] border font-bold text-center tabular-nums"
                  style={{
                    borderColor: "var(--line, #dde5da)",
                    backgroundColor: "var(--surface, #ffffff)",
                    color: "var(--ink, #10291f)",
                  }}
                />
                <span className="text-[13px] font-medium" style={{ color: "var(--ink-soft, #456256)" }}>
                  / hora
                </span>
              </div>
            </div>
          </div>

          {/* Grilla comparativa de ROI */}
          <div className="grid sm:grid-cols-3 gap-4">
            {/* Tarjeta 1: Nómina ahorrada */}
            <div
              className="rounded-[18px] p-5 border text-center"
              style={{
                backgroundColor: "var(--green-pale, #dcf5e6)",
                borderColor: "rgba(10, 122, 85, 0.2)",
              }}
            >
              <span className="text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--green-deep, #075a3f)" }}>
                Tiempo recuperado
              </span>
              <p className="text-[32px] font-bold mt-1 tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                {roiCalculations.hoursSaved} hrs
              </p>
              <p className="text-[12.5px] font-semibold mt-1" style={{ color: "var(--green-deep, #075a3f)" }}>
                Valor: {formatCurrency(roiCalculations.payrollValue, currency)}/mes
              </p>
            </div>

            {/* Tarjeta 2: Inversión en Hubly */}
            <div
              className="rounded-[18px] p-5 border text-center"
              style={{
                backgroundColor: "var(--surface, #ffffff)",
                borderColor: "var(--line, #dde5da)",
              }}
            >
              <span className="text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--ink-soft, #456256)" }}>
                Inversión en Hubly
              </span>
              <p className="text-[32px] font-bold mt-1 tabular-nums" style={{ color: "var(--ink, #10291f)" }}>
                {formatCurrency(roiCalculations.subscriptionCost, currency)}
              </p>
              <p className="text-[12.5px]" style={{ color: "var(--ink-soft, #456256)" }}>
                Suscripción mensual ({pricingBrands} marcas)
              </p>
            </div>

            {/* Tarjeta 3: Retorno neto */}
            <div
              className="rounded-[18px] p-5 border text-center shadow-sm"
              style={{
                backgroundColor: "var(--yellow-pale, #fff6d6)",
                borderColor: "rgba(255, 210, 63, 0.4)",
              }}
            >
              <span className="text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: "#856404" }}>
                Multiplicador de Retorno
              </span>
              <p
                className="text-[36px] font-extrabold mt-1 tabular-nums"
                style={{
                  fontFamily: "var(--display, var(--font-bricolage, system-ui))",
                  color: "var(--ink, #10291f)",
                }}
              >
                {roiCalculations.multiplier}× ROI
              </p>
              <p className="text-[12.5px] font-bold text-[var(--green)]">
                +{formatCurrency(Math.max(0, roiCalculations.netBenefit), currency)} beneficio neto
              </p>
            </div>
          </div>

          {/* Resumen ejecutivo del ROI */}
          <div
            className="rounded-[18px] p-6 border space-y-3"
            style={{
              backgroundColor: "var(--ground, #f6f5f0)",
              borderColor: "var(--line, #dde5da)",
            }}
          >
            <h4 className="text-[16px] font-bold m-0" style={{ color: "var(--ink, #10291f)" }}>
              Resumen para la Dirección de la Agencia:
            </h4>
            <ul className="space-y-2 text-[14px]" style={{ color: "var(--ink, #10291f)" }}>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                <span>
                  Al operar <strong>{pricingBrands} marcas</strong> con Hubly, tu equipo recupera <strong>{roiCalculations.hoursSaved} horas al mes</strong> ({roiCalculations.workdays} jornadas de 8 horas).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                <span>
                  El costo en nómina de esas horas equivale a <strong>{formatCurrency(roiCalculations.payrollValue, currency)}</strong>, frente a una suscripción de apenas <strong>{formatCurrency(roiCalculations.subscriptionCost, currency)}</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[var(--green)] shrink-0 mt-0.5" />
                <span>
                  Cada {formatCurrency(1, currency)} invertido en Hubly le devuelve a tu agencia <strong>{formatCurrency(Number(roiCalculations.multiplier), currency)} en capacidad operativa libre</strong> para captar nuevos clientes sin contratar más personal.
                </span>
              </li>
            </ul>
          </div>

          {/* Botón CTA */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleTriggerCta}
              className="inline-flex items-center justify-center gap-2 h-[52px] px-9 rounded-[14px] text-[15px] font-bold text-white transition-all cursor-pointer shadow-md hover:-translate-y-0.5"
              style={{
                backgroundColor: "var(--green, #0a7a55)",
              }}
            >
              <span>{ctaLabel || "Empieza a generar este ROI — 7 días gratis"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default AgencyCalculator;
