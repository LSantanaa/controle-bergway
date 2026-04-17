"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminProfile, requireSession } from "@/lib/auth";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { buildFeedbackPath, isTruthy, normalizeText } from "@/lib/utils";

const BASE_PATH = "/dashboard/usuarios";

function finish(type: "success" | "error", message: string) {
  redirect(buildFeedbackPath(BASE_PATH, type, message));
}

function refreshAll() {
  revalidatePath("/dashboard");
  revalidatePath(BASE_PATH);
}

export async function saveUserAction(formData: FormData) {
  await requireAdminProfile();

  const supabase = await createClient();
  const userId = normalizeText(formData.get("userId"));
  const fullName = normalizeText(formData.get("full_name"));
  const email = normalizeText(formData.get("email")).toLowerCase();
  const password = normalizeText(formData.get("password"));
  const role = normalizeText(formData.get("role"));
  const isActive = isTruthy(formData.get("is_active"));

  if (!fullName || !email || !role) {
    finish("error", "Nome, e-mail e perfil são obrigatórios.");
  }

  if (!userId && password.length < 6) {
    finish("error", "Defina uma senha com pelo menos 6 caracteres.");
  }

  if (!userId) {
    if (!hasSupabaseAdminEnv) {
      finish("error", "Falta configurar a SUPABASE_SECRET_KEY para criar usuários.");
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
      finish("error", "Não foi possível criar o usuário.");
    }

    const createdUser = data.user!;

    const { error: profileError } = await admin.from("profiles").upsert({
      id: createdUser.id,
      email,
      full_name: fullName,
      role,
      is_active: isActive,
    });

    if (profileError) {
      finish("error", "Usuário criado, mas o perfil não pôde ser sincronizado.");
    }

    refreshAll();
    finish("success", "Usuário criado com sucesso.");
  }

  const { data: currentUser } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  const emailChanged = Boolean(currentUser?.email && currentUser.email !== email);
  const needsAdminAuthUpdate = emailChanged || Boolean(password);

  if (needsAdminAuthUpdate && !hasSupabaseAdminEnv) {
    finish("error", "Falta configurar a SUPABASE_SECRET_KEY para alterar e-mail ou senha.");
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
      finish("error", "Não foi possível atualizar as credenciais do usuário.");
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
    finish("error", "Não foi possível atualizar o usuário.");
  }

  refreshAll();
  finish("success", "Usuário atualizado.");
}

export async function deleteUserAction(formData: FormData) {
  await requireAdminProfile();

  if (!hasSupabaseAdminEnv) {
    finish("error", "Falta configurar a SUPABASE_SECRET_KEY para excluir usuários.");
  }

  const session = await requireSession();
  const supabase = await createClient();
  const userId = normalizeText(formData.get("userId"));

  if (session.userId === userId) {
    finish("error", "Não é uma boa ideia excluir o próprio usuário administrador.");
  }

  const { count } = await supabase
    .from("movements")
    .select("id", { count: "exact", head: true })
    .eq("performed_by", userId);

  if ((count ?? 0) > 0) {
    finish("error", "Esse usuário já operou movimentações. Desative em vez de excluir.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId, false);

  if (error) {
    finish("error", "Não foi possível excluir o usuário.");
  }

  refreshAll();
  finish("success", "Usuário excluído com sucesso.");
}
