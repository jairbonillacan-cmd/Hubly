# Instrucciones para agentes

## Interfaz

Antes de tocar cualquier pantalla, componente, estilo o texto de la interfaz, lee completa [docs/GUIA-UX-UI-AGENTES.md](docs/GUIA-UX-UI-AGENTES.md) y síguela al pie de la letra.

- `/dashboard` y `/calendario` son las únicas pantallas de referencia. Las demás arrastran deuda: no las imites.
- Antes de entregar, ejecuta `npm run check:ui` en `web/` y revisa la pantalla en escritorio, móvil y modo oscuro.
- Nunca ejecutes `check:ui -- --update` para que el chequeo pase.

## Código

Lee también `web/AGENTS.md`: esta versión de Next.js difiere de la que puedes conocer.

No apagues ni reinicies el servidor de desarrollo: el usuario ve los cambios en vivo. Si `localhost:3000` responde, úsalo.

## Trabajo

El plan vigente está en [docs/ROADMAP.md](docs/ROADMAP.md) y las decisiones en [docs/adr/](docs/adr/). Lo que esté en `docs/archivo/` es historia, no instrucciones.

- Un solo agente escribe en cada dominio a la vez; sin ramas paralelas sobre los mismos archivos.
- Cada PR tiene un solo objetivo, incluye evidencia de pruebas y dice qué no se comprobó.
- No edites una prueba para que pase sin explicar por qué era incorrecta.
- No añadas una dependencia sin justificarla en el PR.
- Las migraciones destructivas requieren aprobación del dueño.
- Sin comentarios con nombres de capturas, chunks o agentes.
- No hay pantalla nueva sin backend real, o con la etiqueta «Función prevista».
- Antes de entregar corre, desde `web/`: `npm run lint`, `npm run check:ui`, `npx tsc --noEmit`, `npm test`, `npm run test:db` y `npm run build`.
- No subas el tope de avisos de `npm run lint`. Solo puede bajar.
