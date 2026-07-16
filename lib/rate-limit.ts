import "server-only";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// Fails open (returns true / "allowed") if the check_rate_limit RPC errors — e.g. the
// 0006_rate_limit migration hasn't been applied yet. Rate limiting is hardening, not a
// dependency real users' logins/checkouts should break over.
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  key: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) return true;
  return data ?? true;
}
