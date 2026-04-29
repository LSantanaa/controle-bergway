"use server";

import { requireAdminProfile } from "@/lib/auth";
import { enforceRateLimit, getClientIp } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { normalizeNullableText, normalizeText } from "@/lib/utils";

export async function saveCustomerAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const clientIp = await getClientIp();
  const limit = await enforceRateLimit({
    key: `admin:customer:save:${profile.id}:${clientIp}`,
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (limit) {
    return limit;
  }

  const supabase = await createClient();
  const customerId = normalizeText(formData.get("customerId"));
  const name = normalizeText(formData.get("name"));
  const tradeName = normalizeNullableText(formData.get("trade_name"));
  const contactName = normalizeNullableText(formData.get("contact_name"));
  const phone = normalizeNullableText(formData.get("phone"));
  const city = normalizeNullableText(formData.get("city"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!name) {
    return { status: "error", message: "Nome do cliente é obrigatório." };
  }

  if (name.length > 160 || (phone?.length ?? 0) > 40) {
    return { status: "error", message: "Nome ou telefone fora do limite permitido." };
  }

  const payload = {
    name,
    trade_name: tradeName,
    contact_name: contactName,
    phone,
    city,
    notes,
  };

  const query = customerId
    ? supabase.from("customers").update(payload).eq("id", customerId)
    : supabase.from("customers").insert(payload);

  const { error } = await query;

  if (error) {
    return { status: "error", message: "Não foi possível salvar o cliente." };
  }

  return {
    status: "success",
    message: customerId ? "Cliente atualizado." : "Cliente cadastrado.",
  };
}

export async function toggleCustomerAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const clientIp = await getClientIp();
  const limit = await enforceRateLimit({
    key: `admin:customer:toggle:${profile.id}:${clientIp}`,
    limit: 40,
    windowMs: 10 * 60 * 1000,
  });

  if (limit) {
    return limit;
  }

  const supabase = await createClient();
  const customerId = normalizeText(formData.get("customerId"));

  const [{ data: customer }, { count: openCount }] = await Promise.all([
    supabase.from("customers").select("id, is_active").eq("id", customerId).maybeSingle(),
    supabase
      .from("barrels")
      .select("id", { count: "exact", head: true })
      .eq("current_customer_id", customerId)
      .eq("status", "out"),
  ]);

  if (!customer) {
    return { status: "error", message: "Cliente não encontrado." };
  }

  if (customer.is_active && (openCount ?? 0) > 0) {
    return { status: "error", message: "Esse cliente ainda possui barris em aberto." };
  }

  const { error } = await supabase
    .from("customers")
    .update({ is_active: !customer.is_active })
    .eq("id", customerId);

  if (error) {
    return { status: "error", message: "Não foi possível alterar o status do cliente." };
  }

  return {
    status: "success",
    message: customer.is_active ? "Cliente arquivado." : "Cliente reativado.",
  };
}

export async function deleteCustomerAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireAdminProfile();
  const clientIp = await getClientIp();
  const limit = await enforceRateLimit({
    key: `admin:customer:delete:${profile.id}:${clientIp}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (limit) {
    return limit;
  }

  const supabase = await createClient();
  const customerId = normalizeText(formData.get("customerId"));

  const [{ count: openCount }, { count: movementCount }] = await Promise.all([
    supabase
      .from("barrels")
      .select("id", { count: "exact", head: true })
      .eq("current_customer_id", customerId)
      .eq("status", "out"),
    supabase.from("movements").select("id", { count: "exact", head: true }).eq("customer_id", customerId),
  ]);

  if ((openCount ?? 0) > 0) {
    return { status: "error", message: "Esse cliente ainda possui barris em aberto." };
  }

  if ((movementCount ?? 0) > 0) {
    return {
      status: "error",
      message: "Esse cliente já possui histórico. Use arquivar em vez de excluir.",
    };
  }

  const { error } = await supabase.from("customers").delete().eq("id", customerId);

  if (error) {
    return { status: "error", message: "Não foi possível excluir o cliente." };
  }

  return { status: "success", message: "Cliente excluído com sucesso." };
}
