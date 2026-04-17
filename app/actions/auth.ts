"use server";

import { redirect } from "next/navigation";

import { hasSupabasePublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { buildFeedbackPath, normalizeText } from "@/lib/utils";

const LOGIN_PATH = "/login";

export async function signInAction(formData: FormData) {
  if (!hasSupabasePublicEnv) {
    redirect(buildFeedbackPath(LOGIN_PATH, "error", "Configure as variaveis do Supabase."));
  }

  const email = normalizeText(formData.get("email")).toLowerCase();
  const password = normalizeText(formData.get("password"));

  if (!email || !password) {
    redirect(buildFeedbackPath(LOGIN_PATH, "error", "Informe e-mail e senha."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "E-mail ou senha invalidos."
        : `Falha no login: ${error.message}`;

    redirect(buildFeedbackPath(LOGIN_PATH, "error", message));
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (hasSupabasePublicEnv) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
