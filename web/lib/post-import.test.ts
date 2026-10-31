import assert from "node:assert/strict";
import { test } from "node:test";
import { guessMapping, parseDelimited, parseImportDate, reviewRows } from "./post-import";

test("el mapeo encuentra las columnas aunque vengan en otro orden", () => {
  assert.deepEqual(guessMapping(["Redes", "FECHA", "Texto", "Nombre"]), { networks: 0, date: 1, caption: 2, title: 3 });
  const rows = reviewRows(
    [
      ["ig", "13/01/2027", "Hola mundo", "Lanzamiento"],
      ["tiktok", "", "Otro copy", ""],
    ],
    { networks: 0, date: 1, caption: 2, title: 3 },
    [],
    []
  );
  assert.equal(rows[0].row, 2);
  assert.equal(rows[0].title, "Lanzamiento");
  assert.equal(rows[0].date, "2027-01-13");
  assert.deepEqual(rows[0].networks, ["Instagram"]);
  // Sin título usa el copy, y la red va normalizada.
  assert.equal(rows[1].title, "Otro copy");
  assert.deepEqual(rows[1].networks, ["TikTok"]);
});

test("una fecha imposible marca la fila y un archivo vacío no da filas", () => {
  assert.equal(parseImportDate("2026-02-30"), null);
  assert.equal(parseImportDate("32/13/2026"), null);
  assert.deepEqual(parseDelimited(""), []);
  assert.deepEqual(parseDelimited("\n   \n"), []);
  const rows = reviewRows([["Solo copy", "", "31/02/2026", ""]], { title: 0, caption: 1, date: 2, networks: 3 }, [], []);
  assert.equal(rows[0].errors.length, 1);
  assert.match(rows[0].errors[0], /Fecha no válida: «31\/02\/2026»/);
  assert.equal(rows[0].date, "");
});

test("el duplicado se detecta contra la marca y dentro del archivo, sin importar acentos", () => {
  const rows = reviewRows(
    [
      ["Uno", "", "2026-11-12", ""],
      ["Uno", "", "2026-11-19", ""],
      ["Dos", "", "2026-11-12", ""],
      ["dos", "", "2026-11-12", ""],
    ],
    { title: 0, caption: 1, date: 2, networks: 3 },
    [{ title: "Dos", scheduledDate: "2026-11-12" }],
    []
  );
  assert.equal(rows[0].duplicate, false);
  // Mismo título con otra fecha no es duplicado.
  assert.equal(rows[1].duplicate, false);
  // Contra lo que ya existía en la marca, también sin importar mayúsculas.
  assert.equal(rows[2].duplicate, true);
  assert.equal(rows[3].duplicate, true);
});
