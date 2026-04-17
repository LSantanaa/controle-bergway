"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildFeedbackPath, normalizeNullableText, normalizeText } from "@/lib/utils";

const BASE_PATH = "/dashboard/movimentacoes";

function finish(type: "success" | "error", message: string) {
  redirect(buildFeedbackPath(BASE_PATH, type, message));
}

export async function registerMovementAction(formData: FormData) {
  await requireActiveProfile();

  const supabase = await createClient();
  const barrelCode = normalizeText(formData.get("barrel_code"));
  const movementType = normalizeText(formData.get("movement_type"));
  const customerId = normalizeText(formData.get("customer_id"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!barrelCode || !movementType) {
    finish("error", "Informe o barril e o tipo de movimentação.");
  }

  const { error } = await supabase.rpc("register_barrel_movement", {
    p_barrel_code: barrelCode,
    p_movement_type: movementType,
    p_customer_id: movementType === "checkout" ? customerId || null : null,
    p_notes: notes,
  });

  if (error) {
    finish("error", error.message || "Não foi possível registrar a movimentação.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard/barris");
  revalidatePath(BASE_PATH);
  finish("success", "Movimentação registrada.");
}
