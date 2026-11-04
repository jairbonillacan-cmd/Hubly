/*
 * Qué reglas de `check:ui` llegaron después de las de siempre, por tanda.
 * Vive aparte para que `check-ui.mjs`, `check-deuda.mjs` y `medir-deslop.mjs`
 * separen la deuda heredada de la que miden las reglas nuevas sin repetir la lista.
 *
 * Una tanda nueva se añade al final, en el mismo PR que sus reglas: así su deuda
 * inicial entra en la base sin contarse como empeoramiento (ver check-deuda.mjs).
 */
export const TANDAS = [
  { nombre: "F0-3", reglas: ["style-inline", "important", "view-prop", "use-store-sin-selector"] },
  { nombre: "capas", reglas: ["z-index-fijo"] },
  { nombre: "etiquetas", reglas: ["estado-crudo"] },
];
export const NUEVAS = new Set(TANDAS.flatMap((tanda) => tanda.reglas));
export const esNueva = (id) => NUEVAS.has(id);
