import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminKey, getSupabasePublicEnv } from "@/lib/env";

export function createAdminClient() {
  const env = getSupabasePublicEnv();

  return createClient(env.url, getSupabaseAdminKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
