# Propuesta: Importador de parrillas para Word, PDF, ZIP de Notion y capturas

## 1. Estado actual en Hubly

Hoy `Traer mi mes` ([`ImportMonthModal`](../web/components/app/social/CalendarModals.tsx) y [`post-import.ts`](../web/lib/post-import.ts)) procesa en el navegador:
- Archivos `.csv`, `.tsv`, `.txt` y `.xlsx` (`read-excel-file/browser`).
- Tablas pegadas directamente desde Excel, Google Sheets o Notion.
- Mapeo de columnas, detección de duplicados (normalizando acentos y mayúsculas) y vista de revisión antes de crear borradores.

**Qué no lee todavía** (frente al endpoint `/social-posts/import-parse` de Henry):
1. **ZIP de Notion** (`.zip` con archivos `.csv` y `.md`).
2. **Word** (`.docx` con tablas de calendario o guiones corridos).
3. **PDF** (`.pdf` con presentaciones o parrillas exportadas).
4. **Capturas de pantalla** (`.png`, `.jpg`, `.webp` de hojas de cálculo o tableros).

---

## 2. Opciones de implementación

### Opción A — Híbrida: extracción determinista + modelo multimodal con esquema JSON (Recomendada)

1. **ZIP de Notion (sin IA cuando incluye CSV)**:
   - Descomprimir en cliente o servidor con `fflate` (~8 KB).
   - Si el `.zip` contiene el `.csv` de la base de datos de Notion, pasarlo directo a `parseDelimited` + `guessMapping` sin gastar tokens ni esperar a un modelo.
   - Si solo contiene páginas `.md` sueltas, concatenar el texto limpio y enviarlo al extractor estructurado.
2. **Word `.docx` (extracción local + IA solo para texto libre)**:
   - Extraer tablas y párrafos con `mammoth`.
   - Si el documento tiene una tabla con cabeceras reconocibles (`Fecha`, `Copy`, `Red`, `Formato`), enviarla directo al paso de mapeo actual.
   - Si es un brief o guion narrativo sin tabla, enviarlo como texto al modelo para estructurar las filas.
3. **PDF e imágenes (`.pdf`, `.png`, `.jpg`, `.webp`)**:
   - Enviar al endpoint `/api/ai/import-posts` (protegido por sesión y cuota de agencia) usando entrada multimodal con salida JSON estricta (`responseSchema` con `title`, `caption`, `date`, `time`, `networks`, `format`, `pillar`, `notes`).
   - El resultado entra exactamente al paso **`revision`** (`reviewRows`) que ya existe en `ImportMonthModal`, de modo que el usuario siempre revisa errores, fechas y duplicados antes de crear borradores.

### Opción B — Todo por LLM multimodal en servidor

- Enviar cualquier `.docx`, `.pdf`, `.zip` o imagen directamente al modelo multimodal en un único flujo de backend.
- **Ventaja**: menor código de preprocesamiento.
- **Desventaja**: mayor latencia (3–8 s) y gasto innecesario en exportaciones `.zip` de Notion o `.docx` tabulares que se resuelven en <50 ms de forma determinista.

### Opción C — OCR local (`pdfjs-dist` + `tesseract.js`) sin IA

- Extraer texto en el navegador e intentar reconstruir filas por coordenadas.
- **Ventaja**: coste $0 en API.
- **Desventaja**: falla con frecuencia en presentaciones PDF de agencias (diseños de dos columnas, diapositivas por post o capturas con celdas combinadas).

---

## 3. Estimación de costes (Opción A)

Supuesto por importación asistida por IA: 1 parrilla mensual (15 a 30 posts, equivalente a ~8 000 tokens de entrada entre imagen/PDF y ~2 000 tokens de salida JSON).

| Proveedor / Modelo | Coste aprox. por importación | 500 importaciones / mes | 2 500 importaciones / mes |
| --- | --- | --- | --- |
| **Gemini 2.5 Flash** | $0.0015 – $0.0030 USD | ~$0.75 – $1.50 USD | ~$3.75 – $7.50 USD |
| **OpenAI GPT-4o mini** | $0.0020 – $0.0040 USD | ~$1.00 – $2.00 USD | ~$5.00 – $10.00 USD |
| **Claude Haiku 4.5** | $0.0080 – $0.0150 USD | ~$4.00 – $7.50 USD | ~$20.00 – $37.50 USD |
| **ZIP Notion (CSV) / `.docx` tabular** | **$0.00 USD** (local) | **$0.00 USD** | **$0.00 USD** |

---

## 4. Guardarraíles recomendados antes de implementarlo

1. **Límites de entrada**: respetar el tope de `20 MB` (`MAX_DOCUMENT_BYTES` / `MAX_IMAGE_BYTES`), máximo 15 páginas por PDF y máximo 5 imágenes por lote.
2. **Confirmación humana obligatoria**: nunca insertar posts directo en la base de datos desde la respuesta del modelo; siempre pasar por `reviewRows()` y el botón `Importar X como borradores`.
3. **Cuota por espacio de trabajo**: limitar las importaciones con IA (por ejemplo, 30 por marca al mes) y registrar el consumo junto al asistente de copy.
