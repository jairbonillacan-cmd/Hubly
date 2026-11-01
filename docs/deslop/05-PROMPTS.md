# Prompts

Listos para pegar. Sustituye lo que está entre `<>`.

## Asignación de agentes

| Trabajo | Perfil recomendado | Por qué |
|---|---|---|
| Coordinar, F1, F3-5, F3-10, F4-3, F5-3, F6-4 | El modelo más capaz disponible, esfuerzo alto | Alto riesgo, requiere criterio |
| F0, F2, F3-1 a F3-4, F3-6 a F3-9, F4-1, F4-2, F4-4 | Modelo capaz, esfuerzo medio | Acotado, con pruebas |
| F4-5, F4-6, F4-7, F3-11 | Modelo rápido | Repetitivo y verificable |

**En paralelo como máximo:** 3 agentes, y solo si [SEGUIMIENTO.md](SEGUIMIENTO.md) confirma que no comparten archivos.

## Agente de una tarea

```text
Trabajas en Hubly, en C:\Users\jairb\Desktop\Hubly. Tu tarea es <ID> del plan de deslop.

Lee completos, en este orden, antes de tocar nada:
1. AGENTS.md y web/AGENTS.md
2. docs/deslop/03-REGLAS-PARA-AGENTES.md
3. Tu tarea en docs/deslop/04-TAREAS.md
4. docs/deslop/02-ARQUITECTURA-OBJETIVO.md
5. docs/GUIA-UX-UI-AGENTES.md, si tocas interfaz

Límites:
- Solo la tarea <ID>. Lo demás que encuentres lo anotas en el PR.
- Trabaja en tu propio worktree y un puerto del 3100 al 3199.
- Nunca uses ni apagues el servidor del puerto 3000.
- Nunca apliques migraciones a Supabase.
- No fusiones: deja el PR listo con el CI en verde, salvo que se te autorice aquí: <SÍ/NO>.

Antes de empezar, resume en cinco líneas qué vas a cambiar y qué archivos tocarás.
Detente y pregunta en los casos que indica la sección «Cuándo detenerse y preguntar».

Entrega con el formato de la sección «Entrega». Cita cifras reales de las comprobaciones,
y di con claridad lo que no comprobaste.
```

## Coordinador

```text
Coordinas el plan de deslop de Hubly. Lee docs/deslop/README.md y SEGUIMIENTO.md.

Tu trabajo:
1. Dime qué tareas se pueden iniciar ahora, según sus dependencias y sin solape de archivos.
2. Prepara para cada una el prompt de docs/deslop/05-PROMPTS.md.
3. Cuando un agente entregue, revisa su PR antes de aceptarlo:
   - El diff coincide con la tarea y no tiene cambios ajenos.
   - El CI está en verde. Los tres checks: web, secretos y flujos-con-cuentas.
   - No se debilitó ninguna prueba ni se subió ninguna base.
   - Si cambió una captura, mira la imagen.
   - No confíes en el resumen: comprueba al menos una afirmación importante.
4. Actualiza SEGUIMIENTO.md y decide si se fusiona o se devuelve.

Lleva a mí solo las decisiones D1, D2 y D3, las migraciones y lo que cambie alcance.
No implementes tareas tú mismo.
```

## Revisor de un PR

```text
Revisa el PR <enlace> de Hubly contra la tarea <ID> de docs/deslop/04-TAREAS.md.
No confíes en su descripción. Lee el diff.

Busca, en este orden:
1. Cambios de comportamiento en lo que debía ser un refactor.
2. Reglas perdidas o invertidas al mover código, y efectos que cambiaron de orden.
3. Permisos o validación debilitados.
4. Pruebas debilitadas, bases subidas o capturas actualizadas sin motivo.
5. Duplicados de algo existente, o violaciones de docs/deslop/02-ARQUITECTURA-OBJETIVO.md.

Marca cada hallazgo como confirmado o probable, con archivo, línea y cómo reproducirlo.
Si no encuentras problemas, dilo. No propongas mejoras fuera de la tarea.
```

## Auditor final (F6-4)

```text
Audita Hubly contra docs/deslop/02-ARQUITECTURA-OBJETIVO.md. No participaste en este trabajo.

1. Corre node scripts/medir-deslop.mjs y compara con las metas de docs/deslop/README.md.
2. Elige tres funciones al azar. Para cada una, explica dónde están su pantalla, sus reglas y
   sus datos. Si cuesta encontrarlos, es un hallazgo.
3. Recorre todas las rutas en 1440 claro, 1440 oscuro y 375, y con teclado.
4. Busca slop según la §15 de docs/GUIA-UX-UI-AGENTES.md.

Entrega hallazgos confirmados y riesgos, y si el plan se puede dar por cerrado.
```
