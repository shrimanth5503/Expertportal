export interface UserProfile {
  id: string;
  name: string;
  email: string;
  domain_expertise: string;
  skills: string[];
  years_of_experience: number;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  domain_expertise: string;
  skills: string[];
  years_of_experience: number;
  bio?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
  storageType?: 'supabase' | 'sandbox';
  passwordEncrypted?: boolean;
  warning?: string;
  tableMissing?: boolean;
}

export interface DbStatusResponse {
  configured: boolean;
  supabaseUrl: string | null;
  tableExists: boolean;
  activeStore: 'supabase' | 'sandbox';
  totalUsers: number;
  message: string;
  schemaScript: string;
  sqlEditorUrl?: string;
  directPgConfigured?: boolean;
}

export interface StoredUser extends UserProfile {
  password_hash: string;
}
