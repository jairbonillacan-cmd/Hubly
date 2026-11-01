import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateHoursSaved, calculateVolumePricing, formatCurrency } from "./calculator";

test("todo en cero no produce horas ni jornadas", () => {
  const r = calculateHoursSaved({ brands: 0, postsPerBrand: 0, reportHours: 0, gridHours: 0, postMinutes: 0 });
  assert.deepEqual(
    [r.reportHoursTotal, r.gridHoursTotal, r.scheduleHoursTotal, r.totalHours, r.workdays],
    [0, 0, 0, 0, 0]
  );
});

test("los valores negativos no generan horas negativas", () => {
  const r = calculateHoursSaved({ brands: -3, postsPerBrand: -10, reportHours: -2, gridHours: -1, postMinutes: -5 });
  assert.equal(r.reportHoursTotal, 0);
  assert.equal(r.gridHoursTotal, 0);
  assert.equal(r.scheduleHoursTotal, 0);
  assert.equal(r.totalHours, 0);
  assert.equal(r.workdays, 0);
});

test("los valores vacíos (NaN) cuentan como cero", () => {
  const r = calculateHoursSaved({ brands: 2, postsPerBrand: Number.NaN, reportHours: 2, gridHours: 1, postMinutes: Number.NaN });
  assert.equal(r.reportHoursTotal, 4);
  assert.equal(r.gridHoursTotal, 2);
  assert.equal(r.scheduleHoursTotal, 0);
  assert.equal(r.totalHours, 6);
});

test("el redondeo de horas y jornadas", () => {
  // 3 + 2 + (2*10*9)/60 = 8 exactas.
  const r = calculateHoursSaved({ brands: 2, postsPerBrand: 10, reportHours: 1.5, gridHours: 1, postMinutes: 9 });
  assert.equal(r.totalHours, 8);
  assert.equal(r.workdays, 1);
  // 3 + 2 + (2*10*7)/60 = 7.333… horas.
  const f = calculateHoursSaved({ brands: 2, postsPerBrand: 10, reportHours: 1.5, gridHours: 1, postMinutes: 7 });
  assert.equal(f.totalHours, 7);
  assert.equal(f.workdays, 0.9);
});

test("sin marcas extra el precio es el plan base", () => {
  const r = calculateVolumePricing(10);
  assert.equal(r.extraBrandsCount, 0);
  assert.equal(r.totalPrice, 1950);
  assert.equal(r.flatPrice, 1950);
  assert.equal(r.monthlySavings, 0);
  assert.equal(r.annualSavings, 0);
  assert.deepEqual(r.tiers.map((t) => t.count), [10, 0, 0, 0, 0]);
});

test("los tramos progresivos no retroactivos suman por tramo", () => {
  const r = calculateVolumePricing(60);
  assert.equal(r.extraBrandsCount, 50);
  // 15×195 + 25×170 + 10×150 sobre el plan base.
  assert.equal(r.totalPrice, 1950 + 2925 + 4250 + 1500);
  assert.equal(r.flatPrice, 1950 + 50 * 195);
  assert.equal(r.monthlySavings, r.flatPrice - r.totalPrice);
  assert.equal(r.annualSavings, r.monthlySavings * 12);
  assert.deepEqual(r.tiers.map((t) => t.count), [10, 15, 25, 10, 0]);
  assert.deepEqual(r.tiers.map((t) => t.brandFrom), [1, 11, 26, 51, 101]);
  assert.equal(r.tiers[4].brandTo, null);
});

test("marcas negativas o vacías no rompen el desglose de precios", () => {
  const neg = calculateVolumePricing(-5);
  assert.equal(neg.extraBrandsCount, 0);
  assert.equal(neg.totalPrice, 1950);
  for (const t of neg.tiers) {
    assert.equal(t.count >= 0, true);
  }
  assert.equal(neg.tiers[0].count, 0);
  const vacio = calculateVolumePricing(Number.NaN);
  assert.equal(vacio.extraBrandsCount, 0);
  assert.equal(vacio.totalPrice, 1950);
});

test("formatCurrency respeta el símbolo y la moneda", () => {
  assert.equal(formatCurrency(0, "mxn"), "$0");
  assert.equal(formatCurrency(1950, "mxn"), "$1,950");
  assert.equal(formatCurrency(1234.5, "usd"), "$1,234.5");
  assert.ok(formatCurrency(120, "eur").startsWith("€"));
});
