import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";
import { secureForProtocol } from "./cookie-options";

export function createSupabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY, {
    cookieOptions: { secure: secureForProtocol(window.location.protocol) },
  });
}
