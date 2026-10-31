import { AuthCard } from "@/components/auth/AuthCard";
import { backendEnabled } from "@/lib/supabase/config";

export default function LoginPage() {
  return <AuthCard mode="login" demo={!backendEnabled} />;
}
