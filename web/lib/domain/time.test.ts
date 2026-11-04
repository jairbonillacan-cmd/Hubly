import assert from "node:assert/strict";
import { test } from "node:test";
import { addDaysToIsoDate, resolveDateInTimezone, sanitizeTimezone } from "./time";
import { selectGreetingAndDate } from "./greeting";

test("sanitizeTimezone cae a Ciudad de México con zonas inválidas", () => {
  assert.equal(sanitizeTimezone(null), "America/Mexico_City");
  assert.equal(sanitizeTimezone(""), "America/Mexico_City");
  assert.equal(sanitizeTimezone("Planeta/Marte"), "America/Mexico_City");
  assert.equal(sanitizeTimezone("America/Santiago"), "America/Santiago");
});

test("el día en Ciudad de México cambia a medianoche y no antes", () => {
  const antes = resolveDateInTimezone("2026-11-01T05:59:00Z", "America/Mexico_City");
  assert.equal(antes.isoDate, "2026-10-31");
  assert.equal(antes.day, 31);
  assert.equal(antes.month, 10);
  assert.equal(antes.year, 2026);
  const mediaNoche = resolveDateInTimezone("2026-11-01T06:00:00Z", "America/Mexico_City");
  assert.equal(mediaNoche.isoDate, "2026-11-01");
  assert.equal(mediaNoche.hour, 0);
});

test("dateTitleCase da el día con mayúscula y el mes en minúscula", () => {
  assert.equal(
    selectGreetingAndDate({ name: "Jair" }, "2026-10-31T18:00:00Z").dateTitleCase,
    "Sábado, 31 de octubre"
  );
  assert.equal(
    selectGreetingAndDate({ name: "Jair" }, "2026-04-19T15:00:00Z").dateTitleCase,
    "Domingo, 19 de abril"
  );
  assert.equal(
    selectGreetingAndDate({ name: "Jair" }, "2026-04-19T15:00:00Z").dateFormatted,
    "domingo, 19 de abril"
  );
});

test("addDaysToIsoDate cruza meses, años y bisiestos", () => {
  assert.equal(addDaysToIsoDate("2026-10-31", 1), "2026-11-01");
  assert.equal(addDaysToIsoDate("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysToIsoDate("2024-02-28", 1), "2024-02-29");
  assert.equal(addDaysToIsoDate("2026-02-28", 1), "2026-03-01");
});

