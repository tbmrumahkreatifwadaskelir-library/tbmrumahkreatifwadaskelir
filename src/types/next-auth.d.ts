import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: number;
    token: string;
    role: "admin" | "member";
    status: string;
    avatar_url?: string | null;
    address?: string | null;
    phone?: string | null;
    member?: {
      id: number;
      member_code: string;
      nik_nisn: string;
      id_type: string;
      birth_date: string;
      age: number;
      age_category: string;
      guardian_name: string | null;
      verification_status: string;
      verified_at: string | null;
    } | null;
  }

  interface Session {
    user: {
      id: number;
      name: string;
      email: string;
      token: string;
      role: "admin" | "member";
      status: string;
      avatar_url?: string | null;
      address?: string;
      phone?: string;
      member?: {
        id: number;
        member_code: string;
        nik_nisn: string;
        id_type: string;
        birth_date: string;
        age: number;
        age_category: string;
        guardian_name: string | null;
        verification_status: string;
        verified_at: string | null;
      } | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    token: string;
    role: "admin" | "member";
    status: string;
    avatar_url?: string | null;
    address?: string;
    phone?: string;
    member?: {
      id: number;
      member_code: string;
      nik_nisn: string;
      id_type: string;
      birth_date: string;
      age: number;
      age_category: string;
      guardian_name: string | null;
      verification_status: string;
      verified_at: string | null;
    } | null;
  }
}
