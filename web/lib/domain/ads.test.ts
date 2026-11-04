import assert from "node:assert/strict";
import { test } from "node:test";
import { filterSampleAds, SAMPLE_ADS, SAMPLE_ADS_KPIS } from "./ads";

test("filterSampleAds devuelve todos los anuncios cuando la consulta está vacía o solo tiene espacios", () => {
  const vacia = filterSampleAds(SAMPLE_ADS, "");
  assert.equal(vacia.length, SAMPLE_ADS.length);
  assert.notEqual(vacia, SAMPLE_ADS);

  const espacios = filterSampleAds(SAMPLE_ADS, "   ");
  assert.deepEqual(
    espacios.map((ad) => ad.id),
    SAMPLE_ADS.map((ad) => ad.id)
  );
});

test("filterSampleAds filtra por título sin distinguir mayúsculas y recortando espacios", () => {
  const taxco = filterSampleAds(SAMPLE_ADS, "  taxco quartz  ");
  assert.deepEqual(
    taxco.map((ad) => ad.id),
    ["hb-ad-2"]
  );

  const liveSale = filterSampleAds(SAMPLE_ADS, "LIVE sale");
  assert.deepEqual(
    liveSale.map((ad) => ad.id),
    ["hb-ad-5", "hb-ad-6"]
  );

  assert.deepEqual(filterSampleAds(SAMPLE_ADS, "inexistente-xyz"), []);
});

test("SAMPLE_ADS_KPIS mantiene los cuatro indicadores de resumen de anuncios", () => {
  assert.equal(SAMPLE_ADS_KPIS.length, 4);
  assert.deepEqual(
    SAMPLE_ADS_KPIS.map((kpi) => kpi.label),
    ["Gasto Total", "Visitas al perfil", "Costo por visita al perfil", "CTR Promedio"]
  );
});
