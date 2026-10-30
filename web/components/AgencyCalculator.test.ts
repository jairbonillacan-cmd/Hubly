import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHoursSaved,
  calculateVolumePricing,
  formatCurrency,
  PRICING_CONSTANTS,
} from "../lib/calculator";

test("calculateHoursSaved - Default baseline values match production", () => {
  const result = calculateHoursSaved({
    brands: 6,
    postsPerBrand: 12,
    reportHours: 4,
    gridHours: 1.5,
    postMinutes: 6,
  });

  // Term 1: 6 * 4 = 24h
  assert.equal(result.reportHoursTotal, 24);
  // Term 2: 6 * 1.5 = 9h
  assert.equal(result.gridHoursTotal, 9);
  // Term 3: (6 * 12 * 6) / 60 = 7.2h
  assert.equal(result.scheduleHoursTotal, 7.2);
  // Total: 24 + 9 + 7.2 = 40.2h -> Math.round(40.2) = 40
  assert.equal(result.totalHours, 40);
  // Workdays: Math.round((40.2 / 8) * 10) / 10 = 5.0
  assert.equal(result.workdays, 5.0);
});

test("calculateHoursSaved - Edge cases (zero posts, zero times)", () => {
  const zeroResult = calculateHoursSaved({
    brands: 1,
    postsPerBrand: 0,
    reportHours: 0,
    gridHours: 0,
    postMinutes: 0,
  });
  assert.equal(zeroResult.totalHours, 0);
  assert.equal(zeroResult.workdays, 0);

  const onlyReports = calculateHoursSaved({
    brands: 5,
    postsPerBrand: 0,
    reportHours: 2,
    gridHours: 0,
    postMinutes: 0,
  });
  assert.equal(onlyReports.totalHours, 10);
  assert.equal(onlyReports.workdays, 1.3);
});

test("calculateVolumePricing - 10 brands (Base Estudio tier)", () => {
  const res = calculateVolumePricing(10, "mxn");
  assert.equal(res.totalPrice, 1950);
  assert.equal(res.extraBrandsCount, 0);
  assert.equal(res.flatPrice, 1950);
  assert.equal(res.monthlySavings, 0);
  assert.equal(res.annualSavings, 0);
});

test("calculateVolumePricing - 25 brands (Tier 1 maximum boundary)", () => {
  // 10 base + 15 extras at $195
  const res = calculateVolumePricing(25, "mxn");
  const expected = 1950 + 15 * 195; // 1950 + 2925 = 4875
  assert.equal(res.totalPrice, expected);
  assert.equal(res.extraBrandsCount, 15);
  assert.equal(res.monthlySavings, 0);
});

test("calculateVolumePricing - 40 brands matches production DOM exactly", () => {
  // 10 base ($1,950) + 15 T1 ($2,925) + 15 T2 ($2,550) = $7,425
  const res = calculateVolumePricing(40, "mxn");
  assert.equal(res.totalPrice, 7425);
  assert.equal(res.extraBrandsCount, 30);
  // Flat price: 1950 + 30 * 195 = 7800
  assert.equal(res.flatPrice, 7800);
  // Monthly savings: 7800 - 7425 = 375
  assert.equal(res.monthlySavings, 375);
  assert.equal(res.annualSavings, 4500);

  // Check tiers breakdown
  const t1 = res.tiers.find((t) => t.id === "tier-1");
  const t2 = res.tiers.find((t) => t.id === "tier-2");
  assert.ok(t1 && t2);
  assert.equal(t1.count, 15);
  assert.equal(t1.unitPrice, 195);
  assert.equal(t1.amount, 2925);
  assert.equal(t2.count, 15);
  assert.equal(t2.unitPrice, 170);
  assert.equal(t2.amount, 2550);
});

test("calculateVolumePricing - 50 brands (Tier 2 boundary)", () => {
  // 10 base ($1950) + 15 T1 ($2925) + 25 T2 ($4250) = $9,125
  const res = calculateVolumePricing(50, "mxn");
  assert.equal(res.totalPrice, 9125);
  assert.equal(res.flatPrice, 1950 + 40 * 195); // 9750
  assert.equal(res.monthlySavings, 625);
});

test("calculateVolumePricing - 75 brands (Tier 3 middle)", () => {
  // 10 base ($1950) + 15 T1 ($2925) + 25 T2 ($4250) + 25 T3 (25 * 150 = 3750) = $12,875
  const res = calculateVolumePricing(75, "mxn");
  assert.equal(res.totalPrice, 12875);
  assert.equal(res.flatPrice, 1950 + 65 * 195); // 14625
  assert.equal(res.monthlySavings, 1750);
});

test("calculateVolumePricing - 100 brands (Tier 3 boundary)", () => {
  // 10 base ($1950) + 15 T1 ($2925) + 25 T2 ($4250) + 50 T3 ($7500) = $16,625
  const res = calculateVolumePricing(100, "mxn");
  assert.equal(res.totalPrice, 16625);
  assert.equal(res.flatPrice, 1950 + 90 * 195); // 19500
  assert.equal(res.monthlySavings, 2875);
});

test("calculateVolumePricing - 150 brands (Tier 4 maximum slider value)", () => {
  // 10 base ($1950) + 15 T1 ($2925) + 25 T2 ($4250) + 50 T3 ($7500) + 50 T4 (50 * 130 = 6500) = $23,125
  const res = calculateVolumePricing(150, "mxn");
  assert.equal(res.totalPrice, 23125);
  assert.equal(res.flatPrice, 1950 + 140 * 195); // 29250
  assert.equal(res.monthlySavings, 6125);
  assert.equal(res.annualSavings, 73500);
});

test("calculateVolumePricing - Currency conversions (USD & EUR)", () => {
  const usd40 = calculateVolumePricing(40, "usd");
  // 10 base ($120) + 15 T1 (15 * 12 = 180) + 15 T2 (15 * 10.5 = 157.5) = $457.5
  assert.equal(usd40.totalPrice, 457.5);
  assert.equal(usd40.flatPrice, 120 + 30 * 12); // 480
  assert.equal(usd40.monthlySavings, 22.5);

  const eur40 = calculateVolumePricing(40, "eur");
  assert.equal(eur40.totalPrice, 457.5);
});

test("formatCurrency formats correctly across locales", () => {
  assert.equal(formatCurrency(1950, "mxn"), "$1,950");
  assert.equal(formatCurrency(120, "usd"), "$120");
  assert.equal(formatCurrency(120, "eur"), "€120");
});
