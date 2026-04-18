"use client";

import {
  keepPreviousData,
  useQuery,
  type QueryClient,
} from "@tanstack/react-query";

import { fetchJson } from "@/lib/client-api";
import { queryKeys } from "@/lib/query-keys";
import type {
  Barrel,
  Customer,
  DashboardSummaryData,
  Movement,
  MovementPageData,
  PaginatedResult,
  Profile,
} from "@/lib/types";

export const DEFAULT_LIST_PAGE = 1;
export const DEFAULT_LIST_PAGE_SIZE = 10;
export const DEFAULT_HISTORY_PAGE_SIZE = 15;

async function fetchDashboardSummary() {
  return fetchJson<DashboardSummaryData>("/api/dashboard/summary");
}

async function fetchMovementPageData() {
  return fetchJson<MovementPageData>("/api/dashboard/movement-page");
}

async function fetchBarrels(search: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    q: search,
    page: String(page),
    pageSize: String(pageSize),
  });

  return fetchJson<PaginatedResult<Barrel>>(`/api/barrels?${params.toString()}`);
}

async function fetchCustomers(search: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    q: search,
    page: String(page),
    pageSize: String(pageSize),
  });

  return fetchJson<PaginatedResult<Customer>>(`/api/customers?${params.toString()}`);
}

async function fetchUsers(search: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    q: search,
    page: String(page),
    pageSize: String(pageSize),
  });

  return fetchJson<PaginatedResult<Profile>>(`/api/users?${params.toString()}`);
}

async function fetchHistory(search: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    q: search,
    page: String(page),
    pageSize: String(pageSize),
  });

  return fetchJson<PaginatedResult<Movement>>(`/api/history?${params.toString()}`);
}

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.dashboardSummary(),
    queryFn: fetchDashboardSummary,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMovementPageQuery() {
  return useQuery({
    queryKey: queryKeys.movementPage(),
    queryFn: fetchMovementPageData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBarrelsQuery(search: string, page = DEFAULT_LIST_PAGE, pageSize = DEFAULT_LIST_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.barrels(search, page, pageSize),
    queryFn: () => fetchBarrels(search, page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomersQuery(
  search: string,
  page = DEFAULT_LIST_PAGE,
  pageSize = DEFAULT_LIST_PAGE_SIZE,
) {
  return useQuery({
    queryKey: queryKeys.customers(search, page, pageSize),
    queryFn: () => fetchCustomers(search, page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUsersQuery(search: string, page = DEFAULT_LIST_PAGE, pageSize = DEFAULT_LIST_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.users(search, page, pageSize),
    queryFn: () => fetchUsers(search, page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHistoryQuery(
  search: string,
  page = DEFAULT_LIST_PAGE,
  pageSize = DEFAULT_HISTORY_PAGE_SIZE,
) {
  return useQuery({
    queryKey: queryKeys.history(search, page, pageSize),
    queryFn: () => fetchHistory(search, page, pageSize),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });
}

export function prefetchRouteData(
  queryClient: QueryClient,
  href: string,
  role: Profile["role"],
  search = "",
) {
  if (href === "/dashboard") {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.dashboardSummary(),
      queryFn: fetchDashboardSummary,
      staleTime: 1000 * 60 * 5,
    });
  }

  if (href === "/dashboard/movimentacoes") {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.movementPage(),
      queryFn: fetchMovementPageData,
      staleTime: 1000 * 60 * 5,
    });
  }

  if (href === "/dashboard/historico") {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.history(search, DEFAULT_LIST_PAGE, DEFAULT_HISTORY_PAGE_SIZE),
      queryFn: () => fetchHistory(search, DEFAULT_LIST_PAGE, DEFAULT_HISTORY_PAGE_SIZE),
      staleTime: 1000 * 60 * 5,
    });
  }

  if (href === "/dashboard/barris") {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.barrels(search, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE),
      queryFn: () => fetchBarrels(search, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE),
      staleTime: 1000 * 60 * 5,
    });
  }

  if (href === "/dashboard/clientes") {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.customers(search, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE),
      queryFn: () => fetchCustomers(search, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE),
      staleTime: 1000 * 60 * 5,
    });
  }

  if (href === "/dashboard/usuarios" && role === "admin") {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.users(search, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE),
      queryFn: () => fetchUsers(search, DEFAULT_LIST_PAGE, DEFAULT_LIST_PAGE_SIZE),
      staleTime: 1000 * 60 * 5,
    });
  }

  return Promise.resolve();
}
