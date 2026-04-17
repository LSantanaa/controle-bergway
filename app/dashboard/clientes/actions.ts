"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildFeedbackPath, normalizeNullableText, normalizeText } from "@/lib/utils";

const BASE_PATH = "/dashboard/clientes";

function finish(type: "success" | "error", message: string) {
  redirect(buildFeedbackPath(BASE_PATH, type, message));
}

function refreshAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/movimentacoes");
  revalidatePath(BASE_PATH);
}

export async function saveCustomerAction(formData: FormData) {
  await requireAdminProfile();

  const supabase = await createClient();
  const customerId = normalizeText(formData.get("customerId"));
  const name = normalizeText(formData.get("name"));
  const tradeName = normalizeNullableText(formData.get("trade_name"));
  const contactName = normalizeNullableText(formData.get("contact_name"));
  const phone = normalizeNullableText(formData.get("phone"));
  const city = normalizeNullableText(formData.get("city"));
  const notes = normalizeNullableText(formData.get("notes"));

  if (!name) {
    finish("error", "Nome do cliente é obrigatório.");
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
    finish("error", "Não foi possível salvar o cliente.");
  }

  refreshAll();
  finish("success", customerId ? "Cliente atualizado." : "Cliente cadastrado.");
}

export async function toggleCustomerAction(formData: FormData) {
  await requireAdminProfile();

  const supabase = await createClient();
  const customerId = normalizeText(formData.get("customerId"));

  const [{ data: customer }, { count: openCount }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, is_active")
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("barrels")
      .select("id", { count: "exact", head: true })
      .eq("current_customer_id", customerId)
      .eq("status", "out"),
  ]);

  if (!customer) {
    finish("error", "Cliente não encontrado.");
  }

  const currentCustomer = customer!;

  if (currentCustomer.is_active && (openCount ?? 0) > 0) {
    finish("error", "Esse cliente ainda possui barris em aberto.");
  }

  const { error } = await supabase
    .from("customers")
    .update({ is_active: !currentCustomer.is_active })
    .eq("id", customerId);

  if (error) {
    finish("error", "Não foi possível alterar o status do cliente.");
  }

  refreshAll();
  finish("success", currentCustomer.is_active ? "Cliente arquivado." : "Cliente reativado.");
}

export async function deleteCustomerAction(formData: FormData) {
  await requireAdminProfile();

  const supabase = await createClient();
  const customerId = normalizeText(formData.get("customerId"));

  const [{ count: openCount }, { count: movementCount }] = await Promise.all([
    supabase
      .from("barrels")
      .select("id", { count: "exact", head: true })
      .eq("current_customer_id", customerId)
      .eq("status", "out"),
    supabase
      .from("movements")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId),
  ]);

  if ((openCount ?? 0) > 0) {
    finish("error", "Esse cliente ainda possui barris em aberto.");
  }

  if ((movementCount ?? 0) > 0) {
    finish("error", "Esse cliente já possui histórico. Use arquivar em vez de excluir.");
  }

  const { error } = await supabase.from("customers").delete().eq("id", customerId);

  if (error) {
    finish("error", "Não foi possível excluir o cliente.");
  }

  refreshAll();
  finish("success", "Cliente excluído com sucesso.");
}
