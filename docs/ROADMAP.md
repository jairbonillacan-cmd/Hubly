# Roadmap de Hubly

Actualizado: 1 de noviembre de 2026. Es la única lista vigente de trabajo.

**Meta:** que la agencia opere con clientes reales sin pasos por fuera: crear marca → conectar redes → armar parrilla → aprobar con el cliente → publicar → ver resultados.

Prioridad: P0 riesgo de datos o legal · P1 impide el ciclo real o los cambios seguros · P2 deuda · P3 mejora.

## Etapas y compuertas

| Etapa | Compuerta | Estado |
|---|---|---|
| 0. Decisiones y controles | CI obligatorio, migraciones aplicadas, `npm run dev:live` funcionando | En curso |
| 1. Licencia y prueba del motor | Publicación real demostrada y vía de licencia por escrito | Pendiente |
| 2. Datos reales por dominio | `/api/workspace` eliminado o reducido a preferencias; aislamiento por marca probado | Pendiente |
| 3. Publicación real | Un post aprobado sale a tiempo, una sola vez, aun con reintento forzado | Pendiente |
| 4. Ciclo completo con la agencia | Dos semanas con un cliente real sin volver a la herramienta anterior | Pendiente |
| 5. Código y diseño mantenibles | Continua: la deuda solo baja | Pendiente |
| 6. Paridad con Henry | Matriz con estado real, parcial o prevista | Pendiente |
| 7. Preparación para otras agencias | `docs/RELEASE-READINESS.md` con restauración de respaldo probada | Pendiente |

## Backlog validado contra el código

Revisado el 1 de noviembre de 2026 sobre el reporte de auditoría externo.

| ID | P | Hallazgo | Evidencia | Etapa |
|---|---|---|---|---|
| H-02 | P0 | Licencia a largo plazo sin decidir antes de tomar código de Postiz | `LICENSE`, ADR 0002 y 0003 | 1 |
| D-01 | P1 | Casi todo vive en un documento JSONB con tope de 8 MB | `agency_workspaces`, `HublyWorkspaceData`, `app/api/workspace/route.ts` | 2 |
| D-02 | P1 | Sin permisos por marca: `brandIds` no aparece en ninguna migración | `supabase/migrations` | 2 |
| D-03 | P1 | Dos arquitecturas, demo y real | `backendEnabled` en 38 archivos | 2 |
| D-04 | P1 | Estado de sincronización en variables globales | `lib/live-workspace.ts` | 2 |
| P-01 | P1 | No se publica en ninguna red | Sin motor ni cola | 3 |
| P-02 | P1 | «Avisar al publicar» solo guarda la referencia | `lib/post-draft.ts`, compositor | 3 |
| F-01 | P1 | `/ia` en demo solo repite plantillas | `app/(app)/ia/page.tsx` | 4 |
| F-02 | P1 | `/anuncios` usa datos fijos | `SAMPLE_ADS` | 4 |
| F-03 | P2 | Los logros y XP no se persisten en servidor | `EquipoView.tsx` | 4 |
| F-04 | P2 | Cifras del dashboard de equipo ajustadas para parecerse a una captura | `domain-selectors.ts`, `EquipoView.tsx` | 5 |
| C-01 | P2 | Archivos gigantes: `EquipoView` 3,195, `store` 2,303, `layout` 1,996, `InicioView` 1,784, `parrillas` 1,552, `PostComposerModal` 1,535 | `wc -l` | 5 |
| C-02 | P2 | Modal de invitación duplicado | `EquipoView.tsx:249`, `InviteTeamModal.tsx` | 5 |
| C-03 | P2 | 13 usos de `as unknown as` y alias de tipos | `layout.tsx`, `lib/types.ts` | 5 |
| C-04 | P2 | Deuda de UI congelada en 1,437 hallazgos | `scripts/check-ui-baseline.json` | 5 |
| C-05 | P2 | 38 errores de `react-hooks` y 88 avisos de ESLint, degradados a avisos con tope | `web/eslint.config.mjs` | 5 |

**Corregido respecto al reporte:** el chat ya tiene tablas propias, `0007` ahora es `0010` y aún no hay producción. Los mensajes y canales siguen en el tipo del documento para el modo demo.

**Sin validar:** el coste real de los re-renders en `layout.tsx` (no se midió) y las condiciones de carrera entre personas (no se reprodujeron).

## Pendiente del dueño (etapa 0)
- Confirmar la protección de `main` y la limpieza de ramas y worktrees.
