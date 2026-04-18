"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { prefetchRouteData } from "@/lib/hooks/use-app-queries";
import { useDashboardContext } from "@/components/providers/dashboard-provider";

const routes = [
  "/dashboard",
  "/dashboard/movimentacoes",
  "/dashboard/historico",
  "/dashboard/barris",
  "/dashboard/clientes",
  "/dashboard/usuarios",
] as const;

export function DashboardPrefetcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useDashboardContext();

  useEffect(() => {
    routes
      .filter((route) => route !== "/dashboard/usuarios" || profile.role === "admin")
      .forEach((route) => {
        router.prefetch(route);
        void prefetchRouteData(queryClient, route, profile.role);
      });
  }, [profile.role, queryClient, router]);

  return null;
}
