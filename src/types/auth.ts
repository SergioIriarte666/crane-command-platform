export type AppRole = 'super_admin' | 'admin' | 'dispatcher' | 'operator';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color?: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  plan?: 'basic' | 'professional' | 'enterprise';
  is_active: boolean;
  is_trial?: boolean;
  trial_ends_at?: string;
  max_users?: number;
  max_cranes?: number;
  max_operators?: number | null;
  folio_format?: string;
  next_folio_number?: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_active: boolean;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string | null;
  role: AppRole;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  roles: AppRole[];
  tenant: Tenant | null;
}
