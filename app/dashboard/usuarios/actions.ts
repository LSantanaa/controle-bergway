"use server";

import { requireAdminProfile, requireSession } from "@/lib/auth";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { enforceRateLimit, getClientIp } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { isTruthy, normalizeText } from "@/lib/utils";

export async function saveUserAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const clientIp = await getClientIp();
  const limit = await enforceRateLimit({
    key: `admin:user:save:${profile.id}:${clientIp}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (limit) {
    return limit;
  }

  const supabase = await createClient();
  const userId = normalizeText(formData.get("userId"));
  const fullName = normalizeText(formData.get("full_name"));
  const email = normalizeText(formData.get("email")).toLowerCase();
  const password = normalizeText(formData.get("password"));
  const role = normalizeText(formData.get("role"));
  const isActive = isTruthy(formData.get("is_active"));

  if (!fullName || !email || !role) {
    return { status: "error", message: "Nome, e-mail e perfil são obrigatórios." };
  }

  if (fullName.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Nome ou e-mail inválido." };
  }

  if (role !== "admin" && role !== "collaborator") {
    return { status: "error", message: "Perfil inválido." };
  }

  if (password && password.length < 8) {
    return { status: "error", message: "Defina uma senha com pelo menos 8 caracteres." };
  }

  if (!userId && !password) {
    return { status: "error", message: "Defina uma senha inicial." };
  }

  if (userId === profile.id && (role !== "admin" || !isActive)) {
    return {
      status: "error",
      message: "Não altere o próprio perfil administrador ou status de acesso.",
    };
  }

  if (!userId) {
    if (!hasSupabaseAdminEnv) {
      return {
        status: "error",
        message: "Falta configurar a SUPABASE_SECRET_KEY para criar usuários.",
      };
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error || !data.user) {
      return { status: "error", message: "Não foi possível criar o usuário." };
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      is_active: isActive,
    });

    if (profileError) {
      return {
        status: "error",
        message: "Usuário criado, mas o perfil não pôde ser sincronizado.",
      };
    }

    return { status: "success", message: "Usuário criado com sucesso." };
  }

  const { data: currentUser } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  const emailChanged = Boolean(currentUser?.email && currentUser.email !== email);
  const needsAdminAuthUpdate = emailChanged || Boolean(password);

  if (needsAdminAuthUpdate && !hasSupabaseAdminEnv) {
    return {
      status: "error",
      message: "Falta configurar a SUPABASE_SECRET_KEY para alterar e-mail ou senha.",
    };
  }

  if (needsAdminAuthUpdate) {
    const admin = createAdminClient();
    const authPayload: {
      email?: string;
      password?: string;
      user_metadata?: { full_name: string };
    } = {
      user_metadata: {
        full_name: fullName,
      },
    };

    if (emailChanged) {
      authPayload.email = email;
    }

    if (password) {
      authPayload.password = password;
    }

    const { error } = await admin.auth.admin.updateUserById(userId, authPayload);

    if (error) {
      return {
        status: "error",
        message: "Não foi possível atualizar as credenciais do usuário.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      email,
      full_name: fullName,
      role,
      is_active: isActive,
    })
    .eq("id", userId);

  if (error) {
    return { status: "error", message: "Não foi possível atualizar o usuário." };
  }

  return { status: "success", message: "Usuário atualizado." };
}

export async function deleteUserAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const clientIp = await getClientIp();
  const limit = await enforceRateLimit({
    key: `admin:user:delete:${profile.id}:${clientIp}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });

  if (limit) {
    return limit;
  }

  if (!hasSupabaseAdminEnv) {
    return {
      status: "error",
      message: "Falta configurar a SUPABASE_SECRET_KEY para excluir usuários.",
    };
  }

  const session = await requireSession();
  const supabase = await createClient();
  const userId = normalizeText(formData.get("userId"));

  if (session.userId === userId) {
    return {
      status: "error",
      message: "Não é uma boa ideia excluir o próprio usuário administrador.",
    };
  }

  const { count } = await supabase
    .from("movements")
    .select("id", { count: "exact", head: true })
    .eq("performed_by", userId);

  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message: "Esse usuário já operou movimentações. Desative em vez de excluir.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId, false);

  if (error) {
    return { status: "error", message: "Não foi possível excluir o usuário." };
  }

  return { status: "success", message: "Usuário excluído com sucesso." };
}
