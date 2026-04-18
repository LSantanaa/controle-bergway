"use server";

import { requireAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import {
  normalizeNullableText,
  normalizePositiveNumber,
  normalizeText,
} from "@/lib/utils";

export async function saveBarrelAction(formData: FormData): Promise<ActionResult> {
  await requireAdminProfile();

  const supabase = await createClient();
  const barrelId = normalizeText(formData.get("barrelId"));
  const code = normalizeText(formData.get("code")).toUpperCase();
  const capacity = normalizePositiveNumber(formData.get("capacity_liters"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!code || !capacity) {
    return { status: "error", message: "Código e capacidade são obrigatórios." };
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
    return { status: "error", message: "Não foi possível salvar." };
  }

  return {
    status: "success",
    message: barrelId ? "Equipamento atualizado." : "Equipamento cadastrado.",
  };
}

export async function toggleBarrelAction(formData: FormData): Promise<ActionResult> {
  await requireAdminProfile();

  const supabase = await createClient();
  const barrelId = normalizeText(formData.get("barrelId"));

  const { data: barrel, error: fetchError } = await supabase
    .from("barrels")
    .select("id, is_active, status")
    .eq("id", barrelId)
    .maybeSingle();

  if (fetchError || !barrel) {
    return { status: "error", message: "Equipamento não encontrado." };
  }

  if (barrel.is_active && barrel.status === "out") {
    return { status: "error", message: "Não arquive um equipamento que ainda está com cliente." };
  }

  const { error } = await supabase
    .from("barrels")
    .update({ is_active: !barrel.is_active })
    .eq("id", barrelId);

  if (error) {
    return { status: "error", message: "Não foi possível alterar o status do equipamento." };
  }

  return {
    status: "success",
    message: barrel.is_active ? "Equipamento arquivado." : "Equipamento reativado.",
  };
}

export async function deleteBarrelAction(formData: FormData): Promise<ActionResult> {
  await requireAdminProfile();

  const supabase = await createClient();
  const barrelId = normalizeText(formData.get("barrelId"));

  const [{ data: barrel }, { count }] = await Promise.all([
    supabase.from("barrels").select("id, status").eq("id", barrelId).maybeSingle(),
    supabase.from("movements").select("id", { count: "exact", head: true }).eq("barrel_id", barrelId),
  ]);

  if (!barrel) {
    return { status: "error", message: "Equipamento não encontrado." };
  }

  if (barrel.status === "out") {
    return { status: "error", message: "Um equipamento em uso não pode ser excluído." };
  }

  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message: "Esse equipamento já possui histórico. Use arquivar em vez de excluir.",
    };
  }

  const { error } = await supabase.from("barrels").delete().eq("id", barrelId);

  if (error) {
    return { status: "error", message: "Não foi possível excluir o equipamento." };
  }

  return { status: "success", message: "Equipamento excluído com sucesso." };
}
