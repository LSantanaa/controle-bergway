"use client";

import { createContext, useContext } from "react";

import type { Profile } from "@/lib/types";

type DashboardContextValue = {
  profile: Profile;
  hasSupabaseAdminEnv: boolean;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

type DashboardProviderProps = DashboardContextValue & {
  children: React.ReactNode;
};

export function DashboardProvider({
  children,
  profile,
  hasSupabaseAdminEnv,
}: DashboardProviderProps) {
  return (
    <DashboardContext.Provider
      value={{
        profile,
        hasSupabaseAdminEnv,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboardContext precisa estar dentro de DashboardProvider.");
  }

  return context;
}
