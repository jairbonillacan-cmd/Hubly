## Qué cambia y por qué

## Comprobado
- [ ] `npm run lint`, `check:ui`, `check:size`, `tsc --noEmit`, `npm test`, `npm run test:db`, `npm run build`
- [ ] `npm run test:visual`, si cambia la interfaz o se refactoriza
- [ ] Interfaz vista en 1440 claro, 1440 oscuro y 375

## Sin comprobar
<!-- Lo que no se pudo verificar y por qué. -->

## Antes de fusionar
- [ ] Busqué lo existente antes de crear algo nuevo
- [ ] Un solo objetivo; sin cambios de comportamiento mezclados con un refactor
- [ ] Permisos y validación del lado del servidor, si toca datos
- [ ] Sin secretos ni datos sensibles
- [ ] Ninguna prueba debilitada, ni base de deuda subida
- [ ] Reversión clara, si el cambio es de alto riesgo
