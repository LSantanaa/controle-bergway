"use server";

import { requireActiveProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { normalizeNullableText, normalizeText } from "@/lib/utils";
import { searchBarrelByCode } from "@/lib/queries";

export async function registerMovementAction(formData: FormData): Promise<ActionResult> {
  await requireActiveProfile();

  const supabase = await createClient();
  const barrelCode = normalizeText(formData.get("barrel_code"));
  const movementType = normalizeText(formData.get("movement_type"));
  const customerId = normalizeText(formData.get("customer_id"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!barrelCode || !movementType) {
    return { status: "error", message: "Informe o barril e o tipo de movimentação." };
  }

  // Validate barrel exists and is available
  try {
    const barrel = await searchBarrelByCode(barrelCode);
    
    if (!barrel) {
      return { status: "error", message: "Barril não encontrado." };
    }

    // If checkout (saída), barrel must be available (status = 'in')
    if (movementType === "checkout" && barrel.status === "out") {
      return { 
        status: "error", 
        message: `Equipamento "${barrel.code}" indisponível. Já está fora com cliente.` 
      };
    }

    // If checkin (entrada), barrel must be out (status = 'out')
    if (movementType === "checkin" && barrel.status !== "out") {
      return { 
        status: "error", 
        message: `Equipamento "${barrel.code}" não está em saída. Verifique o histórico.` 
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

  return { status: "success", message: "Movimentação registrada." };
}
