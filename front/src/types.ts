export type Role = "admin" | "employee" | "client";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active?: number;
  deactivation_reason?: string;
  deactivated_at?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  tenant: string; // slug
}

export interface Settings {
  display_name: string;
  logo_url?: string;
  theme_json?: { primary?: string };
  features_json?: string[]; // por simplicidad
}

export interface Client {
  id: number;
  full_name: string;
  email: string;
  nit: string;
  is_active: boolean;
}

export interface Invoice {
  id: number;
  invoice_year: number;
  invoice_month: number;
  total_due: number;
  amount_paid: number;
  balance: number;
  payment_status: "paid" | "pending" | "overdue" | "partial";
}

export type BrigadeRow = {
  client_id: number;
  name: string;
  nit: string | null;
  sat_password: string | null;

  invoice: null | {
    id: number;
    year: number;
    month: number;
    total_due: number;
    amount_paid: number;
    balance: number;
    payment_status: string;
    observations: string;
  };

  artifacts: { factura: boolean; rectificador: boolean };

  checklist: { id: number; service_id: number; name: string; status: 'done'|'todo' }[];

  checklist_progress: { done: number; total: number; ok: boolean };
};
