"use server";

import { requireActiveProfile } from "@/lib/auth";
import { enforceRateLimit, getClientIp } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { normalizeNullableText, normalizeText } from "@/lib/utils";
import { searchBarrelByCode } from "@/lib/queries";

export async function registerMovementAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireActiveProfile();
  const clientIp = await getClientIp();
  const limit = await enforceRateLimit({
    key: `movement:create:${profile.id}:${clientIp}`,
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (limit) {
    return limit;
  }

  const supabase = await createClient();
  const barrelCode = normalizeText(formData.get("barrel_code"));
  const movementType = normalizeText(formData.get("movement_type"));
  const customerId = normalizeText(formData.get("customer_id"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!barrelCode || !movementType) {
    return { status: "error", message: "Informe o barril e o tipo de movimentação." };
  }

  if (movementType !== "checkout" && movementType !== "checkin") {
    return { status: "error", message: "Tipo de movimentação inválido." };
  }

  if (movementType === "checkout" && !customerId) {
    return { status: "error", message: "Selecione o cliente para registrar a saída." };
  }

  try {
    const barrel = await searchBarrelByCode(barrelCode);

    if (!barrel) {
      return { status: "error", message: "Barril não encontrado." };
    }

    if (movementType === "checkout" && barrel.status === "out") {
      return {
        status: "error",
        message: `Equipamento "${barrel.code}" indisponível. Já está fora com cliente.`,
      };
    }

    if (movementType === "checkin" && barrel.status !== "out") {
      return {
        status: "error",
        message: `Equipamento "${barrel.code}" não está em saída. Verifique o histórico.`,
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: "Erro ao validar barril.",
    };
  }

  const { error } = await supabase.rpc("register_barrel_movement", {
    p_barrel_code: barrelCode,
    p_movement_type: movementType,
    p_customer_id: movementType === "checkout" ? customerId || null : null,
    p_notes: notes,
  });

  if (error) {
    return {
      status: "error",
      message: error.message || "Não foi possível registrar a movimentação.",
    };
  }

  const successMessage =
    movementType === "checkout"
      ? `Saída registrada para o barril ${barrelCode}. Campos limpos para a próxima operação.`
      : `Entrada registrada para o barril ${barrelCode}. Campos limpos para a próxima operação.`;

  return { status: "success", message: successMessage };
}
