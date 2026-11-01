# Contribuir a Hubly

Gracias por tu interés. Hubly reúne el sitio público y la aplicación web en `web/`, por lo que tanto tu experiencia real en agencia como el código ayudan.

## Formas de ayudar

- **Cuéntanos cómo trabaja tu agencia:** qué herramientas usas y qué te quita más tiempo.
- **Propón ideas:** abre un issue con el problema que quieres resolver.
- **Reporta errores de la aplicación o la landing:** indica la ruta, el navegador y los pasos para reproducirlos.
- **Envía código:** para cambios grandes, abre primero un issue y lo conversamos. Antes de tocar cualquier pantalla o componente de interfaz, lee [`DESIGN.md`](DESIGN.md) y [`docs/GUIA-UX-UI-AGENTES.md`](docs/GUIA-UX-UI-AGENTES.md) (`/dashboard` y `/calendario` son las pantallas de referencia).

## Desarrollo local

```bash
cd web
npm ci
npm run dev
```

La aplicación funciona sin credenciales en **modo demostración** (guardando cambios locales en `web/.data/`). Para probar con Supabase o IA, copia las variables descritas en [`README.md`](README.md) dentro de `web/.env.local`.

## Verificación antes de abrir un pull request

Ejecuta desde `web/`:

```bash
npm run check:ui        # Reglas de interfaz (nunca uses --update para ocultar deuda)
npx tsc --noEmit        # Comprobación de tipos
npm test                # Pruebas unitarias
npm run test:db         # Permisos RLS y RPC en PostgreSQL en memoria (PGlite)
npm run build           # Compilación de producción
npx playwright test     # Pruebas E2E en navegador real
```

## Licencia

Al contribuir, aceptas que tu aportación se publique bajo la licencia [AGPL-3.0](LICENSE).
