"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildFeedbackPath,
  normalizeNullableText,
  normalizePositiveNumber,
  normalizeText,
} from "@/lib/utils";

const BASE_PATH = "/dashboard/barris";

function finish(type: "success" | "error", message: string) {
  redirect(buildFeedbackPath(BASE_PATH, type, message));
}

function refreshAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/movimentacoes");
  revalidatePath(BASE_PATH);
}

export async function saveBarrelAction(formData: FormData) {
  await requireAdminProfile();

  const supabase = await createClient();
  const barrelId = normalizeText(formData.get("barrelId"));
  const code = normalizeText(formData.get("code")).toUpperCase();
  const capacity = normalizePositiveNumber(formData.get("capacity_liters"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!code || !capacity) {
    finish("error", "Código e capacidade são obrigatórios.");
  }

  const payload = {
    code,
    capacity_liters: capacity,
    notes,
  };

  const query = barrelId
    ? supabase.from("barrels").update(payload).eq("id", barrelId)
    : supabase.from("barrels").insert(payload);

  const { error } = await query;

  if (error) {
    finish("error", "Não foi possível salvar.");
  }

  refreshAll();
  finish("success", barrelId ? "Equipamento atualizado." : "Equipamento cadastrado.");
}

export async function toggleBarrelAction(formData: FormData) {
  await requireAdminProfile();

  const supabase = await createClient();
  const barrelId = normalizeText(formData.get("barrelId"));

  const { data: barrel, error: fetchError } = await supabase
    .from("barrels")
    .select("id, is_active, status")
    .eq("id", barrelId)
    .maybeSingle();

  if (fetchError || !barrel) {
    finish("error", "Equipamento não encontrado.");
  }

  const currentBarrel = barrel!;

  if (currentBarrel.is_active && currentBarrel.status === "out") {
    finish("error", "Não arquive um equipamento que ainda está com cliente.");
  }

  const { error } = await supabase
    .from("barrels")
    .update({ is_active: !currentBarrel.is_active })
    .eq("id", barrelId);

  if (error) {
    finish("error", "Não foi possível alterar o status do equipamento.");
  }

  refreshAll();
  finish("success", currentBarrel.is_active ? "Equipamento arquivado." : "Equipamento reativado.");
}

export async function deleteBarrelAction(formData: FormData) {
  await requireAdminProfile();

  const supabase = await createClient();
  const barrelId = normalizeText(formData.get("barrelId"));

  const [{ data: barrel }, { count }] = await Promise.all([
    supabase
      .from("barrels")
      .select("id, status")
      .eq("id", barrelId)
      .maybeSingle(),
    supabase
      .from("movements")
      .select("id", { count: "exact", head: true })
      .eq("barrel_id", barrelId),
  ]);

  if (!barrel) {
    finish("error", "Equipamento não encontrado.");
  }

  const currentBarrel = barrel!;

  if (currentBarrel.status === "out") {
    finish("error", "Um equipamento em uso não pode ser excluído.");
  }

  if ((count ?? 0) > 0) {
    finish("error", "Esse equipamento já possui histórico. Use arquivar em vez de excluir.");
  }

  const { error } = await supabase.from("barrels").delete().eq("id", barrelId);

  if (error) {
    finish("error", "Não foi possível excluir o equipamento.");
  }

  refreshAll();
  finish("success", "Equipamento excluído com sucesso.");
}
