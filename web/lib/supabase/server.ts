import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";
import { secureForProtocol } from "./cookie-options";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  // Detrás de un proxy, el protocolo real lo dice x-forwarded-proto; sin él, http local.
  const forwardedProto = (await headers()).get("x-forwarded-proto");
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: { secure: secureForProtocol(forwardedProto) },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Desde un render no se pueden escribir cookies; las renueva proxy.ts.
        }
      },
    },
  });
}
