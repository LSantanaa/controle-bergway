export const queryKeys = {
  dashboardSummary: () => ["dashboard", "summary"] as const,
  movementPage: () => ["dashboard", "movement-page"] as const,
  barrels: (search: string, page: number, pageSize: number) =>
    ["barrels", search, page, pageSize] as const,
  customers: (search: string, page: number, pageSize: number) =>
    ["customers", search, page, pageSize] as const,
  users: (search: string, page: number, pageSize: number) =>
    ["users", search, page, pageSize] as const,
  history: (search: string, page: number, pageSize: number) =>
    ["history", search, page, pageSize] as const,
};
