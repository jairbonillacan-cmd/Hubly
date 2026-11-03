/*
 * Qué reglas de `check:ui` llegaron con F0-3 y cuáles son las de siempre.
 * Vive aparte para que `check-ui.mjs` y `medir-deslop.mjs` separaren la deuda
 * heredada de la que miden las reglas nuevas sin repetir la lista.
 */
export const NUEVAS = new Set(["style-inline", "important", "view-prop", "use-store-sin-selector"]);
export const esNueva = (id) => NUEVAS.has(id);
