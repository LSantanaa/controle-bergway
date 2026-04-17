import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const getSessionContext = cache(async () => {
  if (!hasSupabasePublicEnv) {
    return {
      userId: null,
      email: null,
      profile: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;
  const email = user?.email ?? null;

  if (!userId) {
    return {
      userId: null,
      email: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .eq("id", userId)
    .maybeSingle();

  return {
    userId,
    email: email ?? profile?.email ?? null,
    profile: (profile as Profile | null) ?? null,
  };
});

export async function requireSession() {
  const context = await getSessionContext();

  if (!context.userId) {
    redirect("/login");
  }

  return context;
}

export async function requireActiveProfile() {
  const context = await requireSession();

  if (!context.profile) {
    redirect("/login?error=Perfil nao encontrado.");
  }

  if (!context.profile.is_active) {
    redirect("/login?error=Aguarde a liberacao do administrador.&pending=1");
  }

  return context.profile;
}

export async function requireAdminProfile() {
  const profile = await requireActiveProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  return profile;
}
