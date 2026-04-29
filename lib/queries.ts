import "server-only";

import { requireActiveProfile, requireAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Barrel,
  Customer,
  DashboardData,
  DashboardSummaryData,
  Movement,
  MovementPageData,
  PaginatedResult,
  Profile,
} from "@/lib/types";

type BarrelRow = Omit<Barrel, "current_customer"> & {
  current_customer?: Barrel["current_customer"] | Barrel["current_customer"][];
};

type MovementRow = Omit<Movement, "customer" | "performer" | "barrel"> & {
  barrel?: Movement["barrel"] | Movement["barrel"][];
  customer?: Movement["customer"] | Movement["customer"][];
  performer?: Movement["performer"] | Movement["performer"][];
};

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function normalizeBarrel(row: BarrelRow): Barrel {
  return {
    ...row,
    current_customer: firstRelation(row.current_customer),
  };
}

function normalizeMovement(row: MovementRow): Movement {
  return {
    ...row,
    barrel: firstRelation(row.barrel),
    customer: firstRelation(row.customer),
    performer: firstRelation(row.performer),
  };
}

function getRange(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(Math.floor(pageSize), 100)
      : 20;

  return {
    page: safePage,
    pageSize: safePageSize,
    from: (safePage - 1) * safePageSize,
    to: safePage * safePageSize - 1,
  };
}

function buildPaginatedResult<T>(
  items: T[],
  total: number | null,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    total: total ?? items.length,
    page,
    pageSize,
  };
}

function sanitizeSearchTerm(value: string) {
  return value.trim().slice(0, 80).replace(/[%,()]/g, " ");
}

async function getMatchingCustomerIds(term: string) {
  const supabase = await createClient();
  const safeTerm = sanitizeSearchTerm(term);

  if (!safeTerm) {
    return [];
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .or(`name.ilike.%${safeTerm}%,trade_name.ilike.%${safeTerm}%`)
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => item.id);
}

async function getMatchingPerformerIds(term: string) {
  const supabase = await createClient();
  const safeTerm = sanitizeSearchTerm(term);

  if (!safeTerm) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .or(`full_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%`)
    .limit(100);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => item.id);
}

