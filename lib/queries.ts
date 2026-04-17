import "server-only";

import { requireActiveProfile, requireAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Barrel, Customer, DashboardData, Movement, Profile } from "@/lib/types";

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeBarrel(row: {
  current_customer?: Barrel["current_customer"] | Barrel["current_customer"][];
} & Omit<Barrel, "current_customer">): Barrel {
  return {
    ...row,
    current_customer: firstRelation(row.current_customer),
  };
}

function normalizeMovement(row: {
  customer?: Movement["customer"] | Movement["customer"][];
  performer?: Movement["performer"] | Movement["performer"][];
} & Omit<Movement, "customer" | "performer">): Movement {
  return {
    ...row,
    customer: firstRelation(row.customer),
    performer: firstRelation(row.performer),
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const profile = await requireActiveProfile();
  const supabase = await createClient();

  const [barrels, customers, movements] = await Promise.all([
    supabase
      .from("barrels")
      .select(
        "id, code, capacity_liters, status, notes, is_active, current_customer_id, updated_at, current_customer:customers(id, name, trade_name)",
      )
      .order("code"),
    supabase
      .from("customers")
      .select("id, name, trade_name, contact_name, phone, city, notes, is_active, updated_at")
      .order("name"),
    supabase
      .from("movements")
      .select(
        "id, movement_type, notes, occurred_at, barrel_code, customer:customers(id, name, trade_name), performer:profiles!movements_performed_by_fkey(id, full_name)",
      )
      .order("occurred_at", { ascending: false })
      .limit(12),
  ]);

  const firstError = [barrels.error, customers.error, movements.error].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  return {
    profile,
    barrels: (barrels.data ?? []).map((item) => normalizeBarrel(item as never)),
    customers: (customers.data ?? []) as Customer[],
    movements: (movements.data ?? []).map((item) => normalizeMovement(item as never)),
  };
}

export async function getBarrels(search = "") {
  await requireActiveProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barrels")
    .select(
      "id, code, capacity_liters, status, notes, is_active, current_customer_id, updated_at, current_customer:customers(id, name, trade_name)",
    )
    .order("code");

  if (error) {
    throw error;
  }

  const barrels = (data ?? []).map((item) => normalizeBarrel(item as never));
  const term = search.trim().toLowerCase();

  if (!term) {
    return barrels;
  }

  return barrels.filter((item) =>
    [item.code, item.current_customer?.name, item.current_customer?.trade_name]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term)),
  );
}

export async function getCustomers(search = "") {
  await requireActiveProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, trade_name, contact_name, phone, city, notes, is_active, updated_at")
    .order("name");

  if (error) {
    throw error;
  }

  const customers = (data ?? []) as Customer[];
  const term = search.trim().toLowerCase();

  if (!term) {
    return customers;
  }

  return customers.filter((item) =>
    [item.name, item.trade_name, item.city, item.phone]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term)),
  );
}

export async function getUsers(search = "") {
  await requireAdminProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .order("full_name");

  if (error) {
    throw error;
  }

  const users = (data ?? []) as Profile[];
  const term = search.trim().toLowerCase();

  if (!term) {
    return users;
  }

  return users.filter((item) =>
    [item.full_name, item.email]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term)),
  );
}

export async function getHistory(search = "") {
  await requireActiveProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("movements")
    .select(
      "id, movement_type, notes, occurred_at, barrel_code, customer:customers(id, name, trade_name), performer:profiles!movements_performed_by_fkey(id, full_name)",
    )
    .order("occurred_at", { ascending: false })
    .limit(250);

  if (error) {
    throw error;
  }

  const movements = (data ?? []).map((item) => normalizeMovement(item as never));
  const term = search.trim().toLowerCase();

  if (!term) {
    return movements;
  }

  return movements.filter((item) =>
    [
      item.barrel_code,
      item.notes,
      item.customer?.name,
      item.customer?.trade_name,
      item.performer?.full_name,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term)),
  );
}
