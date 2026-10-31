# Traspaso de la sesión del agente A

31 de octubre de 2026. Este documento manda sobre los pendientes de `docs/ENTREGA-PARIDAD-HENRY.md`, que aún no recoge el último commit de `agente/integracion`.

## Dónde está cada cosa

| Rama | Estado |
|---|---|
| `paridad-henry` | Tiene A, B y C fusionados (`fae3e59`). Se usa en `C:\Users\jairb\Desktop\Hubly` |
| `agente/integracion` | Lo mismo, más las correcciones de abajo. Está por delante de `paridad-henry`. Se usa en `C:\Users\jairb\Desktop\Hubly-wt\integracion` |
| `agente/opus-diseno`, `agente/gemini-flujos`, `agente/glm-calidad` | Entregas originales, ya integradas |
| `main` | Sin cambios |

Servidores que quedaron encendidos: 3000 (del usuario, nunca apagarlo ni reiniciarlo), 3001 (A), 3002 (B), 3003 (C) y 3004 (integración).

**Sin commitear en la carpeta principal, del usuario:** `web/.env.example`, `supabase/aplicar-todo.sql`, `supabase/.temp/` y los planes en `docs/planes-agentes/`. No tocarlos.

## Último trabajo: cuatro defectos

Están en `agente/integracion`, **sin fusionar a `paridad-henry`**.

| Defecto | Corrección | Comprobado |
|---|---|---|
| `/chat` a 390 mostraba lista y panel cortado | En móvil se ve la lista o la conversación, con botón «Volver a conversaciones». El compositor ya no se corta | Medidas y captura a 390; captura a 1440 |
| Pestañas falsas en `/anuncios` | «Tableros» e «Ideas» son enlaces a `/parrillas?tab=…`; «Anuncios» es la página actual | Clic y destino correcto |
| Pestañas de `/reportes` en tres filas | Una fila con scroll interno; «Cuentas» sigue debajo | Medida y captura a 390 |
| El aviso desplegado tapaba «Aprobaciones» a 1440 | Espacio reservado al final de la página con el aviso desplegado | 0 widgets bajo el aviso al final del scroll, con captura |

También se ocultan en móvil el texto «Enviar» y los iconos de mención, emoji e IA del compositor del chat.

## En qué me quedé

La corrida final se interrumpió por el límite de la cuenta.

- **Última corrida completa, antes del arreglo del compositor del chat:** `check:ui` correcto, `npm test` 43, `test:db` 69, `build` compila, Playwright 88 y `audit:controles` con 0 errores y 17 sin efecto visible.
- **Después de ese arreglo:** solo se corrió `tsc`, sin errores, y la verificación del chat. `docs/MATRIZ-CONTROLES.md` es de la auditoría anterior.

## Lo que sigue

1. En `C:\Users\jairb\Desktop\Hubly-wt\integracion\web`, con `$env:E2E_PORT="3004"` y `$env:E2E_BASE="http://localhost:3004"`, correr `npm run check:ui`, `npx tsc --noEmit`, `npm test`, `npm run test:db`, `npm run build`, `npx playwright test` y `npm run audit:controles`. Commitear la matriz.
2. Revisar el título vacío de `/chat`: la última captura a 1440 aún decía «conversacion», sin acento, y el cambio ya está en el código.
3. Actualizar `docs/ENTREGA-PARIDAD-HENRY.md`.
4. **Pedir permiso** y fusionar `agente/integracion` a `paridad-henry` en la carpeta principal, sin reiniciar el 3000.

## Pendiente, sin resolver

- La imagen `WhatsApp Image 2026-10-27 at 09.57.42.jpeg` no apareció: `web/.data/media` no existe en la carpeta principal. La fusión no la tocó, porque `web/.data` está ignorada.
- Sin medir: las ventanas abiertas de las rutas de B a 390.
- Sin revisar: los periodos de `/dashboard/equipo`, marcados sin efecto visible. El de 7, 30 y 90 días entra en el cálculo, así que probablemente es falta de datos.
- Sin causa encontrada: el fallo intermitente de `calendario.spec.ts:77`.
- Decisiones del usuario: bajar los topes de `check-ui-baseline.json` (el plan prohíbe `--update`), añadir un token verde para modo oscuro y fusionar a `main`.
- Necesitan accesos del usuario: Supabase real y Henry en vivo.

## Reglas que siguen vigentes

Leer `AGENTS.md`, `web/AGENTS.md`, `DESIGN.md` y `docs/GUIA-UX-UI-AGENTES.md`. Nunca `git add .`, `git add -A`, `git stash`, `git reset --hard`, `git clean`, `push --force` ni `check:ui -- --update`. Nunca commitear `web/AGENTS.md`. Las pruebas siempre con puerto propio, nunca contra el 3000. No inventar resultados: los informes de subagentes se verifican.