export async function getActiveCustomers(search = "") {
  await requireActiveProfile();
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id, name, trade_name, contact_name, phone, city")
    .eq("is_active", true)
    .order("name");

  const term = sanitizeSearchTerm(search);

  if (term) {
    query = query.or(
      `name.ilike.%${term}%,trade_name.ilike.%${term}%,city.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Customer[];
}

export async function getOpenBarrels(limit = 8) {
  await requireActiveProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barrels")
    .select(
      "id, code, capacity_liters, status, notes, current_customer_id, updated_at, current_customer:customers(name, trade_name)",
    )
    .eq("status", "out")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => normalizeBarrel(item as BarrelRow));
}

export async function searchBarrelByCode(code: string) {
  await requireActiveProfile();
  const supabase = await createClient();

  // Get barrel info
  const { data: barrel, error: barrelError } = await supabase
    .from("barrels")
    .select("id, code, capacity_liters, notes, is_active")
    .eq("code", code.trim().toUpperCase())
    .eq("is_active", true)
    .single();

  if (barrelError) {
    if (barrelError.code === "PGRST116") {
      return null; // Not found
    }
    throw barrelError;
  }

  // Get last movement to determine actual status
  const { data: movements, error: movError } = await supabase
    .from("movements")
    .select("movement_type")
    .eq("barrel_code", barrel.code)
    .order("occurred_at", { ascending: false })
    .limit(1);

  if (movError) {
    throw movError;
  }

  // Determine status from last movement
  let status: "in" | "out" = "in"; // Default to in if no movements
  if (movements && movements.length > 0) {
    status = movements[0].movement_type === "checkin" ? "in" : "out";
  }

  return {
    id: barrel.id,
    code: barrel.code,
    capacity_liters: barrel.capacity_liters,
    notes: barrel.notes,
    is_active: barrel.is_active,
    status,
  };
}

export async function getRecentMovements(limit = 12) {
  await requireActiveProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("movements")
    .select(
      "id, movement_type, notes, occurred_at, barrel_code, barrel:barrels(notes), customer:customers(name, trade_name), performer:profiles!movements_performed_by_fkey(full_name)",
    )
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => normalizeMovement(item as MovementRow));
}

export async function getBarrelStats() {
  await requireActiveProfile();
  const supabase = await createClient();

  const [activeResult, availableResult, openResult] = await Promise.all([
    supabase
      .from("barrels")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("barrels")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("status", "available"),
    supabase
      .from("barrels")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("status", "out"),
  ]);

  const firstError = [
    activeResult.error,
    availableResult.error,
    openResult.error,
  ].find(Boolean);

  if (firstError) {
    throw firstError;
  }

  return {
    activeBarrels: activeResult.count ?? 0,
    availableBarrels: availableResult.count ?? 0,
    openBarrels: openResult.count ?? 0,
  };
}

export async function getCustomerStats() {
  await requireActiveProfile();
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getDashboardSummaryData(): Promise<DashboardSummaryData> {
  const [stats, activeCustomers, openBarrels, recentMovements] =
    await Promise.all([
      getBarrelStats(),
      getCustomerStats(),
      getOpenBarrels(8),
      getRecentMovements(12),
    ]);

  return {
    stats: {
      activeBarrels: stats.activeBarrels,
      availableBarrels: stats.availableBarrels,
      openBarrels: stats.openBarrels,
      activeCustomers,
    },
    openBarrels,
    recentMovements,
  };
}

export async function getMovementPageData(): Promise<MovementPageData> {
  const [activeCustomers, openBarrels, recentMovements] = await Promise.all([
    getActiveCustomers(),
    getOpenBarrels(100),
    getRecentMovements(12),
  ]);

  return {
    activeCustomers,
    openBarrels,
    recentMovements,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const profile = await requireActiveProfile();
  const [activeCustomers, recentMovements, openBarrels] = await Promise.all([
    getActiveCustomers(),
    getRecentMovements(12),
    getOpenBarrels(100),
  ]);

  return {
    profile,
    barrels: openBarrels,
    customers: activeCustomers,
    movements: recentMovements,
  };
}

export async function getBarrelsPageData({
  page = 1,
  pageSize = 20,
  search = "",
  status = "",
  capacity,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  capacity?: number;
}): Promise<PaginatedResult<Barrel>> {
  await requireActiveProfile();
  const supabase = await createClient();
  const range = getRange(page, pageSize);
  const term = sanitizeSearchTerm(search);

  let query = supabase
    .from("barrels")
    .select(
      "id, code, capacity_liters, status, notes, is_active, current_customer_id, updated_at, current_customer:customers(name, trade_name)",
      { count: "exact" },
    )
    .order("code")
    .range(range.from, range.to);

  if (status === "available" || status === "out") {
    query = query.eq("status", status);
  }

  if (capacity === 30 || capacity === 50) {
    query = query.eq("capacity_liters", capacity);
  }

  if (term) {
    const customerIds = await getMatchingCustomerIds(term);

    if (customerIds.length) {
      query = query.or(
        `code.ilike.%${term}%,current_customer_id.in.(${customerIds.join(",")})`,
      );
    } else {
      query = query.ilike("code", `%${term}%`);
    }
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return buildPaginatedResult(
    (data ?? []).map((item) => normalizeBarrel(item as BarrelRow)),
    count,
    range.page,
    range.pageSize,
  );
}

export async function getBarrelById(id: string): Promise<Barrel | null> {
  if (!id || id === "undefined") {
    return null;
  }

  await requireActiveProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barrels")
    .select(
      "id, code, capacity_liters, status, notes, is_active, current_customer_id, updated_at, current_customer:customers(name, trade_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? normalizeBarrel(data as BarrelRow) : null;
}

export async function getCustomersPageData({
  page = 1,
  pageSize = 20,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResult<Customer>> {
  await requireActiveProfile();
  const supabase = await createClient();
  const range = getRange(page, pageSize);
  const term = sanitizeSearchTerm(search);

  let query = supabase
    .from("customers")
    .select(
      "id, name, trade_name, contact_name, phone, city, notes, is_active",
      {
        count: "exact",
      },
    )
    .order("name")
    .range(range.from, range.to);

  if (term) {
    query = query.or(
      `name.ilike.%${term}%,trade_name.ilike.%${term}%,city.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return buildPaginatedResult(
    (data ?? []) as Customer[],
    count,
    range.page,
    range.pageSize,
  );
}

export async function getUsersPageData({
  page = 1,
  pageSize = 20,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResult<Profile>> {
  await requireAdminProfile();
  const supabase = await createClient();
  const range = getRange(page, pageSize);
  const term = sanitizeSearchTerm(search);

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at", {
      count: "exact",
    })
    .order("full_name")
    .range(range.from, range.to);

  if (term) {
    query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return buildPaginatedResult(
    (data ?? []) as Profile[],
    count,
    range.page,
    range.pageSize,
  );
}

export async function getHistoryPageData({
  page = 1,
  pageSize = 25,
  search = "",
  period = "",
  type = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  period?: string;
  type?: string;
}): Promise<PaginatedResult<Movement>> {
  await requireActiveProfile();
  const supabase = await createClient();
  const range = getRange(page, pageSize);
  const term = sanitizeSearchTerm(search);

  let query = supabase
    .from("movements")
    .select(
      "id, movement_type, notes, occurred_at, barrel_code, barrel:barrels(code, notes), customer:customers(name, trade_name), performer:profiles!movements_performed_by_fkey(full_name)",
      { count: "exact" },
    )
    .order("occurred_at", { ascending: false })
    .range(range.from, range.to);

  if (type === "checkout" || type === "checkin") {
    query = query.eq("movement_type", type);
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (period === "today") {
    query = query.gte("occurred_at", startOfToday.toISOString());
  }

  if (period === "7d" || period === "30d") {
    const days = period === "7d" ? 7 : 30;
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    query = query.gte("occurred_at", start.toISOString());
  }

  if (term) {
    const [customerIds, performerIds] = await Promise.all([
      getMatchingCustomerIds(term),
      getMatchingPerformerIds(term),
    ]);

    const filters = [`barrel_code.ilike.%${term}%`, `notes.ilike.%${term}%`];

    if (customerIds.length) {
      filters.push(`customer_id.in.(${customerIds.join(",")})`);
    }

    if (performerIds.length) {
      filters.push(`performed_by.in.(${performerIds.join(",")})`);
    }

    query = query.or(filters.join(","));
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return buildPaginatedResult(
    (data ?? []).map((item) => normalizeMovement(item as MovementRow)),
    count,
    range.page,
    range.pageSize,
  );
}
