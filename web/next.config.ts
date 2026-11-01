import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";

// Next inyecta scripts en línea en el esqueleto estático (verificado con next build: 9 en /login).
// Un nonce obligaría a renderizar cada página en el servidor y es incompatible con el prerender
// parcial, así que quedan permitidos. SRI (abajo) no los cubre —solo recursos externos— pero
// añade integridad a todos los archivos con src: una CDN comprometida no puede alterarlos.
// Quitar 'unsafe-inline' rompe la app: NO hacerlo sin nonces por petición.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Los posts pueden apuntar a imágenes y videos alojados en cualquier sitio.
  `img-src 'self' data: blob: https: ${supabaseOrigin}`,
  `media-src 'self' blob: https: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' data: blob: ${supabaseOrigin}${isDev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

// La URL de estas páginas es una credencial: que no salga en buscadores ni en el Referer.
const tokenPageHeaders = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  poweredByHeader: false,
  // Integridad (SRI) de scripts y estilos externos generados en build. Experimental en Next 16.
  experimental: { sri: { algorithm: "sha384" } },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/share/:path*", headers: tokenPageHeaders },
      { source: "/invitacion/:path*", headers: tokenPageHeaders },
    ];
  },
  async redirects() {
    return [{ source: "/libretas", destination: "/tareas?seccion=libretas", permanent: false }];
  },
};

export default nextConfig;

