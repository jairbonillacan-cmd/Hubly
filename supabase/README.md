# Conectar Supabase

Sin estas claves, Hubly corre en modo demo: datos locales y sin cuentas.

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta en orden los archivos de `migrations/`.
3. En **Project Settings > API**, copia la URL y la clave publicable a `web/.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU-CLAVE-PUBLICABLE
   ```

   Nunca uses aquí la clave `service_role` o secreta: la app no la necesita.

4. En **Authentication > URL Configuration**, define el Site URL y agrega como Redirect URL `http://localhost:3000/auth/callback`, más la de producción.
5. Para entrar con Google, activa el proveedor en **Authentication > Providers** con tus credenciales de Google.
6. Reinicia `npm run dev` en `web/`. Registrarse lleva al onboarding, que crea la agencia.

## Chat en vivo

`0008_chat.sql` crea las tablas del chat y las publica en Realtime. Mientras no se aplique, el chat sigue guardándose en el documento del espacio; al aplicarla, lo que haya se copia una sola vez.

Para que los mensajes programados salgan sin ninguna sesión abierta, activa la extensión `pg_cron` **antes** de ejecutar esa migración. Sin ella se envían cuando alguien de la agencia tiene la app abierta.

## Probar sin un proyecto de Supabase

Corre el esquema en un Postgres local dentro de Node:

```bash
npm --prefix web run test:db
```

Para usar la app en modo real contra un Supabase simulado, en http://localhost:3200:

```bash
npm --prefix web run dev:live
```

El simulado no firma tokens ni envía correos, así que no sustituye probar con un proyecto real.
