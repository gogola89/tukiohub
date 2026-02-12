export interface User {
  id: string;
  email: string;
  company_name: string;
  phone_number: string;
  role: 'ORGANIZER' | 'ADMIN' | 'ATTENDEE';
  logo?: string | null;
  email_verified: boolean;
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verification_documents?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields for backward compatibility (not in API but used in code)
  first_name?: string;
  last_name?: string;
  profile_image?: string;
  is_verified?: boolean;
  approval_status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password2: string;
  phone_number: string;
  company_name: string;
  role: 'ORGANIZER' | 'ADMIN';
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  user_type: 'organizer' | 'admin';
}
