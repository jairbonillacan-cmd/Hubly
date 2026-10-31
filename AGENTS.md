# Instrucciones para agentes

## Interfaz

Antes de tocar cualquier pantalla, componente, estilo o texto de la interfaz, lee completa [docs/GUIA-UX-UI-AGENTES.md](docs/GUIA-UX-UI-AGENTES.md) y síguela al pie de la letra.

- `/dashboard` y `/calendario` son las únicas pantallas de referencia. Las demás arrastran deuda: no las imites.
- Antes de entregar, ejecuta `npm run check:ui` en `web/` y revisa la pantalla en escritorio, móvil y modo oscuro.
- Nunca ejecutes `check:ui -- --update` para que el chequeo pase.

## Código

Lee también `web/AGENTS.md`: esta versión de Next.js difiere de la que puedes conocer.

No apagues ni reinicies el servidor de desarrollo: el usuario ve los cambios en vivo. Si `localhost:3000` responde, úsalo.
