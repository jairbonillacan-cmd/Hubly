import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { forwardedTrust, hostForOriginCheck, ipForRateLimit, isCrossOriginWrite, rateLimitWait } from "@/lib/api-guard";
import { secureForProtocol } from "@/lib/supabase/cookie-options";
import { backendEnabled, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

const PUBLIC_PATHS = ["/", "/login", "/register", "/recuperar", "/icon.svg"];
const PUBLIC_PREFIXES = ["/share/", "/auth/", "/api/share/", "/api/waitlist", "/api/chat/bots/", "/brand/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/** ¿Hay algo conocido (la plataforma o un proxy declarado) reescribiendo las cabeceras reenviadas? */
function onTrustedPlatform(request: NextRequest) {
  return Boolean(process.env.VERCEL) || request.headers.has("x-vercel-id");
}

function guardApi(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return null;
  const trusted = forwardedTrust(process.env.TRUST_FORWARDED_HEADERS, onTrustedPlatform(request)) === "always";
  const host = hostForOriginCheck(trusted, request.headers.get("x-forwarded-host"), request.headers.get("host"));
  if (isCrossOriginWrite(request.method, request.headers.get("origin"), host)) {
    return NextResponse.json({ error: "cross_origin" }, { status: 403 });
  }
  const ip = ipForRateLimit(trusted, request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));
  const wait = rateLimitWait(request.method, pathname, ip);
  if (wait) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(wait) } });
  return null;
}

export async function proxy(request: NextRequest) {
  const blocked = guardApi(request);
  if (blocked) return blocked;
  if (!backendEnabled) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    // Secure solo bajo https: el desarrollo por http sigue funcionando.
    cookieOptions: { secure: secureForProtocol(request.nextUrl.protocol) },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Evitan que un CDN guarde la respuesta que renueva la sesión.
        Object.entries(headers ?? {}).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (user || isPublic(pathname)) return response;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|webp|svg|jpg|jpeg|woff2?)$).*)"],
};
