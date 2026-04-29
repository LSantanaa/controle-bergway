"use server";

import { redirect } from "next/navigation";

import { hasSupabasePublicEnv } from "@/lib/env";
import { enforceRateLimit, getClientIp } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { buildFeedbackPath, normalizeText } from "@/lib/utils";

const LOGIN_PATH = "/login";

export async function signInAction(formData: FormData) {
  if (!hasSupabasePublicEnv) {
    redirect(buildFeedbackPath(LOGIN_PATH, "error", "Configure as variaveis do Supabase."));
  }

  const email = normalizeText(formData.get("email")).toLowerCase();
  const password = normalizeText(formData.get("password"));
  const clientIp = await getClientIp();

  if (!email || !password) {
    redirect(buildFeedbackPath(LOGIN_PATH, "error", "Informe e-mail e senha."));
  }

  const ipLimit = await enforceRateLimit({
    key: `login:ip:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (ipLimit) {
    redirect(buildFeedbackPath(LOGIN_PATH, "error", ipLimit.message));
  }

  const accountLimit = await enforceRateLimit({
    key: `login:account:${email}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (accountLimit) {
    redirect(buildFeedbackPath(LOGIN_PATH, "error", accountLimit.message));
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
