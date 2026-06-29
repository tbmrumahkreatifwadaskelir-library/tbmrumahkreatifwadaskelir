export interface User {
  id: number;
  role_id?: number;
  role?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  status: string | number;
  roles?: { id: number; name: string }[];
  role_name?: string;
  email_verified_at?: string | null;
  created_at?: string;
  member?: {
    id: number;
    member_code: string;
    nik_nisn: string;
    id_type: string;
    phone: string | null;
    address: string | null;
    birth_date: string;
    age: number;
    age_category: string;
    guardian_name: string | null;
    verification_status: string;
    verified_at: string | null;
    avatar_url: string | null;
    level?: number;
    exp?: number;
  };
}

export interface CreateUserPayload {
  role_id: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  status: number;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface FormCreateRoleProps {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  initialData?: Role;
  roleName: string;
  setRoleName: (name: string) => void;
  isSubmitting: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  nik_nisn: string;
  id_type: string; // 'ktp' | 'kk' | 'kartu_pelajar'
  phone: string;
  address: string;
  birth_date: string;
  identity_doc: File; // KTP/KK/Kartu Pelajar (jpg, png, pdf max 2MB)
  // Wali (wajib untuk usia < 17 tahun)
  guardian_name?: string;
  guardian_nik?: string;
  guardian_phone?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  address?: string;
  avatar?: File;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ConfirmResetPasswordPayload {
  email: string;
  signature: string;
  password: string;
  password_confirmation: string;
}

export interface ReactivateAccountPayload {
  email: string;
  reason: string;
}

export interface AdminRegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}
