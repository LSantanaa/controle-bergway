export type UserRole = "admin" | "collaborator";
export type BarrelStatus = "available" | "out";
export type MovementType = "checkout" | "checkin";

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  trade_name: string | null;
  contact_name: string | null;
  phone: string | null;
  city: string | null;
  notes: string | null;
  is_active: boolean;
  updated_at?: string;
}

export interface Barrel {
  id: string;
  code: string;
  capacity_liters: number;
  status: BarrelStatus;
  notes: string | null;
  is_active: boolean;
  current_customer_id: string | null;
  updated_at: string;
  current_customer: Pick<Customer, "id" | "name" | "trade_name"> | null;
}

export interface Movement {
  id: string;
  movement_type: MovementType;
  notes: string | null;
  occurred_at: string;
  barrel_code: string;
  barrel?: { code: string; notes: string | null } | null;
  customer: Pick<Customer, "id" | "name" | "trade_name"> | null;
  performer: Pick<Profile, "id" | "full_name"> | null;
}

export interface DashboardData {
  profile: Profile;
  barrels: Barrel[];
  customers: Customer[];
  movements: Movement[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardSummaryData {
  stats: {
    activeBarrels: number;
    availableBarrels: number;
    openBarrels: number;
    activeCustomers: number;
  };
  openBarrels: Barrel[];
  recentMovements: Movement[];
}

export interface MovementPageData {
  activeCustomers: Customer[];
  openBarrels: Barrel[];
  recentMovements: Movement[];
}

export interface ActionResult {
  status: "success" | "error";
  message: string;
}
