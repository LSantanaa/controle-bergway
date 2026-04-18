import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    // never create browser client on server
    throw new Error("createClient() should be called only in the browser");
  }

  if (browserClient) return browserClient;

  const env = getSupabasePublicEnv();
  // store on module-scoped var so re-renders / HMR don't recreate it
  browserClient = createBrowserClient(env.url, env.key);

  return browserClient;
}
