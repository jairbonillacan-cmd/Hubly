# Traspaso: /ajustes más similar a Henry

Estado: `/ajustes` ya está rediseñado y comprobado en navegador (1440 claro, 1440 oscuro y 375). Lo implementado vive en `web/components/app/ajustes/` y `web/app/(app)/ajustes/page.tsx`; el plan de abajo se conserva como referencia de lo que se decidió y de lo que sigue marcado «Función prevista».

Pendiente conocido: `npm run check:ui` falla por 4 reglas que ya fallaban en el commit anterior (CSS de personas y social, e iconos de lucide en `BuyerPersonas.tsx` y `ProjectEditModal.tsx`); ninguna es de `/ajustes`. Además, el recorte de foto y el flujo de contraseña por correo solo se probaron en modo demo.

## Evidencia

- Dossier local, ignorado por git (cópialo aparte si lo necesitas en otra máquina): `docs-rea-henry-hubly-20261030-143712/`.
  - Ficha 11 en `funcionalidades/05-ads-analitica-reportes-ajustes.md`.
  - Capturas `evidencia/screenshots/a09-settings-*.png`.
  - Código `codigo/derivado/app-settings-page-1fad74556f15f0ef.formatted.js`.
- Captura REA en vivo del flujo de contraseña: `ev_d88da9320d7d6f79b9cca0ef7354ed52d3df3d027491e5ba02d24ff5dbe2939f`.
- Las capturas son más recientes que el texto de la ficha 11 y mandan si se contradicen. Ejemplo: Mi Perfil ya no tiene puesto, teléfono ni biografía.

## Lo observado en Henry

Estructura: título «Configuración», navegación lateral de 10 pestañas sincronizada con `?tab=`, «Cerrar sesión» debajo y un panel de contenido a la derecha.

| Pestaña | Contenido |
|---|---|
| Mi perfil | Avatar, nombre, correo, rol, «Cambiar foto». Nombre con «Guardar» desactivado hasta que cambie. Correo de solo lectura. Contraseña en línea: «Cambiar contraseña» muestra «Enviar correo de restablecimiento» y «Cancelar», luego un aviso de éxito. Apariencia Claro/Oscuro |
| Foto | Clic en avatar: visor oscuro con «Ajustar encuadre» y «Cambiar foto». Recorte: área de 280px con máscara circular, arrastre, rueda o pellizco, zoom de 1 a 4 con slider y botones, Cancelar/Guardar |
| Mi cuenta | Agencia con rol, marcas asignadas, eliminar cuenta escribiendo ELIMINAR |
| Notificaciones | Toggle de este navegador con estado bloqueado; toggles por correo (menciones, clientes, publicaciones, tareas) y resumen diario |
| Integraciones | Canva, Google Drive y Google Calendar con Conectar, Reconectar y Desconectar |
| Equipo | «Agregar todos a todas las marcas», «Agregar miembro», filas con «Editar marcas» (buscador si hay más de 6) y selector de rol |
| Roles | Predeterminados con «Ver permisos» y «Duplicar»; roles propios con editar y borrar. 9 permisos en 3 grupos: Configuración, Equipo, Marcas |
| Marcas | Logo y nombre de agencia, «Nueva marca», buscador, filas con miembros, Configurar, archivar y borrar |
| Suscripción | Plan, método de pago, desglose y precio por tramo |
| Uso | Agentes, ejecuciones, tokens y costo del mes; tabla por agente |
| Recomienda | Liga con copiar, contadores y premios |

## Plan para Hubly

Antes de tocar nada, lee `docs/GUIA-UX-UI-AGENTES.md`. Usa plantilla A, solo tokens y `.hbtn`.

1. `web/app/(app)/ajustes/page.tsx`: pestañas con `useSearchParams` dentro de `Suspense`, conservando los demás parámetros. Debe seguir funcionando `?tab=equipo`, que usan `LiveUnavailable` y `domain-selectors`. Navegación lateral fija en escritorio y desplazable en móvil, con `--ui-sky-soft` en el ítem activo.
2. Un panel por archivo en `web/components/app/ajustes/`; clases `hubly-ajustes-*` al final de `dashboard-polish.css`.
3. Foto: añadir `avatarSourceUrl` a `WorkspaceProfile`; recortar con canvas a 256px y mostrar `profile.avatarUrl` en `app/(app)/layout.tsx` (líneas cercanas a 1206 y 1545). Con cuentas reales falta decidir dónde persistirla: no guardar data URLs en los metadatos de Supabase.
4. `ChangePassword.tsx`: flujo en línea con `resetPasswordForEmail` y `redirectTo` a `/auth/callback?next=/nueva-clave`, como en `AuthCard`.
5. Equipo: demo con `updateTeamMember` y `setInviteModalOpen`; con cuentas reales, `AccessPanel` con estilos corregidos.
6. Marcas: `updateBrand` para archivar como en `/marcas`, `setNewBrandModalOpen` y `updateAgency`. No hay acción de borrar marca en el store.
7. Preferencias de notificación y roles propios en `localStorage`, diciendo que aún no envían correos ni limitan permisos.

## Sin respaldo real: marcar «Función prevista»

Eliminar cuenta, integraciones OAuth, suscripción, uso de agentes y referidos. Hoy `/ajustes` muestra «Plan Agencia Pro activo», que es inventado y debe quitarse. No copiar precios ni premios de Henry, ni sus textos (§14 de la guía).

Antes de entregar: `npm run check:ui`, `npx tsc --noEmit`, `npm test`, y revisar en 1440 claro, 1440 oscuro y 375.
